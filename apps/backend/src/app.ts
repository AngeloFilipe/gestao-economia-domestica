import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import { env } from "./env.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { authPlugin } from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.routes.js";
import { categoriasRoutes } from "./routes/categorias.routes.js";
import { orcamentoRoutes } from "./routes/orcamento.routes.js";
import { movimentosRoutes } from "./routes/movimentos.routes.js";
import { relatoriosRoutes } from "./routes/relatorios.routes.js";
import { alertasRoutes } from "./routes/alertas.routes.js";

export async function buildApp() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(cookie);
  await app.register(swagger, {
    openapi: { info: { title: "Gestão de Economia Doméstica — API", version: "0.1.0" } },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });

  await app.register(prismaPlugin);
  await app.register(authPlugin);

  app.get("/health", async () => ({ estado: "ok" }));

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(categoriasRoutes, { prefix: "/api/categorias" });
  await app.register(orcamentoRoutes, { prefix: "/api/orcamento" });
  await app.register(movimentosRoutes, { prefix: "/api/movimentos" });
  await app.register(relatoriosRoutes, { prefix: "/api/relatorios" });
  await app.register(alertasRoutes, { prefix: "/api/alertas" });

  return app;
}
