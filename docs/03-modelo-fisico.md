# Modelo físico e desenho do SGBD

## Escolha do SGBD: SQLite (via Prisma ORM)

A arquitetura é cliente-servidor: todos os dispositivos da família falam com o mesmo
processo backend, que é quem lê/escreve a base de dados — é isso que dá a
sincronização entre dispositivos pedida para esta aplicação, **não** o motor de base
de dados em si. Por isso escolheu-se SQLite em vez de PostgreSQL/MySQL para o
desenvolvimento e para o auto-alojamento doméstico:

- Zero infraestrutura adicional a instalar/gerir (sem servidor de BD separado, sem
  Docker) — importante porque a máquina onde este projeto foi construído não tinha
  Node, Docker nem Postgres instalados à partida.
- É um SGBD relacional completo (não um "ficheiro simples") — suporta SQL, chaves
  estrangeiras, índices, transações ACID — pelo que os três modelos (conceptual,
  lógico, físico) e a disciplina de desenho continuam a fazer todo o sentido.
- Migração futura para PostgreSQL, se a família quiser um dia um servidor
  multi-utilizador de maior concorrência, é uma troca de uma linha (`provider` e
  `DATABASE_URL` em `apps/backend/prisma/schema.prisma`) — o Prisma abstrai o resto.

**Localização do ficheiro de dados:** propositadamente **fora** da pasta do projeto
(que vive dentro do Dropbox do utilizador), em
`~/.gestao-economia-domestica/dev.db` — um ficheiro SQLite é escrito
continuamente e sem coordenação com o Dropbox; deixá-lo dentro de uma pasta
sincronizada arrisca corrupção se o Dropbox tentar sincronizar a meio de uma escrita.
Ver `README.md`.

## Limitação do SQLite relevante para este esquema: sem `enum` nativo

O conector SQLite do Prisma não suporta o bloco `enum` (só Postgres/MySQL/CockroachDB
suportam). Todos os campos que seriam enums (papel, tipo de período, nível de
categoria, tipo de fluxo, método de pagamento, âmbito de regra, nível de alerta)
ficam como `String` na base de dados. A fonte única de verdade dos valores válidos
está em `packages/shared/src/enums.ts` (schemas Zod), partilhada por backend e
frontend, e é validada na fronteira da API — não na base de dados. Se este esquema for
um dia portado para PostgreSQL, estes campos tornam-se `enum` nativos sem alterar
nenhuma linha de código de negócio (o Zod schema já teria os valores certos).

## Multi-agregado, gestor da aplicação, e login por nome do agregado

Não existe registo público. O ciclo de vida de uma conta é sempre um destes três:

1. **GESTOR** — a *primeira* conta de gestor é criada automaticamente pelo backend no
   arranque (`garantirGestorInicial`, em `apps/backend/src/services/auth.service.ts`),
   a partir de `GESTOR_EMAIL`/`GESTOR_PASSWORD` em `.env`, apenas se ainda não existir
   nenhum utilizador com esse email — é a única forma de a aplicação ter um primeiro
   gestor sem nenhum registo público. Daí em diante, **qualquer gestor pode criar mais
   gestores** via `POST /api/auth/gestor/gestores` (`ConvidarGestorInput`) — são todos
   pares entre si, sem hierarquia adicional. Todas as contas `GESTOR` têm
   `familiaId = NULL`. Autenticam-se em `/api/auth/gestor/login` (só email+password —
   não têm agregado).
2. **ADMIN** — criado pelo gestor via `POST /api/auth/gestor/agregados`
   (`CriarAgregadoInput`), que cria a `Familia` e o seu primeiro `ADMIN` numa só
   operação.
3. **MEMBRO** (ou outro `ADMIN`) — criado por um `ADMIN` já existente do mesmo
   agregado, via `POST /api/auth/membros` (inalterado desde a versão anterior deste
   documento) — continua a ser o próprio agregado a gerir o seu crescimento, só a
   *criação do agregado em si* está centralizada no gestor.

O login normal (`POST /api/auth/login`, `LoginInput`) exige `nomeAgregado` além de
email/password: o backend normaliza esse texto com `normalizarCodigoLogin`
(`apps/backend/src/lib/agregado.ts` — maiúsculas, sem acentos, espaços colapsados),
procura a `Familia` cujo `codigoLogin` bate certo, e só depois procura o `Utilizador`
por email **dentro** dessa família (`findFirst({ email, familiaId })`). Isto significa
que o mesmo email nunca pode existir em duas famílias (a coluna `email` continua
globalmente única), mas a *tentativa* de login sempre passa primeiro pela identidade do
agregado — reflete o pedido de que os agregados sejam "identificados pelo nome".

## Índices

| Tabela | Índice | Motivo |
|---|---|---|
| familias | (codigoLogin) UK | resolver o agregado a partir do nome digitado no login |
| utilizadores | (familiaId) | listar membros de uma família |
| refresh_tokens | (utilizadorId) | revogar todos os tokens de um utilizador |
| categorias | (familiaId) | obter categorias próprias de uma família |
| categorias | (parentId) | construir a árvore (Grupo→Subcategoria→Rubrica) |
| periodos_orcamento | (familiaId) | listar orçamentos de uma família |
| linhas_orcamentadas | (categoriaId) | agregações "quanto se planeou para X em todos os períodos" |
| movimentos | (familiaId, data) | o padrão de consulta mais comum: "movimentos da família num intervalo de datas" (usado por todo o motor de relatórios/alertas) |
| movimentos | (categoriaId) | agregações por categoria |
| movimentos | (linhaOrcamentadaId) | resolver rapidamente "quanto já se gastou desta linha" |
| alertas | (familiaId) | listar alertas de uma família |
| alertas | (periodoOrcamentoId, categoriaId, nivel) | localizar o alerta "atual" de uma categoria num período (idempotência — ver secção seguinte) |

## Regras de eliminação (FK delete rules)

- `utilizadores.familiaId → familias.id`: **RESTRICT** (implícito) — uma família com
  utilizadores não pode ser apagada sem antes remover os utilizadores.
- `linhas_orcamentadas.periodoOrcamentoId → periodos_orcamento.id`: **CASCADE** —
  apagar um período em `RASCUNHO` (ainda não em uso) remove as suas linhas.
- `movimentos.linhaOrcamentadaId → linhas_orcamentadas.id`: **SET NULL** — apagar uma
  linha orçamentada nunca apaga o histórico de despesa real; o movimento passa
  simplesmente a "não previsto".
- `movimentos.categoriaId → categorias.id`: sem cascade — categorias usam soft-delete
  (`ativo = false`) precisamente para nunca invalidar movimentos históricos.
- `alertas.periodoOrcamentoId → periodos_orcamento.id`: **CASCADE** — alertas não têm
  sentido sem o período a que pertencem.

## Idempotência dos alertas sem unique constraint

Seria natural definir `@@unique([periodoOrcamentoId, categoriaId, nivel])` em
`Alerta` para evitar duplicar o "mesmo" alerta. Não se fez isso porque o SQLite trata
cada valor `NULL` como distinto dentro de um índice único — e os alertas de âmbito
`ORCAMENTO_GLOBAL` têm precisamente `categoriaId = NULL`, pelo que essa constraint
nunca impediria duas linhas ambas com `categoriaId = NULL` para o mesmo período. A
deduplicação é feita em aplicação (`apps/backend/src/services/alertas.service.ts`,
função `definirEstadoAlerta`): procura-se o alerta **não lido** existente para aquele
(período, categoria) e atualiza-se ou remove-se, em vez de sempre inserir. Fica
documentado aqui para que uma futura migração para Postgres saiba que pode (e deve)
promover isto a uma unique constraint real.

## Vistas de relatório

Optou-se por **não** criar SQL views nem tabelas materializadas: à escala de dados de
um agregado familiar (dezenas de categorias, algumas centenas de movimentos por ano),
agregações calculadas em JavaScript no momento do pedido
(`apps/backend/src/services/relatorios.service.ts`) são instantâneas e muito mais
simples de manter do que views SQL ou uma estratégia de invalidação de cache. Se o
volume de dados um dia justificar o contrário, os candidatos naturais a
materialização são exatamente as funções `calcularOrcadoRealizado` e
`calcularSaldoMensal`.

## Esquema físico completo

A fonte de verdade do esquema físico é o próprio Prisma schema:
[`apps/backend/prisma/schema.prisma`](../apps/backend/prisma/schema.prisma).

O DDL SQL efetivamente aplicado à base de dados é gerado pelo Prisma em
`apps/backend/prisma/migrations/<timestamp>_inicial/migration.sql` na primeira vez
que se corre `npm run prisma:migrate` (ver `README.md`) — por definição, esse
ficheiro é sempre o retrato exato e atualizado da base de dados física, pelo que este
documento remete para lá em vez de duplicar o SQL (evita as duas versões divergirem
com o tempo).
