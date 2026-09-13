import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  ConvidarMembroInput,
  ErroResposta,
  LoginInput,
  RegistarFamiliaInput,
  SessaoResposta,
  UtilizadorPublico,
} from "@ged/shared";
import {
  ErroAutenticacao,
  autenticar,
  convidarMembro,
  refrescarSessao,
  registarFamilia,
  terminarSessao,
} from "../services/auth.service.js";

const NOME_COOKIE_REFRESH = "refresh_token";
const OPCOES_COOKIE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/api/auth",
};

export async function authRoutes(app: FastifyInstance) {
  const rotas = app.withTypeProvider<ZodTypeProvider>();

  rotas.post(
    "/registar",
    { schema: { body: RegistarFamiliaInput, response: { 200: SessaoResposta, 409: ErroResposta } } },
    async (request, reply) => {
      try {
        const { accessToken, refreshTokenBruto, utilizador } = await registarFamilia(
          app.prisma,
          request.body,
        );
        reply.setCookie(NOME_COOKIE_REFRESH, refreshTokenBruto, OPCOES_COOKIE);
        return { accessToken, utilizador };
      } catch (erro) {
        if (erro instanceof ErroAutenticacao) return reply.code(409).send({ mensagem: erro.message });
        throw erro;
      }
    },
  );

  rotas.post(
    "/login",
    { schema: { body: LoginInput, response: { 200: SessaoResposta, 401: ErroResposta } } },
    async (request, reply) => {
      try {
        const { accessToken, refreshTokenBruto, utilizador } = await autenticar(app.prisma, request.body);
        reply.setCookie(NOME_COOKIE_REFRESH, refreshTokenBruto, OPCOES_COOKIE);
        return { accessToken, utilizador };
      } catch (erro) {
        if (erro instanceof ErroAutenticacao) return reply.code(401).send({ mensagem: erro.message });
        throw erro;
      }
    },
  );

  rotas.post(
    "/refrescar",
    { schema: { response: { 200: SessaoResposta, 401: ErroResposta } } },
    async (request, reply) => {
      const tokenBruto = request.cookies[NOME_COOKIE_REFRESH];
      if (!tokenBruto) return reply.code(401).send({ mensagem: "Sem sessão para renovar." });

      try {
        const { accessToken, refreshTokenBruto, utilizador } = await refrescarSessao(app.prisma, tokenBruto);
        reply.setCookie(NOME_COOKIE_REFRESH, refreshTokenBruto, OPCOES_COOKIE);
        return { accessToken, utilizador };
      } catch (erro) {
        reply.clearCookie(NOME_COOKIE_REFRESH, { path: "/api/auth" });
        if (erro instanceof ErroAutenticacao) return reply.code(401).send({ mensagem: erro.message });
        throw erro;
      }
    },
  );

  rotas.post("/logout", async (request, reply) => {
    const tokenBruto = request.cookies[NOME_COOKIE_REFRESH];
    if (tokenBruto) await terminarSessao(app.prisma, tokenBruto);
    reply.clearCookie(NOME_COOKIE_REFRESH, { path: "/api/auth" });
    return { ok: true };
  });

  rotas.get(
    "/me",
    { preHandler: app.autenticar, schema: { response: { 200: UtilizadorPublico, 404: ErroResposta } } },
    async (request, reply) => {
      const utilizador = await app.prisma.utilizador.findUnique({ where: { id: request.utilizador!.sub } });
      if (!utilizador) return reply.code(404).send({ mensagem: "Utilizador não encontrado." });
      return {
        id: utilizador.id,
        familiaId: utilizador.familiaId,
        nome: utilizador.nome,
        email: utilizador.email,
        papel: utilizador.papel as "ADMIN" | "MEMBRO",
        ativo: utilizador.ativo,
      };
    },
  );

  rotas.get(
    "/membros",
    { preHandler: app.autenticar, schema: { response: { 200: z.array(UtilizadorPublico) } } },
    async (request) => {
      const membros = await app.prisma.utilizador.findMany({
        where: { familiaId: request.utilizador!.familiaId },
        orderBy: { criadoEm: "asc" },
      });
      return membros.map((m) => ({
        id: m.id,
        familiaId: m.familiaId,
        nome: m.nome,
        email: m.email,
        papel: m.papel as "ADMIN" | "MEMBRO",
        ativo: m.ativo,
      }));
    },
  );

  rotas.post(
    "/membros",
    {
      preHandler: [app.autenticar, app.exigirAdmin],
      schema: { body: ConvidarMembroInput, response: { 200: UtilizadorPublico, 409: ErroResposta } },
    },
    async (request, reply) => {
      try {
        return await convidarMembro(app.prisma, request.utilizador!.familiaId, request.body);
      } catch (erro) {
        if (erro instanceof ErroAutenticacao) return reply.code(409).send({ mensagem: erro.message });
        throw erro;
      }
    },
  );
}
