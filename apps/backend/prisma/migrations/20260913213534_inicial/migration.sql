-- CreateTable
CREATE TABLE "familias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'AOA',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "utilizadores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familiaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'MEMBRO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "utilizadores_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "familias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "utilizadorId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" DATETIME NOT NULL,
    "revogadoEm" DATETIME,
    CONSTRAINT "refresh_tokens_utilizadorId_fkey" FOREIGN KEY ("utilizadorId") REFERENCES "utilizadores" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familiaId" TEXT,
    "parentId" TEXT,
    "nome" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "categorias_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "familias" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "categorias_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categorias" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "periodos_orcamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familiaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "criadoPorId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "periodos_orcamento_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "familias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "periodos_orcamento_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "utilizadores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "linhas_orcamentadas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodoOrcamentoId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "valorPlaneado" REAL NOT NULL,
    "observacoes" TEXT,
    CONSTRAINT "linhas_orcamentadas_periodoOrcamentoId_fkey" FOREIGN KEY ("periodoOrcamentoId") REFERENCES "periodos_orcamento" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "linhas_orcamentadas_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "movimentos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familiaId" TEXT NOT NULL,
    "data" DATETIME NOT NULL,
    "valor" REAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "linhaOrcamentadaId" TEXT,
    "descricao" TEXT,
    "metodoPagamento" TEXT,
    "registadoPorId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "movimentos_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "familias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movimentos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "movimentos_linhaOrcamentadaId_fkey" FOREIGN KEY ("linhaOrcamentadaId") REFERENCES "linhas_orcamentadas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "movimentos_registadoPorId_fkey" FOREIGN KEY ("registadoPorId") REFERENCES "utilizadores" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "regras_alerta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familiaId" TEXT NOT NULL,
    "ambito" TEXT NOT NULL,
    "categoriaId" TEXT,
    "limiarAvisoPct" REAL NOT NULL DEFAULT 80,
    "limiarCriticoPct" REAL NOT NULL DEFAULT 100,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "regras_alerta_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "familias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "regras_alerta_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alertas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familiaId" TEXT NOT NULL,
    "periodoOrcamentoId" TEXT NOT NULL,
    "categoriaId" TEXT,
    "nivel" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "valorReferencia" REAL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lidoEm" DATETIME,
    "lidoPorId" TEXT,
    CONSTRAINT "alertas_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "familias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "alertas_periodoOrcamentoId_fkey" FOREIGN KEY ("periodoOrcamentoId") REFERENCES "periodos_orcamento" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "alertas_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "alertas_lidoPorId_fkey" FOREIGN KEY ("lidoPorId") REFERENCES "utilizadores" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "utilizadores_email_key" ON "utilizadores"("email");

-- CreateIndex
CREATE INDEX "utilizadores_familiaId_idx" ON "utilizadores"("familiaId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_utilizadorId_idx" ON "refresh_tokens"("utilizadorId");

-- CreateIndex
CREATE INDEX "categorias_familiaId_idx" ON "categorias"("familiaId");

-- CreateIndex
CREATE INDEX "categorias_parentId_idx" ON "categorias"("parentId");

-- CreateIndex
CREATE INDEX "periodos_orcamento_familiaId_idx" ON "periodos_orcamento"("familiaId");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_orcamento_familiaId_tipo_referencia_key" ON "periodos_orcamento"("familiaId", "tipo", "referencia");

-- CreateIndex
CREATE INDEX "linhas_orcamentadas_categoriaId_idx" ON "linhas_orcamentadas"("categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "linhas_orcamentadas_periodoOrcamentoId_categoriaId_key" ON "linhas_orcamentadas"("periodoOrcamentoId", "categoriaId");

-- CreateIndex
CREATE INDEX "movimentos_familiaId_data_idx" ON "movimentos"("familiaId", "data");

-- CreateIndex
CREATE INDEX "movimentos_categoriaId_idx" ON "movimentos"("categoriaId");

-- CreateIndex
CREATE INDEX "movimentos_linhaOrcamentadaId_idx" ON "movimentos"("linhaOrcamentadaId");

-- CreateIndex
CREATE INDEX "regras_alerta_familiaId_idx" ON "regras_alerta"("familiaId");

-- CreateIndex
CREATE INDEX "alertas_familiaId_idx" ON "alertas"("familiaId");

-- CreateIndex
CREATE INDEX "alertas_periodoOrcamentoId_categoriaId_nivel_idx" ON "alertas"("periodoOrcamentoId", "categoriaId", "nivel");
