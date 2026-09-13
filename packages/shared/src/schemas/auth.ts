import { z } from "zod";
import { PapelUtilizador } from "../enums.js";

/** Login normal: membro/administrador de um agregado já existente. */
export const LoginInput = z.object({
  nomeAgregado: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInput>;

/** Login do gestor da aplicação — não pertence a nenhum agregado. */
export const LoginGestorInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginGestorInput = z.infer<typeof LoginGestorInput>;

/** Só o gestor da aplicação pode criar um novo agregado (e o seu primeiro administrador). */
export const CriarAgregadoInput = z.object({
  nomeAgregado: z.string().min(2).max(60),
  nomeAdmin: z.string().min(2).max(120),
  emailAdmin: z.string().email(),
  passwordAdmin: z.string().min(8).max(72),
});
export type CriarAgregadoInput = z.infer<typeof CriarAgregadoInput>;

/** Um administrador de agregado cadastra mais membros no seu próprio agregado. */
export const ConvidarMembroInput = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  papel: z.enum(["ADMIN", "MEMBRO"]).default("MEMBRO"),
});
export type ConvidarMembroInput = z.infer<typeof ConvidarMembroInput>;

export const UtilizadorPublico = z.object({
  id: z.string(),
  familiaId: z.string().nullable(),
  nome: z.string(),
  email: z.string().email(),
  papel: PapelUtilizador,
  ativo: z.boolean(),
});
export type UtilizadorPublico = z.infer<typeof UtilizadorPublico>;

export const SessaoResposta = z.object({
  accessToken: z.string(),
  utilizador: UtilizadorPublico,
});
export type SessaoResposta = z.infer<typeof SessaoResposta>;

export const AgregadoDTO = z.object({
  id: z.string(),
  nome: z.string(),
  criadoEm: z.string(),
  totalMembros: z.number().int(),
});
export type AgregadoDTO = z.infer<typeof AgregadoDTO>;
