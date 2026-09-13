import type { FastifyInstance } from "fastify";
import { familiaIdObrigatoria } from "../lib/contexto.js";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { calcularOrcadoRealizado, calcularRegra555, calcularSaldoMensal } from "../services/relatorios.service.js";

const ParametrosPeriodo = z.object({ periodoId: z.string() });
const QuerySaldoMensal = z.object({ meses: z.coerce.number().int().min(1).max(36).default(12) });

export async function relatoriosRoutes(app: FastifyInstance) {
  const rotas = app.withTypeProvider<ZodTypeProvider>();
  rotas.addHook("preHandler", app.autenticar);

  rotas.get("/orcado-realizado/:periodoId", { schema: { params: ParametrosPeriodo } }, async (request, reply) => {
    const relatorio = await calcularOrcadoRealizado(
      app.prisma,
      familiaIdObrigatoria(request),
      request.params.periodoId,
    );
    if (!relatorio) return reply.code(404).send({ mensagem: "Orçamento não encontrado." });
    return relatorio;
  });

  rotas.get("/saldo-mensal", { schema: { querystring: QuerySaldoMensal } }, async (request) =>
    calcularSaldoMensal(app.prisma, familiaIdObrigatoria(request), request.query.meses),
  );

  rotas.get("/regra-555/:periodoId", { schema: { params: ParametrosPeriodo } }, async (request, reply) => {
    const resultado = await calcularRegra555(app.prisma, familiaIdObrigatoria(request), request.params.periodoId);
    if (!resultado) return reply.code(404).send({ mensagem: "Orçamento não encontrado." });
    return resultado;
  });
}
