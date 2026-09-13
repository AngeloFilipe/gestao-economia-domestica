import { z } from "zod";
import { NivelCategoria, TipoFluxo } from "../enums.js";

export interface CategoriaDTO {
  id: string;
  nome: string;
  nivel: NivelCategoria;
  tipo: TipoFluxo;
  ordem: number;
  filhos: CategoriaDTO[];
}

export const CategoriaDTO: z.ZodType<CategoriaDTO> = z.lazy(() =>
  z.object({
    id: z.string(),
    nome: z.string(),
    nivel: NivelCategoria,
    tipo: TipoFluxo,
    ordem: z.number().int(),
    filhos: z.array(CategoriaDTO),
  }),
);

export const CriarCategoriaInput = z.object({
  nome: z.string().min(1).max(120),
  nivel: NivelCategoria,
  tipo: TipoFluxo,
  parentId: z.string().nullable().optional(),
  ordem: z.number().int().default(0),
});
export type CriarCategoriaInput = z.infer<typeof CriarCategoriaInput>;
