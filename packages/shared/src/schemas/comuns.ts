import { z } from "zod";

export const ErroResposta = z.object({ mensagem: z.string() });
export type ErroResposta = z.infer<typeof ErroResposta>;
