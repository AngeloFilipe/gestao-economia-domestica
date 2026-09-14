# Gestão de Economia Doméstica

[![GitHub repo](https://img.shields.io/badge/GitHub-gestao--economia--domestica-181717?logo=github)](https://github.com/AngeloFilipe/gestao-economia-domestica)

Aplicação web (PWA) para gestão financeira familiar, inspirada no documento do MINFIN/AGT
"Domina as suas finanças ou as suas finanças o dominam?" — com três domínios: Orçamento,
Registo Diário de despesas/receitas, e Relatórios & Alertas de risco de rutura orçamental.

Suporta vários agregados familiares (ex.: "COSTAFILIPES"), cada um identificado pelo seu
nome no login. Qualquer Chefe de Agregado cria o seu próprio agregado sozinho, na página
de login ("Criar o seu agregado") — fica automaticamente como **Gestor do Agregado**
(quem paga as contas) e pode depois cadastrar mais membros do seu próprio agregado. Existe
também um papel separado de **gestor da aplicação**, sem agregado próprio, para suporte
(criar um agregado em nome de alguém, etc.) — não é preciso para o uso normal.

Ver `docs/` para a filosofia da aplicação e os modelos conceptual, lógico e físico da base
de dados, e o manual do utilizador.

## Arrancar em desenvolvimento

Pré-requisitos: Node.js 20+ (instalado via Homebrew: `brew install node`).

```bash
npm install
cp apps/backend/.env.example apps/backend/.env
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

- Backend (API): http://localhost:3333 (documentação OpenAPI em `/docs`)
- Frontend (PWA): http://localhost:5173

A conta do **gestor da aplicação** (papel de suporte, opcional para o uso normal) é
criada automaticamente no arranque a partir de `GESTOR_EMAIL`/`GESTOR_PASSWORD` em
`apps/backend/.env` (ver `.env.example`) — entra-se em `/gestor/entrar`.

> A base de dados SQLite fica fora desta pasta (fora do Dropbox), em
> `~/.gestao-economia-domestica/dev.db`, para evitar que o Dropbox sincronize um ficheiro
> de base de dados vivo (risco de corrupção).
