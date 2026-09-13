import { z } from "zod";
import { MetodoPagamento, TipoFluxo } from "../enums.js";

export const CriarMovimentoInput = z.object({
  data: z.string().datetime(),
  valor: z.number().positive(),
  tipo: TipoFluxo,
  categoriaId: z.string(),
  linhaOrcamentadaId: z.string().nullable().optional(),
  descricao: z.string().max(280).nullable().optional(),
  metodoPagamento: MetodoPagamento.nullable().optional(),
});
export type CriarMovimentoInput = z.infer<typeof CriarMovimentoInput>;

export const AtualizarMovimentoInput = CriarMovimentoInput.partial();
export type AtualizarMovimentoInput = z.infer<typeof AtualizarMovimentoInput>;

export const FiltroMovimentosQuery = z.object({
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  categoriaId: z.string().optional(),
  tipo: TipoFluxo.optional(),
  apenasNaoPrevistas: z.coerce.boolean().optional(),
});
export type FiltroMovimentosQuery = z.infer<typeof FiltroMovimentosQuery>;

export interface MovimentoDTO {
  id: string;
  data: string;
  valor: number;
  tipo: TipoFluxo;
  categoriaId: string;
  categoriaNome: string;
  linhaOrcamentadaId: string | null;
  prevista: boolean;
  descricao: string | null;
  metodoPagamento: MetodoPagamento | null;
  registadoPorId: string;
  registadoPorNome: string;
  criadoEm: string;
}
