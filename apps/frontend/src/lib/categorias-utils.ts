import type { CategoriaDTO } from "@ged/shared";

export interface RubricaAchatada {
  id: string;
  nome: string;
  tipo: "RECEITA" | "DESPESA";
  grupoNome: string;
  subcategoriaNome: string | null;
}

export function achatarRubricas(arvore: CategoriaDTO[]): RubricaAchatada[] {
  const resultado: RubricaAchatada[] = [];
  for (const grupo of arvore) {
    for (const filho of grupo.filhos) {
      if (filho.nivel === "RUBRICA") {
        resultado.push({
          id: filho.id,
          nome: filho.nome,
          tipo: filho.tipo,
          grupoNome: grupo.nome,
          subcategoriaNome: null,
        });
        continue;
      }
      for (const rubrica of filho.filhos) {
        resultado.push({
          id: rubrica.id,
          nome: rubrica.nome,
          tipo: rubrica.tipo,
          grupoNome: grupo.nome,
          subcategoriaNome: filho.nome,
        });
      }
    }
  }
  return resultado;
}

export function agruparPorGrupoESubcategoria(rubricas: RubricaAchatada[]) {
  const porGrupo = new Map<string, Map<string, RubricaAchatada[]>>();
  for (const rubrica of rubricas) {
    const chaveSub = rubrica.subcategoriaNome ?? "__direto__";
    if (!porGrupo.has(rubrica.grupoNome)) porGrupo.set(rubrica.grupoNome, new Map());
    const porSub = porGrupo.get(rubrica.grupoNome)!;
    if (!porSub.has(chaveSub)) porSub.set(chaveSub, []);
    porSub.get(chaveSub)!.push(rubrica);
  }
  return porGrupo;
}
