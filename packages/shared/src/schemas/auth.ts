import { z } from "zod";
import { PapelUtilizador } from "../enums.js";

export const RegistarFamiliaInput = z.object({
  nomeFamilia: z.string().min(2).max(120),
  nomeUtilizador: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});
export type RegistarFamiliaInput = z.infer<typeof RegistarFamiliaInput>;

export const LoginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginInput>;

export const ConvidarMembroInput = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  papel: PapelUtilizador.default("MEMBRO"),
});
export type ConvidarMembroInput = z.infer<typeof ConvidarMembroInput>;

export const UtilizadorPublico = z.object({
  id: z.string(),
  familiaId: z.string(),
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
