/*
  Warnings:

  - Added the required column `codigoLogin` to the `familias` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_familias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "codigoLogin" TEXT NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'AOA',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_familias" ("criadoEm", "id", "moeda", "nome") SELECT "criadoEm", "id", "moeda", "nome" FROM "familias";
DROP TABLE "familias";
ALTER TABLE "new_familias" RENAME TO "familias";
CREATE UNIQUE INDEX "familias_codigoLogin_key" ON "familias"("codigoLogin");
CREATE TABLE "new_utilizadores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familiaId" TEXT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'MEMBRO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "utilizadores_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "familias" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_utilizadores" ("ativo", "criadoEm", "email", "familiaId", "id", "nome", "papel", "passwordHash") SELECT "ativo", "criadoEm", "email", "familiaId", "id", "nome", "papel", "passwordHash" FROM "utilizadores";
DROP TABLE "utilizadores";
ALTER TABLE "new_utilizadores" RENAME TO "utilizadores";
CREATE UNIQUE INDEX "utilizadores_email_key" ON "utilizadores"("email");
CREATE INDEX "utilizadores_familiaId_idx" ON "utilizadores"("familiaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
