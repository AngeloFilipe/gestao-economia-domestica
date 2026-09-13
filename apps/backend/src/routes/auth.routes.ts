import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  AgregadoDTO,
  ConvidarGestorInput,
  ConvidarMembroInput,
  CriarAgregadoInput,
  ErroResposta,
  LoginGestorInput,
  LoginInput,
  SessaoResposta,
  UtilizadorPublico,
} from "@ged/shared";
import {
  ErroAutenticacao,
  autenticar,
  autenticarGestor,
  convidarGestor,
  convidarMembro,
  criarAgregado,
  listarAgregados,
  listarGestores,
  refrescarSessao,
  terminarSessao,
} from "../services/auth.service.js";
import { familiaIdObrigatoria } from "../lib/contexto.js";

const NOME_COOKIE_REFRESH = "refresh_token";
const OPCOES_COOKIE = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/api/auth",
};

export async function authRoutes(app: FastifyInstance) {
  const rotas = app.withTypeProvider<ZodTypeProvider>();

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
    "/gestor/login",
    { schema: { body: LoginGestorInput, response: { 200: SessaoResposta, 401: ErroResposta } } },
    async (request, reply) => {
      try {
        const { accessToken, refreshTokenBruto, utilizador } = await autenticarGestor(app.prisma, request.body);
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
        papel: utilizador.papel as "GESTOR" | "ADMIN" | "MEMBRO",
        ativo: utilizador.ativo,
      };
    },
  );

  rotas.get(
    "/membros",
    { preHandler: app.autenticar, schema: { response: { 200: z.array(UtilizadorPublico) } } },
    async (request) => {
      const familiaId = familiaIdObrigatoria(request);
      const membros = await app.prisma.utilizador.findMany({
        where: { familiaId },
        orderBy: { criadoEm: "asc" },
      });
      return membros.map((m) => ({
        id: m.id,
        familiaId: m.familiaId,
        nome: m.nome,
        email: m.email,
        papel: m.papel as "GESTOR" | "ADMIN" | "MEMBRO",
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
        const familiaId = familiaIdObrigatoria(request);
        return await convidarMembro(app.prisma, familiaId, request.body);
      } catch (erro) {
        if (erro instanceof ErroAutenticacao) return reply.code(409).send({ mensagem: erro.message });
        throw erro;
      }
    },
  );

  // --- Gestor da aplicação: cria agregados e o primeiro administrador de cada um ---

  rotas.get(
    "/gestor/agregados",
    {
      preHandler: [app.autenticar, app.exigirGestor],
      schema: { response: { 200: z.array(AgregadoDTO) } },
    },
    async () => listarAgregados(app.prisma),
  );

  rotas.post(
    "/gestor/agregados",
    {
      preHandler: [app.autenticar, app.exigirGestor],
      schema: { body: CriarAgregadoInput, response: { 200: AgregadoDTO, 409: ErroResposta } },
    },
    async (request, reply) => {
      try {
        return await criarAgregado(app.prisma, request.body);
      } catch (erro) {
        if (erro instanceof ErroAutenticacao) return reply.code(409).send({ mensagem: erro.message });
        throw erro;
      }
    },
  );

  rotas.get(
    "/gestor/gestores",
    {
      preHandler: [app.autenticar, app.exigirGestor],
      schema: { response: { 200: z.array(UtilizadorPublico) } },
    },
    async () => listarGestores(app.prisma),
  );

  rotas.post(
    "/gestor/gestores",
    {
      preHandler: [app.autenticar, app.exigirGestor],
      schema: { body: ConvidarGestorInput, response: { 200: UtilizadorPublico, 409: ErroResposta } },
    },
    async (request, reply) => {
      try {
        return await convidarGestor(app.prisma, request.body);
      } catch (erro) {
        if (erro instanceof ErroAutenticacao) return reply.code(409).send({ mensagem: erro.message });
        throw erro;
      }
    },
  );
}
