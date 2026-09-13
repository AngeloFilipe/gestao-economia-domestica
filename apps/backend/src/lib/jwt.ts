import jwt from "jsonwebtoken";
import { env } from "../env.js";

export interface AccessTokenPayload {
  sub: string; // utilizadorId
  familiaId: string | null; // null apenas para o papel GESTOR
  papel: "GESTOR" | "ADMIN" | "MEMBRO";
}

export function assinarAccessToken(payload: AccessTokenPayload): string {
  const opcoes: jwt.SignOptions = { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_SECRET, opcoes);
}

export function verificarAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}
