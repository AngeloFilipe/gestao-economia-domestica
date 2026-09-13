import { NivelAlerta } from "../enums.js";

export interface OrcadoRealizadoLinhaDTO {
  categoriaId: string;
  categoriaNome: string;
  categoriaPaiId: string | null;
  nivel: "GRUPO" | "SUBCATEGORIA" | "RUBRICA";
  valorPlaneado: number;
  valorRealizado: number;
  percentualConsumido: number | null;
}

export interface OrcadoRealizadoRelatorioDTO {
  periodoOrcamentoId: string;
  referencia: string;
  totalReceitaPlaneada: number;
  totalReceitaRealizada: number;
  totalDespesaPlaneada: number;
  totalDespesaRealizada: number;
  linhas: OrcadoRealizadoLinhaDTO[];
}

export interface SaldoMensalPontoDTO {
  mes: string; // "2026-01"
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface Regra555ResultadoDTO {
  despesasFixasPct: number;
  outrasDespesasPct: number;
  poupancaPct: number;
  cumpreDespesasFixas: boolean;
  cumpreOutrasDespesas: boolean;
  cumprePoupancaMinima: boolean;
}

export interface AlertaDTO {
  id: string;
  periodoOrcamentoId: string;
  categoriaId: string | null;
  categoriaNome: string | null;
  nivel: NivelAlerta;
  mensagem: string;
  valorReferencia: number | null;
  criadoEm: string;
  lidoEm: string | null;
}
