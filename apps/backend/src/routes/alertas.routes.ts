import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { listarAlertas, marcarAlertaLido } from "../services/alertas.service.js";

const QueryAlertas = z.object({ apenasNaoLidos: z.coerce.boolean().optional() });
const ParametrosAlerta = z.object({ alertaId: z.string() });

export async function alertasRoutes(app: FastifyInstance) {
  const rotas = app.withTypeProvider<ZodTypeProvider>();
  rotas.addHook("preHandler", app.autenticar);

  rotas.get("/", { schema: { querystring: QueryAlertas } }, async (request) =>
    listarAlertas(app.prisma, request.utilizador!.familiaId, { apenasNaoLidos: request.query.apenasNaoLidos }),
  );

  rotas.patch("/:alertaId/lido", { schema: { params: ParametrosAlerta } }, async (request, reply) => {
    const alerta = await marcarAlertaLido(
      app.prisma,
      request.utilizador!.familiaId,
      request.params.alertaId,
      request.utilizador!.sub,
    );
    if (!alerta) return reply.code(404).send({ mensagem: "Alerta não encontrado." });
    return reply.code(204).send();
  });
}
