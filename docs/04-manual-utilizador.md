# Manual do utilizador

## 1. Instalar e arrancar (primeira vez)

Ver também `README.md` para os comandos exatos. Resumo:

1. Instalar o Node.js 20+ (ex.: `brew install node`, ou `nvm install --lts`).
2. `npm install` na raiz do projeto (instala backend, frontend e o pacote partilhado).
3. Copiar `apps/backend/.env.example` para `apps/backend/.env`.
4. `npm run prisma:migrate` — cria a base de dados SQLite e semeia as categorias-modelo do MINFIN.
5. `npm run prisma:seed` — cria uma família de demonstração (ver credenciais abaixo) — este passo já corre automaticamente a seguir ao `migrate` na primeira vez.
6. `npm run dev` — arranca backend (porta 3333) e frontend (porta 5173) em simultâneo.
7. Abrir `http://localhost:5173` no browser do telemóvel, tablet ou computador (todos na mesma rede Wi-Fi de casa conseguem aceder pelo IP mostrado no terminal, ex. `http://192.168.0.100:5173`).

**Contas de demonstração** (criadas pelo `npm run prisma:seed`):
- Agregado **"Família Demo"** → `ana@familia.demo` / `Demo1234!` (Administrador) e `bruno@familia.demo` / `Demo1234!` (Membro), já com um orçamento mensal e alguns movimentos de exemplo.
- **Gestor da aplicação** → email/password definidos em `GESTOR_EMAIL`/`GESTOR_PASSWORD` no `.env` (criado automaticamente no primeiro arranque do servidor).

## 2. Instalar como aplicação (PWA)

No telemóvel (Android/Chrome): abrir a app no browser, tocar no menu (⋮) e escolher **"Instalar aplicação"** ou **"Adicionar ao ecrã principal"**. No iPhone (Safari): tocar no ícone de partilha e escolher **"Adicionar ao ecrã principal"**. No computador (Chrome/Edge): aparece um ícone de instalação (⊕) na barra de endereço. A partir daí a aplicação abre como um programa independente, com o seu próprio ícone, sem a barra do browser.

## 3. Como nasce um agregado familiar

**Qualquer Chefe de Agregado cria o seu próprio agregado sozinho, sem precisar de ninguém.** Na página de login, tocar em **"Criar o seu agregado"** e preencher:

1. **Nome do agregado** — sugerido pelo próprio (ex.: `COSTAFILIPES`). Se já existir um agregado com esse nome, a aplicação avisa e propõe uma alternativa livre (ex.: "COSTAFILIPES 2") com um botão para a usar diretamente.
2. **O seu email** — este email passa a ser também o seu nome de utilizador na aplicação (não se pede um nome à parte no registo).
3. **Password**, escrita **duas vezes** (password + confirmar password) — só neste ecrã de registo; no login normal escreve-se uma vez só.

Ao tocar em **"Criar agregado"**, fica logo com sessão iniciada, como **Gestor do Agregado** (o Chefe de Agregado — quem paga as contas) desse novo agregado. A partir daí, pode entrar em **Família** e cadastrar mais membros (outros Gestores do Agregado, ou Membros comuns) **dentro do seu próprio agregado**.

O nome do agregado não é sensível a maiúsculas nem a acentos no login: "Costa Filipe", "costa filipe" e "COSTA FILIPE" identificam sempre o mesmo agregado.

### 3.1 O papel do gestor da aplicação

Note bem a diferença de nomes: o **"Gestor do Agregado"** (secção acima) é o Chefe de cada família — há um por agregado (ou mais, se cadastrar outros). O **"gestor da aplicação"** é outra coisa: uma conta técnica, sem agregado próprio, pensada para quem instala/mantém a aplicação (ex.: dar apoio técnico, ou criar um agregado em nome de alguém que não consiga fazê-lo sozinho). Não é preciso para o uso normal da aplicação. Entra-se em `/gestor/entrar` com as credenciais definidas em `GESTOR_EMAIL`/`GESTOR_PASSWORD` no `.env` do servidor; de lá, pode criar agregados manualmente (separador "Agregados") ou cadastrar outro gestor da aplicação (separador "Gestores").

## 4. Domínio 1 — Orçamento

### 4.1 Criar um orçamento

1. Menu **Orçamento** → botão **"+ Novo orçamento"**.
2. Escolher a **periodicidade**: Mensal, Trimestral, Semestral ou Anual.
3. Escolher a **data de início** — a **referência** (ex. `2026-01` para mensal, `2026-T1` para trimestral) e a data de fim são calculadas automaticamente, mas podem ser ajustadas.
4. Preencher os valores planeados por rubrica, organizados exatamente como a planilha do MINFIN: Receitas; Despesas Fixas (Habitação, Transporte, Educação); Despesas Variáveis (Habitação, Impostos, Transporte, Alimentação, Cuidados Pessoais); Extra (Saúde, Manutenção/Prevenção, Educação); Adicionais (Lazer, Vestuário, Outros). Cada grupo pode ser fechado/aberto tocando no título — só é obrigatório preencher o que se aplica à sua família; o resto fica a zero.
5. À medida que preenche, o painel lateral (ou, no telemóvel, mais abaixo na página) mostra em tempo real a regra **55/45/5**: percentagem de despesas fixas, outras despesas e poupança face ao total de receitas planeadas — com indicação a verde/vermelho consoante cumpre ou não cada meta.
6. Tocar em **"Criar orçamento"**.

### 4.2 Acompanhar e ajustar um orçamento

Ao abrir um orçamento (a partir da lista em **Orçamento**) vê: totais de receita/despesa planeada vs. realizada, o painel 55/45/5 já com os números reais desse período, e a lista de rubricas agrupadas com uma barra de progresso (verde até 80%, laranja entre 80–100%, vermelha acima de 100% do planeado). Um Gestor do Agregado pode corrigir o valor planeado de qualquer rubrica diretamente aqui (campo + **"Guardar"**), mesmo depois de o orçamento já estar ativo. O botão **"Marcar como ATIVO"/"Marcar como FECHADO"** avança o orçamento pelos três estados: Rascunho → Ativo → Fechado. Só orçamentos **Ativos** são vigiados pelo motor de alertas.

## 5. Domínio 2 — Registo diário

Menu **Movimentos**. Para cada despesa ou receita do dia-a-dia:

1. Escolher **Despesa** ou **Receita**.
2. Escolher a **categoria** — a app diz-lhe de imediato, por baixo do menu, se este movimento é **"Prevista"** (existe uma linha orçamentada para esta categoria no período ativo que cobre esta data — conta automaticamente para esse orçamento) ou **"Não prevista"** (não há plano para esta categoria/data — é um extra, tal como o documento MINFIN pede para vigiar as compras por impulso). Não há nada para escolher manualmente aqui — a app resolve isto sozinha a partir do que já foi planeado.
3. Preencher data, valor, descrição opcional e método de pagamento.
4. **"Registar movimento"**.

A lista **"Movimentos recentes"** por baixo mostra o histórico, com a etiqueta "não prevista" bem visível, filtros por categoria e por "só não previstas", e um botão para remover um lançamento enganado.

## 6. Domínio 3 — Relatórios e alertas

### 6.1 Relatórios

Menu **Relatórios**:
- **Saldo mensal (últimos 12 meses):** gráfico de barras (receitas/despesas) com uma linha de saldo — mostra de imediato em que meses a família gastou mais do que ganhou.
- **Orçado vs. realizado por grupo:** para o orçamento selecionado no menu pendente, compara barra a barra o que foi planeado com o que já foi gasto/recebido, por grupo (Despesas Fixas, Variáveis, etc.).
- **Regra 55/45/5:** o mesmo painel que aparece na criação do orçamento, aqui já com os números reais.

### 6.2 Alertas

Menu **Alertas** (com um contador vermelho no menu sempre que há alertas por ler). Cada alerta tem um nível:
- **Aviso** (âmbar) — uma rubrica já consumiu 80% do valor planeado.
- **Crítico** (vermelho) — já consumiu 100% (ultrapassou o planeado).
- **Risco de rutura orçamental** (roxo) — o saldo projetado até ao fim do período, contando com o que já foi gasto e o que ainda falta gastar do plano, é negativo. É o aviso mais importante: significa que, ao ritmo atual, a família vai terminar o período a dever mais do que recebeu.

Os alertas são gerados automaticamente — não há nada para configurar para começar a recebê-los. Um Gestor do Agregado pode, no futuro, afinar os limiares de aviso/crítico por categoria (funcionalidade de `RegraAlerta`, já suportada na base de dados — a interface para a editar fica para uma iteração seguinte). Tocar em **"Marcar como lido"** limpa o alerta da contagem, mas mantém o histórico.

## 7. Família — gerir membros

Menu **Família**: lista todos os membros com acesso ao orçamento partilhado. Um Gestor do Agregado pode adicionar novos membros (nome, email, password inicial, papel Membro/Gestor do Agregado) — a pessoa pode depois entrar com essas credenciais e mudar a password nas definições da conta (funcionalidade a adicionar numa iteração futura).

## 8. Perguntas frequentes

**Porque é que um movimento aparece como "não prevista" se eu já criei um orçamento?**
Porque não existe uma linha orçamentada para essa categoria específica no período que cobre a data desse movimento — reveja o orçamento desse período e adicione/ajuste o valor planeado para essa rubrica.

**Os alertas desaparecem sozinhos?**
Sim — se voltar a ficar abaixo do limiar (por exemplo, editou o valor planeado para cima, ou removeu um movimento), o alerta correspondente é automaticamente retirado da lista de não lidos.

**Posso usar a aplicação sem internet?**
A interface (PWA) fica instalada e abre offline, mas os dados são partilhados com o resto da família através do servidor — só é possível consultar/registar quando o telemóvel/computador consegue alcançar o servidor da aplicação (a mesma rede Wi-Fi de casa, ou a morada pública se um dia a família decidir alojá-la fora de casa).

**Esqueci-me do nome do agregado ou das credenciais — o que faço?**
Contacte o gestor da aplicação (quem geriu a instalação): ele consegue ver a lista de agregados existentes em `/gestor/agregados`, e — numa iteração futura — repor a password de um Gestor do Agregado. Por agora, a reposição de password ainda não está implementada.

**Um Gestor do Agregado consegue criar outro agregado (para outra família)?**
Não diretamente lá de dentro do seu agregado — mas nada o impede de sair e usar "Criar o seu agregado" na página de login outra vez, com outro email, para começar um segundo agregado independente. Dentro de um agregado já criado, um Gestor do Agregado só cadastra membros desse mesmo agregado (secção 7); não vê nem mistura dados de outros agregados.

**Porque é que ainda existe um "gestor da aplicação" se cada família já se regista sozinha?**
Serve como via de suporte: por exemplo, ajudar alguém que não consiga completar o auto-registo sozinho, ou ter uma visão de todos os agregados existentes. Não é preciso para o uso normal da aplicação — ver secção 3.1.

**Que moeda é usada?**
Kwanza (AOA) por omissão, com formatação `123 456,00 Kz`, ajustável em `Familia.moeda` para outra moeda se necessário (a interface segue automaticamente qualquer alteração aí).
