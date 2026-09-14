# Modelo conceptual

Este documento descreve as entidades do domínio, os seus atributos essenciais e as
relações entre elas, independentemente de qualquer motor de base de dados. A
implementação real (Prisma + SQLite) está em `docs/02-modelo-logico.md` e
`docs/03-modelo-fisico.md`.

## Diagrama entidade-relação

```mermaid
erDiagram
    FAMILIA ||--o{ UTILIZADOR : "tem"
    FAMILIA ||--o{ CATEGORIA : "personaliza"
    FAMILIA ||--o{ PERIODO_ORCAMENTO : "planeia"
    FAMILIA ||--o{ MOVIMENTO : "regista"
    FAMILIA ||--o{ REGRA_ALERTA : "define"
    FAMILIA ||--o{ ALERTA : "recebe"

    UTILIZADOR ||--o{ MOVIMENTO : "regista"
    UTILIZADOR ||--o{ PERIODO_ORCAMENTO : "cria"
    UTILIZADOR ||--o{ REFRESH_TOKEN : "autentica"

    CATEGORIA ||--o{ CATEGORIA : "subcategoriza (Grupo > Subcategoria > Rubrica)"
    CATEGORIA ||--o{ LINHA_ORCAMENTADA : "é planeada em"
    CATEGORIA ||--o{ MOVIMENTO : "classifica"
    CATEGORIA ||--o{ REGRA_ALERTA : "tem limiar próprio"

    PERIODO_ORCAMENTO ||--o{ LINHA_ORCAMENTADA : "contém"
    PERIODO_ORCAMENTO ||--o{ ALERTA : "gera"

    LINHA_ORCAMENTADA ||--o{ MOVIMENTO : "é cumprida por (opcional)"

    FAMILIA {
        string id PK
        string nome "nome de exibição, ex. Costa Filipe"
        string codigoLogin UK "nome normalizado, ex. COSTAFILIPES"
        string moeda "AOA por omissão"
    }
    UTILIZADOR {
        string id PK
        string familiaId FK "NULL apenas para GESTOR"
        string nome
        string email UK
        string papel "GESTOR | ADMIN | MEMBRO"
    }
    CATEGORIA {
        string id PK
        string familiaId FK "NULL = categoria global MINFIN"
        string parentId FK "auto-referência"
        string nome
        string nivel "GRUPO | SUBCATEGORIA | RUBRICA"
        string tipo "RECEITA | DESPESA"
    }
    PERIODO_ORCAMENTO {
        string id PK
        string familiaId FK
        string tipo "MENSAL | TRIMESTRAL | SEMESTRAL | ANUAL"
        string referencia "ex.: 2026-01, 2026-T1"
        date dataInicio
        date dataFim
        string estado "RASCUNHO | ATIVO | FECHADO"
    }
    LINHA_ORCAMENTADA {
        string id PK
        string periodoOrcamentoId FK
        string categoriaId FK "nível RUBRICA"
        float valorPlaneado
    }
    MOVIMENTO {
        string id PK
        string familiaId FK
        string categoriaId FK
        string linhaOrcamentadaId FK "NULL = não prevista"
        date data
        float valor
        string tipo "RECEITA | DESPESA"
    }
    REGRA_ALERTA {
        string id PK
        string familiaId FK
        string categoriaId FK "opcional"
        string ambito "CATEGORIA | GRUPO | ORCAMENTO_GLOBAL"
        float limiarAvisoPct "omissão 80"
        float limiarCriticoPct "omissão 100"
    }
    ALERTA {
        string id PK
        string familiaId FK
        string periodoOrcamentoId FK
        string categoriaId FK "NULL = alerta global do período"
        string nivel "AVISO | CRITICO | RISCO_RUTURA"
        string mensagem
    }
```

## Entidades

### Familia
A fronteira de "tenant" da aplicação — um **agregado familiar** (ex.: "COSTAFILIPES"):
tudo o resto pertence a uma família. Guarda a moeda usada nos relatórios (AOA por
omissão, dado o contexto do documento MINFIN). `nome` é a forma de exibição (a que o
gestor escreveu, ex. "Costa Filipe"); `codigoLogin` é a forma normalizada — maiúsculas,
sem acentos — usada para identificar o agregado no ecrã de login, para que "Costa
Filipe", "costa filipe" e "COSTA FILIPE" apontem sempre ao mesmo agregado (ver
`apps/backend/src/lib/agregado.ts`).

### Utilizador
Uma pessoa com acesso à aplicação. Tem um **papel** (valor guardado na base de dados —
a coluna "Rótulo na interface" mostra como aparece ao utilizador, para não confundir
com o papel `GESTOR`, que é outra coisa):

| Valor (`papel`) | Rótulo na interface | Quem é |
|---|---|---|
| `GESTOR` | "Gestor da aplicação" | Não pertence a nenhum agregado (`familiaId = NULL`). Cadastra agregados por conta de outrem (ex.: suporte) e pode cadastrar mais gestores — todos pares entre si, sem hierarquia. A primeira conta nasce de variáveis de ambiente no arranque (ver `docs/03-modelo-fisico.md`); as seguintes, de um gestor já existente. |
| `ADMIN` | **"Gestor do Agregado"** | O "Chefe de Agregado" — pai, mãe, ou quem for responsável por pagar as contas dessa família. **Auto-regista-se** (`POST /api/auth/registar`, ecrã "Criar o seu agregado"): não precisa de nenhum `GESTOR` para nascer. Ao auto-registar-se, cria o seu próprio agregado (sugerindo o nome; a aplicação sugere uma alternativa se já estiver ocupado) e fica automaticamente `ADMIN` desse agregado, com o `nome` igual ao email indicado. Pode criar orçamentos, ajustar linhas orçamentadas, e cadastrar mais membros (`ADMIN` ou `MEMBRO`) **dentro do seu próprio agregado**. |
| `MEMBRO` | "Membro" | Pode registar movimentos e consultar tudo no seu agregado, mas não alterar o plano nem cadastrar outros membros. Só nasce por um `ADMIN` do mesmo agregado. |

O papel `GESTOR` da aplicação continua a poder criar um agregado manualmente
(`POST /api/auth/gestor/agregados`) — útil para suporte a alguém que não consiga
auto-registar-se — mas deixou de ser o único caminho: o caminho normal, para as
famílias reais que usam a aplicação, é o auto-registo.

Um `ADMIN`/`MEMBRO` pertence a exatamente um agregado; um `GESTOR` a nenhum.

### Categoria
Hierarquia de três níveis — **Grupo > Subcategoria > Rubrica** — transcrita
diretamente da planilha-modelo do MINFIN (ver `docs/00-filosofia.md`). É uma única
tabela auto-referenciada (`parentId`), não três tabelas separadas, para poder
representar tanto o caso com subcategoria (ex.: Despesas Fixas > Habitação >
Arrendamento) como o caso sem ela (ex.: Receitas > Salário Base, onde a Rubrica é
filha direta do Grupo). As categorias com `familiaId = NULL` são a árvore-modelo
partilhada por todas as famílias; cada família pode acrescentar as suas próprias por
cima (`familiaId = <a sua família>`), sem nunca poder apagar ou alterar a árvore
global.

### PeriodoOrcamento
Um exercício orçamental de uma família, com uma granularidade (Mensal, Trimestral,
Semestral ou Anual) e um intervalo de datas. Passa por três estados: `RASCUNHO`
(ainda a ser preparado), `ATIVO` (em curso — é contra os períodos `ATIVO` que os
movimentos e alertas são avaliados) e `FECHADO` (histórico, já não recebe alertas).

### LinhaOrcamentada
O valor planeado para **uma** Rubrica dentro de **um** PeriodoOrcamento — a unidade
atómica do domínio orçamental. Não pode haver duas linhas para a mesma
categoria no mesmo período (é o que a família "prometeu a si própria" gastar/receber
naquela rubrica).

### Movimento
Um lançamento real de receita ou despesa, do domínio de registo diário. A decisão de
desenho mais importante deste modelo: **um Movimento não tem uma referência direta a
um PeriodoOrcamento.** Pertence a um período apenas por a sua data cair dentro do
intervalo desse período — o que permite que o mesmo movimento conte, ao mesmo tempo,
para o relatório mensal, o trimestral, o semestral e o anual, sem duplicar dados. Já a
ligação a uma `LinhaOrcamentada` é direta e opcional: presente, o movimento é
**previsto**; `NULL`, é **não previsto** — o conceito de "desejo" vs. "necessidade"
do documento MINFIN tornado num campo de dados.

### RegraAlerta
Personalização, por família, dos limiares que disparam avisos — por omissão 80%
(aviso) e 100% (crítico) do valor planeado, aplicável a uma categoria específica, a um
grupo, ou ao orçamento global.

### Alerta
O resultado do motor de monitorização (`docs/03-modelo-fisico.md`): um aviso
concreto, gerado automaticamente, nunca escrito à mão por um utilizador.

## Cardinalidades-chave

- Uma Família tem muitos Utilizadores (`ADMIN`/`MEMBRO`); um `GESTOR` não pertence a
  nenhuma Família. A aplicação suporta múltiplas Famílias em simultâneo, cada uma
  isolada das outras — nenhuma consulta atravessa agregados.
- Uma Categoria pode ter muitas Categorias-filhas (Grupo→Subcategoria→Rubrica); só as
  Rubricas podem ser planeadas (`LinhaOrcamentada`) ou usadas em `Movimento`.
- Um PeriodoOrcamento tem muitas LinhasOrcamentadas (uma por Rubrica planeada).
- Uma LinhaOrcamentada pode ter zero ou muitos Movimentos ligados (0 = ainda não se
  gastou nada dessa rubrica planeada); um Movimento liga-se a, no máximo, uma
  LinhaOrcamentada.
- Um PeriodoOrcamento pode gerar muitos Alertas ao longo do tempo (histórico).
