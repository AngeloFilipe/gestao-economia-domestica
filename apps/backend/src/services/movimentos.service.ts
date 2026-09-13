import type { PrismaClient } from "@prisma/client";
import type { AtualizarMovimentoInput, CriarMovimentoInput, FiltroMovimentosQuery, MovimentoDTO } from "@ged/shared";
import { avaliarAlertasPeriodo } from "./alertas.service.js";

export class ErroMovimento extends Error {}

function paraDTO(movimento: any): MovimentoDTO {
  return {
    id: movimento.id,
    data: movimento.data.toISOString(),
    valor: movimento.valor,
    tipo: movimento.tipo,
    categoriaId: movimento.categoriaId,
    categoriaNome: movimento.categoria.nome,
    linhaOrcamentadaId: movimento.linhaOrcamentadaId,
    prevista: movimento.linhaOrcamentadaId !== null,
    descricao: movimento.descricao,
    metodoPagamento: movimento.metodoPagamento,
    registadoPorId: movimento.registadoPorId,
    registadoPorNome: movimento.registadoPor.nome,
    criadoEm: movimento.criadoEm.toISOString(),
  };
}

/** Recalcula os alertas de todos os períodos (de qualquer granularidade) cujo
 * intervalo de datas contém `data` — um único movimento pode afetar o
 * relatório mensal, trimestral, semestral e anual ao mesmo tempo. */
async function recalcularAlertasParaData(prisma: PrismaClient, familiaId: string, data: Date) {
  const periodos = await prisma.periodoOrcamento.findMany({
    where: { familiaId, estado: "ATIVO", dataInicio: { lte: data }, dataFim: { gte: data } },
    select: { id: true },
  });
  for (const periodo of periodos) {
    await avaliarAlertasPeriodo(prisma, familiaId, periodo.id);
  }
}

export async function criarMovimento(
  prisma: PrismaClient,
  familiaId: string,
  registadoPorId: string,
  input: CriarMovimentoInput,
): Promise<MovimentoDTO> {
  if (input.linhaOrcamentadaId) {
    const linha = await prisma.linhaOrcamentada.findFirst({
      where: { id: input.linhaOrcamentadaId, periodoOrcamento: { familiaId } },
    });
    if (!linha) throw new ErroMovimento("Linha orçamentada não encontrada.");
    if (linha.categoriaId !== input.categoriaId) {
      throw new ErroMovimento("A categoria do movimento tem de coincidir com a da linha orçamentada.");
    }
  }

  const data = new Date(input.data);
  const movimento = await prisma.movimento.create({
    data: {
      familiaId,
      data,
      valor: input.valor,
      tipo: input.tipo,
      categoriaId: input.categoriaId,
      linhaOrcamentadaId: input.linhaOrcamentadaId ?? null,
      descricao: input.descricao ?? null,
      metodoPagamento: input.metodoPagamento ?? null,
      registadoPorId,
    },
    include: { categoria: true, registadoPor: true },
  });

  await recalcularAlertasParaData(prisma, familiaId, data);
  return paraDTO(movimento);
}

export async function listarMovimentos(
  prisma: PrismaClient,
  familiaId: string,
  filtro: FiltroMovimentosQuery,
): Promise<MovimentoDTO[]> {
  const movimentos = await prisma.movimento.findMany({
    where: {
      familiaId,
      ...(filtro.dataInicio || filtro.dataFim
        ? {
            data: {
              ...(filtro.dataInicio ? { gte: new Date(filtro.dataInicio) } : {}),
              ...(filtro.dataFim ? { lte: new Date(filtro.dataFim) } : {}),
            },
          }
        : {}),
      ...(filtro.categoriaId ? { categoriaId: filtro.categoriaId } : {}),
      ...(filtro.tipo ? { tipo: filtro.tipo } : {}),
      ...(filtro.apenasNaoPrevistas ? { linhaOrcamentadaId: null } : {}),
    },
    include: { categoria: true, registadoPor: true },
    orderBy: { data: "desc" },
  });
  return movimentos.map(paraDTO);
}

export async function atualizarMovimento(
  prisma: PrismaClient,
  familiaId: string,
  movimentoId: string,
  input: AtualizarMovimentoInput,
): Promise<MovimentoDTO | null> {
  const existente = await prisma.movimento.findFirst({ where: { id: movimentoId, familiaId } });
  if (!existente) return null;

  const movimento = await prisma.movimento.update({
    where: { id: movimentoId },
    data: {
      ...(input.data ? { data: new Date(input.data) } : {}),
      ...(input.valor !== undefined ? { valor: input.valor } : {}),
      ...(input.tipo ? { tipo: input.tipo } : {}),
      ...(input.categoriaId ? { categoriaId: input.categoriaId } : {}),
      ...(input.linhaOrcamentadaId !== undefined ? { linhaOrcamentadaId: input.linhaOrcamentadaId } : {}),
      ...(input.descricao !== undefined ? { descricao: input.descricao } : {}),
      ...(input.metodoPagamento !== undefined ? { metodoPagamento: input.metodoPagamento } : {}),
    },
    include: { categoria: true, registadoPor: true },
  });

  await recalcularAlertasParaData(prisma, familiaId, existente.data);
  if (input.data) await recalcularAlertasParaData(prisma, familiaId, new Date(input.data));

  return paraDTO(movimento);
}

export async function removerMovimento(prisma: PrismaClient, familiaId: string, movimentoId: string): Promise<boolean> {
  const existente = await prisma.movimento.findFirst({ where: { id: movimentoId, familiaId } });
  if (!existente) return false;

  await prisma.movimento.delete({ where: { id: movimentoId } });
  await recalcularAlertasParaData(prisma, familiaId, existente.data);
  return true;
}
