import { z } from "zod";
import { EstadoPeriodo, TipoPeriodo } from "../enums.js";

export const CriarPeriodoOrcamentoInput = z.object({
  tipo: TipoPeriodo,
  referencia: z.string().min(1).max(20),
  dataInicio: z.string().datetime(),
  dataFim: z.string().datetime(),
});
export type CriarPeriodoOrcamentoInput = z.infer<typeof CriarPeriodoOrcamentoInput>;

export const LinhaOrcamentadaInput = z.object({
  categoriaId: z.string(),
  valorPlaneado: z.number().nonnegative(),
  observacoes: z.string().max(280).nullable().optional(),
});
export type LinhaOrcamentadaInput = z.infer<typeof LinhaOrcamentadaInput>;

export const CriarOrcamentoInput = z.object({
  periodo: CriarPeriodoOrcamentoInput,
  linhas: z.array(LinhaOrcamentadaInput).min(1),
});
export type CriarOrcamentoInput = z.infer<typeof CriarOrcamentoInput>;

export const AtualizarEstadoPeriodoInput = z.object({
  estado: EstadoPeriodo,
});
export type AtualizarEstadoPeriodoInput = z.infer<typeof AtualizarEstadoPeriodoInput>;

export interface LinhaOrcamentadaDTO {
  id: string;
  categoriaId: string;
  categoriaNome: string;
  valorPlaneado: number;
  observacoes: string | null;
}

export interface PeriodoOrcamentoDTO {
  id: string;
  tipo: TipoPeriodo;
  referencia: string;
  dataInicio: string;
  dataFim: string;
  estado: EstadoPeriodo;
  totalReceitaPlaneada: number;
  totalDespesaPlaneada: number;
  linhas: LinhaOrcamentadaDTO[];
}
