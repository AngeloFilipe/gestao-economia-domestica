import type { PeriodoOrcamentoDTO, TipoPeriodo } from "@ged/shared";

export function calcularFimPeriodo(tipo: TipoPeriodo, dataInicioISO: string): string {
  const inicio = new Date(dataInicioISO);
  const fim = new Date(inicio);
  switch (tipo) {
    case "MENSAL":
      fim.setMonth(fim.getMonth() + 1);
      break;
    case "TRIMESTRAL":
      fim.setMonth(fim.getMonth() + 3);
      break;
    case "SEMESTRAL":
      fim.setMonth(fim.getMonth() + 6);
      break;
    case "ANUAL":
      fim.setFullYear(fim.getFullYear() + 1);
      break;
  }
  fim.setDate(fim.getDate() - 1);
  fim.setHours(23, 59, 59, 999);
  return fim.toISOString();
}

export function sugerirReferencia(tipo: TipoPeriodo, dataInicioISO: string): string {
  const d = new Date(dataInicioISO);
  const ano = d.getFullYear();
  switch (tipo) {
    case "MENSAL":
      return `${ano}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    case "TRIMESTRAL":
      return `${ano}-T${Math.floor(d.getMonth() / 3) + 1}`;
    case "SEMESTRAL":
      return `${ano}-S${d.getMonth() < 6 ? 1 : 2}`;
    case "ANUAL":
      return `${ano}`;
  }
}

export const RUBRICA_TIPO_PERIODO: Record<TipoPeriodo, string> = {
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
};

const PRIORIDADE_GRANULARIDADE: TipoPeriodo[] = ["MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"];

/** Encontra a linha orçamentada mais granular (mensal > trimestral > …) que
 * cobre esta categoria e data, para ligar automaticamente um novo movimento
 * ao seu plano — sem obrigar o utilizador a escolher manualmente o período. */
export function resolverLinhaOrcamentada(
  periodos: PeriodoOrcamentoDTO[],
  categoriaId: string,
  dataISO: string,
): { linhaId: string; periodo: PeriodoOrcamentoDTO } | null {
  const data = new Date(dataISO);
  const candidatos = periodos
    .filter((p) => p.estado === "ATIVO" && new Date(p.dataInicio) <= data && new Date(p.dataFim) >= data)
    .sort((a, b) => PRIORIDADE_GRANULARIDADE.indexOf(a.tipo) - PRIORIDADE_GRANULARIDADE.indexOf(b.tipo));

  for (const periodo of candidatos) {
    const linha = periodo.linhas.find((l) => l.categoriaId === categoriaId);
    if (linha) return { linhaId: linha.id, periodo };
  }
  return null;
}
