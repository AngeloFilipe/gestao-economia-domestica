import type { PrismaClient } from "@prisma/client";
import type {
  CriarOrcamentoInput,
  LinhaOrcamentadaDTO,
  LinhaOrcamentadaInput,
  PeriodoOrcamentoDTO,
} from "@ged/shared";
import { avaliarAlertasPeriodo } from "./alertas.service.js";

export class ErroOrcamento extends Error {}

const INCLUDE_LINHAS = { linhas: { include: { categoria: true } } } as const;

function paraDTO(periodo: any): PeriodoOrcamentoDTO {
  const linhas: LinhaOrcamentadaDTO[] = periodo.linhas.map((linha: any) => ({
    id: linha.id,
    categoriaId: linha.categoriaId,
    categoriaNome: linha.categoria.nome,
    valorPlaneado: linha.valorPlaneado,
    observacoes: linha.observacoes,
  }));

  const totalReceitaPlaneada = periodo.linhas
    .filter((l: any) => l.categoria.tipo === "RECEITA")
    .reduce((soma: number, l: any) => soma + l.valorPlaneado, 0);
  const totalDespesaPlaneada = periodo.linhas
    .filter((l: any) => l.categoria.tipo === "DESPESA")
    .reduce((soma: number, l: any) => soma + l.valorPlaneado, 0);

  return {
    id: periodo.id,
    tipo: periodo.tipo,
    referencia: periodo.referencia,
    dataInicio: periodo.dataInicio.toISOString(),
    dataFim: periodo.dataFim.toISOString(),
    estado: periodo.estado,
    totalReceitaPlaneada,
    totalDespesaPlaneada,
    linhas,
  };
}

export async function criarOrcamento(
  prisma: PrismaClient,
  familiaId: string,
  criadoPorId: string,
  input: CriarOrcamentoInput,
): Promise<PeriodoOrcamentoDTO> {
  const existente = await prisma.periodoOrcamento.findUnique({
    where: {
      familiaId_tipo_referencia: { familiaId, tipo: input.periodo.tipo, referencia: input.periodo.referencia },
    },
  });
  if (existente) throw new ErroOrcamento("Já existe um orçamento para este período.");

  const periodo = await prisma.periodoOrcamento.create({
    data: {
      familiaId,
      criadoPorId,
      tipo: input.periodo.tipo,
      referencia: input.periodo.referencia,
      dataInicio: new Date(input.periodo.dataInicio),
      dataFim: new Date(input.periodo.dataFim),
      linhas: {
        create: input.linhas.map((linha) => ({
          categoriaId: linha.categoriaId,
          valorPlaneado: linha.valorPlaneado,
          observacoes: linha.observacoes ?? null,
        })),
      },
    },
    include: INCLUDE_LINHAS,
  });

  return paraDTO(periodo);
}

export async function listarPeriodos(prisma: PrismaClient, familiaId: string): Promise<PeriodoOrcamentoDTO[]> {
  const periodos = await prisma.periodoOrcamento.findMany({
    where: { familiaId },
    include: INCLUDE_LINHAS,
    orderBy: { dataInicio: "desc" },
  });
  return periodos.map(paraDTO);
}

export async function obterPeriodo(
  prisma: PrismaClient,
  familiaId: string,
  periodoId: string,
): Promise<PeriodoOrcamentoDTO | null> {
  const periodo = await prisma.periodoOrcamento.findFirst({
    where: { id: periodoId, familiaId },
    include: INCLUDE_LINHAS,
  });
  return periodo ? paraDTO(periodo) : null;
}

export async function atualizarEstadoPeriodo(
  prisma: PrismaClient,
  familiaId: string,
  periodoId: string,
  estado: string,
): Promise<PeriodoOrcamentoDTO | null> {
  const periodo = await prisma.periodoOrcamento.findFirst({ where: { id: periodoId, familiaId } });
  if (!periodo) return null;

  const atualizado = await prisma.periodoOrcamento.update({
    where: { id: periodoId },
    data: { estado },
    include: INCLUDE_LINHAS,
  });
  return paraDTO(atualizado);
}

export async function definirLinha(
  prisma: PrismaClient,
  familiaId: string,
  periodoId: string,
  linha: LinhaOrcamentadaInput,
): Promise<PeriodoOrcamentoDTO | null> {
  const periodo = await prisma.periodoOrcamento.findFirst({ where: { id: periodoId, familiaId } });
  if (!periodo) return null;

  await prisma.linhaOrcamentada.upsert({
    where: { periodoOrcamentoId_categoriaId: { periodoOrcamentoId: periodoId, categoriaId: linha.categoriaId } },
    create: {
      periodoOrcamentoId: periodoId,
      categoriaId: linha.categoriaId,
      valorPlaneado: linha.valorPlaneado,
      observacoes: linha.observacoes ?? null,
    },
    update: { valorPlaneado: linha.valorPlaneado, observacoes: linha.observacoes ?? null },
  });

  await avaliarAlertasPeriodo(prisma, familiaId, periodoId);

  const atualizado = await prisma.periodoOrcamento.findFirstOrThrow({
    where: { id: periodoId },
    include: INCLUDE_LINHAS,
  });
  return paraDTO(atualizado);
}

export async function removerLinha(
  prisma: PrismaClient,
  familiaId: string,
  periodoId: string,
  linhaId: string,
): Promise<boolean> {
  const linha = await prisma.linhaOrcamentada.findFirst({
    where: { id: linhaId, periodoOrcamentoId: periodoId, periodoOrcamento: { familiaId } },
  });
  if (!linha) return false;

  await prisma.linhaOrcamentada.delete({ where: { id: linhaId } });
  return true;
}
