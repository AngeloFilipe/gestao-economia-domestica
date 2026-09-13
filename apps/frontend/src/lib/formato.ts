const formatadorMoeda = new Intl.NumberFormat("pt-AO", {
  style: "currency",
  currency: "AOA",
  maximumFractionDigits: 2,
});

export function formatarMoeda(valor: number): string {
  return formatadorMoeda.format(valor);
}

const formatadorMoedaCompacta = new Intl.NumberFormat("pt-AO", {
  style: "currency",
  currency: "AOA",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Versão curta para espaços apertados (eixos de gráficos) — ex.: "350 mil Kz". */
export function formatarMoedaCompacta(valor: number): string {
  return formatadorMoedaCompacta.format(valor);
}

export function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatarMesReferencia(mes: string): string {
  const [ano, mesNumero] = mes.split("-");
  const data = new Date(Number(ano), Number(mesNumero) - 1, 1);
  return data.toLocaleDateString("pt-PT", { month: "short", year: "2-digit" });
}
