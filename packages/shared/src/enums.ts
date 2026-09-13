import { z } from "zod";

// Fonte única de verdade para os valores que seriam `enum` na base de dados
// se esta fosse PostgreSQL/MySQL. O SQLite não suporta enums nativos, por
// isso o Prisma guarda estes campos como String e a validação acontece aqui.

export const PapelUtilizador = z.enum(["GESTOR", "ADMIN", "MEMBRO"]);
export type PapelUtilizador = z.infer<typeof PapelUtilizador>;

export const TipoPeriodo = z.enum(["MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"]);
export type TipoPeriodo = z.infer<typeof TipoPeriodo>;

export const EstadoPeriodo = z.enum(["RASCUNHO", "ATIVO", "FECHADO"]);
export type EstadoPeriodo = z.infer<typeof EstadoPeriodo>;

export const NivelCategoria = z.enum(["GRUPO", "SUBCATEGORIA", "RUBRICA"]);
export type NivelCategoria = z.infer<typeof NivelCategoria>;

export const TipoFluxo = z.enum(["RECEITA", "DESPESA"]);
export type TipoFluxo = z.infer<typeof TipoFluxo>;

export const MetodoPagamento = z.enum([
  "DINHEIRO",
  "TRANSFERENCIA",
  "CARTAO_DEBITO",
  "CARTAO_CREDITO",
  "MULTICAIXA",
  "OUTRO",
]);
export type MetodoPagamento = z.infer<typeof MetodoPagamento>;

export const AmbitoRegraAlerta = z.enum(["CATEGORIA", "GRUPO", "ORCAMENTO_GLOBAL"]);
export type AmbitoRegraAlerta = z.infer<typeof AmbitoRegraAlerta>;

export const NivelAlerta = z.enum(["AVISO", "CRITICO", "RISCO_RUTURA"]);
export type NivelAlerta = z.infer<typeof NivelAlerta>;

/** Limiares por omissão do motor de alertas (percentagem do valor planeado). */
export const LIMIAR_AVISO_PCT_OMISSAO = 80;
export const LIMIAR_CRITICO_PCT_OMISSAO = 100;

/** Regra 55/45/5 recomendada no documento MINFIN. */
export const REGRA_555 = {
  despesasFixasPct: 55,
  outrasDespesasPct: 45,
  poupancaMinimaPct: 5,
} as const;
