import type { PrismaClient } from "@prisma/client";
import type { AlertaDTO } from "@ged/shared";
import { LIMIAR_AVISO_PCT_OMISSAO, LIMIAR_CRITICO_PCT_OMISSAO } from "@ged/shared";

interface LimiaresRegra {
  limiarAvisoPct: number;
  limiarCriticoPct: number;
}

/**
 * Motor de alertas: recalculado de forma síncrona a seguir a cada escrita em
 * Movimento/LinhaOrcamentada, e também por um job diário (ver jobs/) para
 * capturar a deriva temporal do saldo projetado sem que seja preciso
 * nenhum movimento novo. Ver docs/03-modelo-fisico.md para a justificação de
 * porque a deduplicação é feita aqui em vez de numa unique constraint SQL.
 */
async function limiaresParaCategoria(
  prisma: PrismaClient,
  familiaId: string,
  categoriaId: string,
): Promise<LimiaresRegra> {
  const regraCategoria = await prisma.regraAlerta.findFirst({
    where: { familiaId, ambito: "CATEGORIA", categoriaId, ativo: true },
  });
  if (regraCategoria) {
    return { limiarAvisoPct: regraCategoria.limiarAvisoPct, limiarCriticoPct: regraCategoria.limiarCriticoPct };
  }

  const regraGlobal = await prisma.regraAlerta.findFirst({
    where: { familiaId, ambito: "ORCAMENTO_GLOBAL", ativo: true },
  });
  if (regraGlobal) {
    return { limiarAvisoPct: regraGlobal.limiarAvisoPct, limiarCriticoPct: regraGlobal.limiarCriticoPct };
  }

  return { limiarAvisoPct: LIMIAR_AVISO_PCT_OMISSAO, limiarCriticoPct: LIMIAR_CRITICO_PCT_OMISSAO };
}

async function definirEstadoAlerta(
  prisma: PrismaClient,
  params: {
    familiaId: string;
    periodoOrcamentoId: string;
    categoriaId: string | null;
    nivelCalculado: "AVISO" | "CRITICO" | "RISCO_RUTURA" | null;
    mensagem: string;
    valorReferencia: number | null;
  },
) {
  const existente = await prisma.alerta.findFirst({
    where: {
      periodoOrcamentoId: params.periodoOrcamentoId,
      categoriaId: params.categoriaId,
      lidoEm: null,
    },
  });

  if (!params.nivelCalculado) {
    if (existente) await prisma.alerta.delete({ where: { id: existente.id } });
    return;
  }

  if (existente) {
    if (existente.nivel === params.nivelCalculado) return;
    await prisma.alerta.update({
      where: { id: existente.id },
      data: { nivel: params.nivelCalculado, mensagem: params.mensagem, valorReferencia: params.valorReferencia, criadoEm: new Date() },
    });
    return;
  }

  await prisma.alerta.create({
    data: {
      familiaId: params.familiaId,
      periodoOrcamentoId: params.periodoOrcamentoId,
      categoriaId: params.categoriaId,
      nivel: params.nivelCalculado,
      mensagem: params.mensagem,
      valorReferencia: params.valorReferencia,
    },
  });
}

export async function avaliarAlertasPeriodo(prisma: PrismaClient, familiaId: string, periodoOrcamentoId: string) {
  const periodo = await prisma.periodoOrcamento.findFirst({
    where: { id: periodoOrcamentoId, familiaId },
    include: { linhas: { include: { categoria: true } } },
  });
  if (!periodo) return;

  const movimentos = await prisma.movimento.findMany({
    where: { familiaId, data: { gte: periodo.dataInicio, lte: periodo.dataFim } },
  });

  const realizadoPorCategoria = new Map<string, number>();
  for (const movimento of movimentos) {
    realizadoPorCategoria.set(
      movimento.categoriaId,
      (realizadoPorCategoria.get(movimento.categoriaId) ?? 0) + movimento.valor,
    );
  }

  let totalReceitaPlaneada = 0;
  let totalDespesaPlaneada = 0;
  let totalDespesaRealizada = 0;
  let restanteNaoConsumido = 0;

  for (const linha of periodo.linhas) {
    const realizado = realizadoPorCategoria.get(linha.categoriaId) ?? 0;

    if (linha.categoria.tipo === "RECEITA") {
      totalReceitaPlaneada += linha.valorPlaneado;
      continue;
    }

    totalDespesaPlaneada += linha.valorPlaneado;
    totalDespesaRealizada += realizado;
    restanteNaoConsumido += Math.max(0, linha.valorPlaneado - realizado);

    const limiares = await limiaresParaCategoria(prisma, familiaId, linha.categoriaId);
    const pct = linha.valorPlaneado > 0 ? (realizado / linha.valorPlaneado) * 100 : realizado > 0 ? Infinity : 0;

    const nivel = pct >= limiares.limiarCriticoPct ? "CRITICO" : pct >= limiares.limiarAvisoPct ? "AVISO" : null;

    await definirEstadoAlerta(prisma, {
      familiaId,
      periodoOrcamentoId,
      categoriaId: linha.categoriaId,
      nivelCalculado: nivel,
      mensagem: nivel
        ? `"${linha.categoria.nome}" já consumiu ${pct.toFixed(0)}% do valor planeado (${realizado.toFixed(2)} de ${linha.valorPlaneado.toFixed(2)}).`
        : "",
      valorReferencia: pct,
    });
  }

  const saldoProjetado = totalReceitaPlaneada - totalDespesaRealizada - restanteNaoConsumido;
  await definirEstadoAlerta(prisma, {
    familiaId,
    periodoOrcamentoId,
    categoriaId: null,
    nivelCalculado: saldoProjetado < 0 ? "RISCO_RUTURA" : null,
    mensagem:
      saldoProjetado < 0
        ? `Risco de rutura orçamental: a manter-se o ritmo atual de despesa, o período "${periodo.referencia}" pode fechar com saldo negativo de ${Math.abs(saldoProjetado).toFixed(2)}.`
        : "",
    valorReferencia: saldoProjetado,
  });
}

export async function listarAlertas(
  prisma: PrismaClient,
  familiaId: string,
  opcoes: { apenasNaoLidos?: boolean } = {},
): Promise<AlertaDTO[]> {
  const alertas = await prisma.alerta.findMany({
    where: { familiaId, ...(opcoes.apenasNaoLidos ? { lidoEm: null } : {}) },
    include: { categoria: true },
    orderBy: { criadoEm: "desc" },
  });

  return alertas.map((alerta) => ({
    id: alerta.id,
    periodoOrcamentoId: alerta.periodoOrcamentoId,
    categoriaId: alerta.categoriaId,
    categoriaNome: alerta.categoria?.nome ?? null,
    nivel: alerta.nivel as AlertaDTO["nivel"],
    mensagem: alerta.mensagem,
    valorReferencia: alerta.valorReferencia,
    criadoEm: alerta.criadoEm.toISOString(),
    lidoEm: alerta.lidoEm ? alerta.lidoEm.toISOString() : null,
  }));
}

export async function marcarAlertaLido(prisma: PrismaClient, familiaId: string, alertaId: string, lidoPorId: string) {
  const alerta = await prisma.alerta.findFirst({ where: { id: alertaId, familiaId } });
  if (!alerta) return null;
  return prisma.alerta.update({ where: { id: alertaId }, data: { lidoEm: new Date(), lidoPorId } });
}

/** Recalcula alertas de todos os períodos ATIVO de todas as famílias — usado pelo job diário. */
export async function avaliarAlertasTodosPeriodosAtivos(prisma: PrismaClient) {
  const periodos = await prisma.periodoOrcamento.findMany({ where: { estado: "ATIVO" } });
  for (const periodo of periodos) {
    await avaliarAlertasPeriodo(prisma, periodo.familiaId, periodo.id);
  }
}
