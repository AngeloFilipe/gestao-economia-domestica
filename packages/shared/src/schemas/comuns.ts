import { z } from "zod";

export const ErroResposta = z.object({
  mensagem: z.string(),
  /** Presente quando o erro é um nome de agregado já ocupado — uma alternativa livre. */
  sugestao: z.string().optional(),
});
export type ErroResposta = z.infer<typeof ErroResposta>;
