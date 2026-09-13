import type { FastifyInstance } from "fastify";
import { familiaIdObrigatoria } from "../lib/contexto.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { AtualizarEstadoPeriodoInput, CriarOrcamentoInput, LinhaOrcamentadaInput } from "@ged/shared";
import {
  ErroOrcamento,
  atualizarEstadoPeriodo,
  criarOrcamento,
  definirLinha,
  listarPeriodos,
  obterPeriodo,
  removerLinha,
} from "../services/orcamento.service.js";

const ParametrosPeriodo = z.object({ periodoId: z.string() });
const ParametrosLinha = z.object({ periodoId: z.string(), linhaId: z.string() });

export async function orcamentoRoutes(app: FastifyInstance) {
  const rotas = app.withTypeProvider<ZodTypeProvider>();
  rotas.addHook("preHandler", app.autenticar);

  rotas.get("/", async (request) => listarPeriodos(app.prisma, familiaIdObrigatoria(request)));

  rotas.post("/", { schema: { body: CriarOrcamentoInput } }, async (request, reply) => {
    try {
      const periodo = await criarOrcamento(
        app.prisma,
        familiaIdObrigatoria(request),
        request.utilizador!.sub,
        request.body,
      );
      return reply.code(201).send(periodo);
    } catch (erro) {
      if (erro instanceof ErroOrcamento) return reply.code(409).send({ mensagem: erro.message });
      throw erro;
    }
  });

  rotas.get("/:periodoId", { schema: { params: ParametrosPeriodo } }, async (request, reply) => {
    const periodo = await obterPeriodo(app.prisma, familiaIdObrigatoria(request), request.params.periodoId);
    if (!periodo) return reply.code(404).send({ mensagem: "Orçamento não encontrado." });
    return periodo;
  });

  rotas.patch(
    "/:periodoId/estado",
    { schema: { params: ParametrosPeriodo, body: AtualizarEstadoPeriodoInput } },
    async (request, reply) => {
      const periodo = await atualizarEstadoPeriodo(
        app.prisma,
        familiaIdObrigatoria(request),
        request.params.periodoId,
        request.body.estado,
      );
      if (!periodo) return reply.code(404).send({ mensagem: "Orçamento não encontrado." });
      return periodo;
    },
  );

  rotas.put(
    "/:periodoId/linhas",
    { schema: { params: ParametrosPeriodo, body: LinhaOrcamentadaInput } },
    async (request, reply) => {
      const periodo = await definirLinha(
        app.prisma,
        familiaIdObrigatoria(request),
        request.params.periodoId,
        request.body,
      );
      if (!periodo) return reply.code(404).send({ mensagem: "Orçamento não encontrado." });
      return periodo;
    },
  );

  rotas.delete("/:periodoId/linhas/:linhaId", { schema: { params: ParametrosLinha } }, async (request, reply) => {
    const removida = await removerLinha(
      app.prisma,
      familiaIdObrigatoria(request),
      request.params.periodoId,
      request.params.linhaId,
    );
    if (!removida) return reply.code(404).send({ mensagem: "Linha orçamentada não encontrada." });
    return reply.code(204).send();
  });
}
