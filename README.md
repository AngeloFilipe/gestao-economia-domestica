# Gestão de Economia Doméstica

[![GitHub repo](https://img.shields.io/badge/GitHub-gestao--economia--domestica-181717?logo=github)](https://github.com/AngeloFilipe/gestao-economia-domestica)

Aplicação web (PWA) para gestão financeira familiar, inspirada no documento do MINFIN/AGT
"Domina as suas finanças ou as suas finanças o dominam?" — com três domínios: Orçamento,
Registo Diário de despesas/receitas, e Relatórios & Alertas de risco de rutura orçamental.

Suporta vários agregados familiares (ex.: "COSTAFILIPES"), cada um identificado pelo seu
nome no login. Não há registo público: um **gestor da aplicação** cria cada agregado e o
seu primeiro administrador; esse administrador pode depois cadastrar mais membros do seu
próprio agregado.

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

A conta do **gestor da aplicação** é criada automaticamente no arranque a partir de
`GESTOR_EMAIL`/`GESTOR_PASSWORD` em `apps/backend/.env` (ver `.env.example`) — é com essa
conta, em `/gestor/entrar`, que se cria cada agregado familiar e o seu administrador.

> A base de dados SQLite fica fora desta pasta (fora do Dropbox), em
> `~/.gestao-economia-domestica/dev.db`, para evitar que o Dropbox sincronize um ficheiro
> de base de dados vivo (risco de corrupção).
