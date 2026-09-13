import type { PrismaClient } from "@prisma/client";
import type { CategoriaDTO, CriarCategoriaInput } from "@ged/shared";

export class ErroCategoria extends Error {}

interface CategoriaLinha {
  id: string;
  parentId: string | null;
  nome: string;
  nivel: string;
  tipo: string;
  ordem: number;
}

function construirArvore(linhas: CategoriaLinha[]): CategoriaDTO[] {
  const porId = new Map<string, CategoriaDTO>();
  for (const linha of linhas) {
    porId.set(linha.id, {
      id: linha.id,
      nome: linha.nome,
      nivel: linha.nivel as CategoriaDTO["nivel"],
      tipo: linha.tipo as CategoriaDTO["tipo"],
      ordem: linha.ordem,
      filhos: [],
    });
  }

  const raizes: CategoriaDTO[] = [];
  for (const linha of linhas) {
    const no = porId.get(linha.id)!;
    if (linha.parentId && porId.has(linha.parentId)) {
      porId.get(linha.parentId)!.filhos.push(no);
    } else {
      raizes.push(no);
    }
  }

  const ordenar = (nos: CategoriaDTO[]) => {
    nos.sort((a, b) => a.ordem - b.ordem);
    nos.forEach((no) => ordenar(no.filhos));
  };
  ordenar(raizes);

  return raizes;
}

export async function obterArvoreCategorias(prisma: PrismaClient, familiaId: string): Promise<CategoriaDTO[]> {
  const linhas = await prisma.categoria.findMany({
    where: { ativo: true, OR: [{ familiaId: null }, { familiaId }] },
    orderBy: { ordem: "asc" },
  });
  return construirArvore(linhas);
}

export async function criarCategoriaPersonalizada(
  prisma: PrismaClient,
  familiaId: string,
  input: CriarCategoriaInput,
) {
  if (input.parentId) {
    const pai = await prisma.categoria.findFirst({
      where: { id: input.parentId, OR: [{ familiaId: null }, { familiaId }] },
    });
    if (!pai) throw new ErroCategoria("Categoria-pai não encontrada.");
    if (pai.nivel === "RUBRICA") throw new ErroCategoria("Não é possível adicionar sub-categorias a uma rubrica.");
  }

  return prisma.categoria.create({
    data: {
      familiaId,
      nome: input.nome,
      nivel: input.nivel,
      tipo: input.tipo,
      parentId: input.parentId ?? null,
      ordem: input.ordem,
    },
  });
}
