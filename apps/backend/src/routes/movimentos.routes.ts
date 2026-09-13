import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AtualizarMovimentoInput, CriarMovimentoInput, FiltroMovimentosQuery } from "@ged/shared";
import {
  ErroMovimento,
  atualizarMovimento,
  criarMovimento,
  listarMovimentos,
  removerMovimento,
} from "../services/movimentos.service.js";

const ParametrosMovimento = z.object({ movimentoId: z.string() });

export async function movimentosRoutes(app: FastifyInstance) {
  const rotas = app.withTypeProvider<ZodTypeProvider>();
  rotas.addHook("preHandler", app.autenticar);

  rotas.get("/", { schema: { querystring: FiltroMovimentosQuery } }, async (request) =>
    listarMovimentos(app.prisma, request.utilizador!.familiaId, request.query),
  );

  rotas.post("/", { schema: { body: CriarMovimentoInput } }, async (request, reply) => {
    try {
      const movimento = await criarMovimento(
        app.prisma,
        request.utilizador!.familiaId,
        request.utilizador!.sub,
        request.body,
      );
      return reply.code(201).send(movimento);
    } catch (erro) {
      if (erro instanceof ErroMovimento) return reply.code(400).send({ mensagem: erro.message });
      throw erro;
    }
  });

  rotas.patch(
    "/:movimentoId",
    { schema: { params: ParametrosMovimento, body: AtualizarMovimentoInput } },
    async (request, reply) => {
      const movimento = await atualizarMovimento(
        app.prisma,
        request.utilizador!.familiaId,
        request.params.movimentoId,
        request.body,
      );
      if (!movimento) return reply.code(404).send({ mensagem: "Movimento não encontrado." });
      return movimento;
    },
  );

  rotas.delete("/:movimentoId", { schema: { params: ParametrosMovimento } }, async (request, reply) => {
    const removido = await removerMovimento(app.prisma, request.utilizador!.familiaId, request.params.movimentoId);
    if (!removido) return reply.code(404).send({ mensagem: "Movimento não encontrado." });
    return reply.code(204).send();
  });
}
