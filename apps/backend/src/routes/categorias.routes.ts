import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { CategoriaDTO, CriarCategoriaInput } from "@ged/shared";
import { ErroCategoria, criarCategoriaPersonalizada, obterArvoreCategorias } from "../services/categorias.service.js";

export async function categoriasRoutes(app: FastifyInstance) {
  const rotas = app.withTypeProvider<ZodTypeProvider>();

  rotas.get(
    "/",
    { preHandler: app.autenticar, schema: { response: { 200: z.array(CategoriaDTO) } } },
    async (request) => obterArvoreCategorias(app.prisma, request.utilizador!.familiaId),
  );

  rotas.post(
    "/",
    { preHandler: app.autenticar, schema: { body: CriarCategoriaInput } },
    async (request, reply) => {
      try {
        return await criarCategoriaPersonalizada(app.prisma, request.utilizador!.familiaId, request.body);
      } catch (erro) {
        if (erro instanceof ErroCategoria) return reply.code(400).send({ mensagem: erro.message });
        throw erro;
      }
    },
  );
}
