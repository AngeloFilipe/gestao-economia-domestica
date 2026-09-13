import { createHash, randomBytes } from "node:crypto";

/** Refresh tokens são opacos (não JWT): geramos bytes aleatórios, devolvemos
 * o valor em claro ao cliente uma única vez, e guardamos só o hash SHA-256
 * na base de dados — assim uma fuga da BD não permite reconstruir o token. */
export function gerarRefreshTokenBruto(): string {
  return randomBytes(48).toString("base64url");
}

export function hashRefreshToken(tokenBruto: string): string {
  return createHash("sha256").update(tokenBruto).digest("hex");
}
