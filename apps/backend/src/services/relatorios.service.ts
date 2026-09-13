import type { PrismaClient } from "@prisma/client";
import type {
  OrcadoRealizadoLinhaDTO,
  OrcadoRealizadoRelatorioDTO,
  Regra555ResultadoDTO,
  SaldoMensalPontoDTO,
} from "@ged/shared";
import { REGRA_555 } from "@ged/shared";

export class ErroRelatorio extends Error {}

interface NoCategoriaLeve {
  id: string;
  nome: string;
  parentId: string | null;
  nivel: string;
  tipo: string;
}

async function mapaCategorias(prisma: PrismaClient, familiaId: string): Promise<Map<string, NoCategoriaLeve>> {
  const categorias = await prisma.categoria.findMany({ where: { OR: [{ familiaId: null }, { familiaId }] } });
  return new Map(categorias.map((c) => [c.id, c]));
}

function raizDe(mapa: Map<string, NoCategoriaLeve>, categoriaId: string): NoCategoriaLeve | undefined {
  let atual = mapa.get(categoriaId);
  while (atual?.parentId) {
    const pai = mapa.get(atual.parentId);
    if (!pai) break;
    atual = pai;
  }
  return atual;
}

export async function calcularOrcadoRealizado(
  prisma: PrismaClient,
  familiaId: string,
  periodoOrcamentoId: string,
): Promise<OrcadoRealizadoRelatorioDTO | null> {
  const periodo = await prisma.periodoOrcamento.findFirst({
    where: { id: periodoOrcamentoId, familiaId },
    include: { linhas: { include: { categoria: true } } },
  });
  if (!periodo) return null;

  const movimentos = await prisma.movimento.findMany({
    where: { familiaId, data: { gte: periodo.dataInicio, lte: periodo.dataFim } },
  });
  const realizadoPorCategoria = new Map<string, number>();
  for (const m of movimentos) {
    realizadoPorCategoria.set(m.categoriaId, (realizadoPorCategoria.get(m.categoriaId) ?? 0) + m.valor);
  }

  const categorias = await mapaCategorias(prisma, familiaId);
  const linhas: OrcadoRealizadoLinhaDTO[] = [];
  const categoriasComLinha = new Set(periodo.linhas.map((l) => l.categoriaId));

  for (const linha of periodo.linhas) {
    const realizado = realizadoPorCategoria.get(linha.categoriaId) ?? 0;
    linhas.push({
      categoriaId: linha.categoriaId,
      categoriaNome: linha.categoria.nome,
      categoriaPaiId: linha.categoria.parentId,
      nivel: linha.categoria.nivel as OrcadoRealizadoLinhaDTO["nivel"],
      valorPlaneado: linha.valorPlaneado,
      valorRealizado: realizado,
      percentualConsumido: linha.valorPlaneado > 0 ? (realizado / linha.valorPlaneado) * 100 : null,
    });
  }

  // Categorias com despesa/receita real mas sem linha orçamentada ("fora do plano").
  for (const [categoriaId, realizado] of realizadoPorCategoria) {
    if (categoriasComLinha.has(categoriaId)) continue;
    const categoria = categorias.get(categoriaId);
    if (!categoria) continue;
    linhas.push({
      categoriaId,
      categoriaNome: categoria.nome,
      categoriaPaiId: categoria.parentId,
      nivel: categoria.nivel as OrcadoRealizadoLinhaDTO["nivel"],
      valorPlaneado: 0,
      valorRealizado: realizado,
      percentualConsumido: null,
    });
  }

  const somaPorTipo = (tipo: "RECEITA" | "DESPESA", campo: "valorPlaneado" | "valorRealizado") =>
    linhas
      .filter((l) => categorias.get(l.categoriaId)?.tipo === tipo)
      .reduce((soma, l) => soma + l[campo], 0);

  return {
    periodoOrcamentoId: periodo.id,
    referencia: periodo.referencia,
    totalReceitaPlaneada: somaPorTipo("RECEITA", "valorPlaneado"),
    totalReceitaRealizada: somaPorTipo("RECEITA", "valorRealizado"),
    totalDespesaPlaneada: somaPorTipo("DESPESA", "valorPlaneado"),
    totalDespesaRealizada: somaPorTipo("DESPESA", "valorRealizado"),
    linhas,
  };
}

export async function calcularSaldoMensal(
  prisma: PrismaClient,
  familiaId: string,
  meses = 12,
): Promise<SaldoMensalPontoDTO[]> {
  const fim = new Date();
  const inicio = new Date(fim.getFullYear(), fim.getMonth() - (meses - 1), 1);

  const movimentos = await prisma.movimento.findMany({
    where: { familiaId, data: { gte: inicio } },
  });

  const porMes = new Map<string, { receitas: number; despesas: number }>();
  for (let i = 0; i < meses; i++) {
    const d = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    porMes.set(chave, { receitas: 0, despesas: 0 });
  }

  for (const m of movimentos) {
    const chave = `${m.data.getFullYear()}-${String(m.data.getMonth() + 1).padStart(2, "0")}`;
    const acumulado = porMes.get(chave);
    if (!acumulado) continue;
    if (m.tipo === "RECEITA") acumulado.receitas += m.valor;
    else acumulado.despesas += m.valor;
  }

  return Array.from(porMes.entries()).map(([mes, { receitas, despesas }]) => ({
    mes,
    receitas,
    despesas,
    saldo: receitas - despesas,
  }));
}

export async function calcularRegra555(
  prisma: PrismaClient,
  familiaId: string,
  periodoOrcamentoId: string,
): Promise<Regra555ResultadoDTO | null> {
  const periodo = await prisma.periodoOrcamento.findFirst({ where: { id: periodoOrcamentoId, familiaId } });
  if (!periodo) return null;

  const movimentos = await prisma.movimento.findMany({
    where: { familiaId, data: { gte: periodo.dataInicio, lte: periodo.dataFim } },
  });
  const categorias = await mapaCategorias(prisma, familiaId);

  let receitaRealizada = 0;
  let despesasFixasRealizada = 0;
  let outrasDespesasRealizada = 0;

  for (const m of movimentos) {
    if (m.tipo === "RECEITA") {
      receitaRealizada += m.valor;
      continue;
    }
    const raiz = raizDe(categorias, m.categoriaId);
    if (raiz?.nome === "Despesas Fixas") despesasFixasRealizada += m.valor;
    else outrasDespesasRealizada += m.valor;
  }

  const poupanca = receitaRealizada - despesasFixasRealizada - outrasDespesasRealizada;
  const despesasFixasPct = receitaRealizada > 0 ? (despesasFixasRealizada / receitaRealizada) * 100 : 0;
  const outrasDespesasPct = receitaRealizada > 0 ? (outrasDespesasRealizada / receitaRealizada) * 100 : 0;
  const poupancaPct = receitaRealizada > 0 ? (poupanca / receitaRealizada) * 100 : 0;

  return {
    despesasFixasPct,
    outrasDespesasPct,
    poupancaPct,
    cumpreDespesasFixas: despesasFixasPct <= REGRA_555.despesasFixasPct,
    cumpreOutrasDespesas: outrasDespesasPct <= REGRA_555.outrasDespesasPct,
    cumprePoupancaMinima: poupancaPct >= REGRA_555.poupancaMinimaPct,
  };
}
