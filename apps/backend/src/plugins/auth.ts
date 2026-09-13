import fp from "fastify-plugin";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { verificarAccessToken, type AccessTokenPayload } from "../lib/jwt.js";

declare module "fastify" {
  interface FastifyRequest {
    utilizador?: AccessTokenPayload;
  }
  interface FastifyInstance {
    autenticar: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    exigirAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    exigirGestor: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  app.decorate("autenticar", async (request: FastifyRequest, reply: FastifyReply) => {
    const cabecalho = request.headers.authorization;
    if (!cabecalho?.startsWith("Bearer ")) {
      return reply.code(401).send({ mensagem: "Sessão não autenticada." });
    }
    try {
      request.utilizador = verificarAccessToken(cabecalho.slice("Bearer ".length));
    } catch {
      return reply.code(401).send({ mensagem: "Sessão inválida ou expirada." });
    }
  });

  app.decorate("exigirAdmin", async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.utilizador?.papel !== "ADMIN") {
      return reply.code(403).send({ mensagem: "Ação reservada ao administrador da família." });
    }
  });

  app.decorate("exigirGestor", async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.utilizador?.papel !== "GESTOR") {
      return reply.code(403).send({ mensagem: "Ação reservada ao gestor da aplicação." });
    }
  });
});
