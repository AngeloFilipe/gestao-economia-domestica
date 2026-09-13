import type { PrismaClient } from "@prisma/client";
import type {
  AgregadoDTO,
  ConvidarMembroInput,
  CriarAgregadoInput,
  LoginGestorInput,
  LoginInput,
  UtilizadorPublico,
} from "@ged/shared";
import { env } from "../env.js";
import { normalizarCodigoLogin } from "../lib/agregado.js";
import { assinarAccessToken } from "../lib/jwt.js";
import { hashPassword, verificarPassword } from "../lib/password.js";
import { gerarRefreshTokenBruto, hashRefreshToken } from "../lib/refresh-token.js";

export class ErroAutenticacao extends Error {}

function paraPublico(utilizador: {
  id: string;
  familiaId: string | null;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
}): UtilizadorPublico {
  return {
    id: utilizador.id,
    familiaId: utilizador.familiaId,
    nome: utilizador.nome,
    email: utilizador.email,
    papel: utilizador.papel as UtilizadorPublico["papel"],
    ativo: utilizador.ativo,
  };
}

async function emitirSessao(
  prisma: PrismaClient,
  utilizadorId: string,
  familiaId: string | null,
  papel: string,
) {
  const accessToken = assinarAccessToken({
    sub: utilizadorId,
    familiaId,
    papel: papel as "GESTOR" | "ADMIN" | "MEMBRO",
  });

  const refreshTokenBruto = gerarRefreshTokenBruto();
  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + env.REFRESH_TOKEN_EXPIRES_DIAS);

  await prisma.refreshToken.create({
    data: { utilizadorId, tokenHash: hashRefreshToken(refreshTokenBruto), expiraEm },
  });

  return { accessToken, refreshTokenBruto };
}

/** Login normal: um membro/administrador que indica a que agregado pertence. */
export async function autenticar(prisma: PrismaClient, input: LoginInput) {
  const codigoLogin = normalizarCodigoLogin(input.nomeAgregado);
  const agregado = await prisma.familia.findUnique({ where: { codigoLogin } });
  if (!agregado) throw new ErroAutenticacao("Agregado não encontrado — verifique o nome.");

  const utilizador = await prisma.utilizador.findFirst({
    where: { email: input.email, familiaId: agregado.id },
  });
  if (!utilizador || !utilizador.ativo) throw new ErroAutenticacao("Credenciais inválidas.");

  const passwordValida = await verificarPassword(utilizador.passwordHash, input.password);
  if (!passwordValida) throw new ErroAutenticacao("Credenciais inválidas.");

  const sessao = await emitirSessao(prisma, utilizador.id, utilizador.familiaId, utilizador.papel);
  return { utilizador: paraPublico(utilizador), ...sessao };
}

/** Login do gestor da aplicação — não está associado a nenhum agregado. */
export async function autenticarGestor(prisma: PrismaClient, input: LoginGestorInput) {
  const utilizador = await prisma.utilizador.findFirst({
    where: { email: input.email, papel: "GESTOR" },
  });
  if (!utilizador || !utilizador.ativo) throw new ErroAutenticacao("Credenciais inválidas.");

  const passwordValida = await verificarPassword(utilizador.passwordHash, input.password);
  if (!passwordValida) throw new ErroAutenticacao("Credenciais inválidas.");

  const sessao = await emitirSessao(prisma, utilizador.id, null, "GESTOR");
  return { utilizador: paraPublico(utilizador), ...sessao };
}

export async function refrescarSessao(prisma: PrismaClient, refreshTokenBruto: string) {
  const tokenHash = hashRefreshToken(refreshTokenBruto);
  const registo = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { utilizador: true },
  });

  if (!registo || registo.revogadoEm || registo.expiraEm < new Date() || !registo.utilizador.ativo) {
    throw new ErroAutenticacao("Sessão expirada, é necessário iniciar sessão novamente.");
  }

  // Rotação: o refresh token usado é imediatamente revogado.
  await prisma.refreshToken.update({ where: { id: registo.id }, data: { revogadoEm: new Date() } });

  const sessao = await emitirSessao(
    prisma,
    registo.utilizador.id,
    registo.utilizador.familiaId,
    registo.utilizador.papel,
  );
  return { utilizador: paraPublico(registo.utilizador), ...sessao };
}

export async function terminarSessao(prisma: PrismaClient, refreshTokenBruto: string) {
  const tokenHash = hashRefreshToken(refreshTokenBruto);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revogadoEm: null },
    data: { revogadoEm: new Date() },
  });
}

/** Só o gestor da aplicação pode criar agregados. */
export async function criarAgregado(prisma: PrismaClient, input: CriarAgregadoInput) {
  const codigoLogin = normalizarCodigoLogin(input.nomeAgregado);

  const agregadoExistente = await prisma.familia.findUnique({ where: { codigoLogin } });
  if (agregadoExistente) throw new ErroAutenticacao("Já existe um agregado com este nome.");

  const emailExistente = await prisma.utilizador.findUnique({ where: { email: input.emailAdmin } });
  if (emailExistente) throw new ErroAutenticacao("Já existe uma conta com este email.");

  const agregado = await prisma.familia.create({
    data: { nome: input.nomeAgregado.trim(), codigoLogin },
  });

  await prisma.utilizador.create({
    data: {
      familiaId: agregado.id,
      nome: input.nomeAdmin,
      email: input.emailAdmin,
      passwordHash: await hashPassword(input.passwordAdmin),
      papel: "ADMIN",
    },
  });

  return agregadoParaDTO(agregado.id, agregado.nome, agregado.criadoEm, 1);
}

export async function listarAgregados(prisma: PrismaClient): Promise<AgregadoDTO[]> {
  const agregados = await prisma.familia.findMany({
    include: { _count: { select: { utilizadores: true } } },
    orderBy: { criadoEm: "desc" },
  });
  return agregados.map((a) => agregadoParaDTO(a.id, a.nome, a.criadoEm, a._count.utilizadores));
}

function agregadoParaDTO(id: string, nome: string, criadoEm: Date, totalMembros: number): AgregadoDTO {
  return { id, nome, criadoEm: criadoEm.toISOString(), totalMembros };
}

/** Um administrador cadastra mais membros dentro do seu próprio agregado. */
export async function convidarMembro(prisma: PrismaClient, familiaId: string, input: ConvidarMembroInput) {
  const jaExiste = await prisma.utilizador.findUnique({ where: { email: input.email } });
  if (jaExiste) throw new ErroAutenticacao("Já existe uma conta com este email.");

  const utilizador = await prisma.utilizador.create({
    data: {
      familiaId,
      nome: input.nome,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      papel: input.papel,
    },
  });
  return paraPublico(utilizador);
}

/**
 * Cria a conta do gestor da aplicação a partir de GESTOR_EMAIL/GESTOR_PASSWORD
 * (ver .env.example), se ainda não existir — chamado uma vez no arranque do
 * servidor. Sem registo público, isto é a única forma de a primeira conta do
 * sistema nascer.
 */
export async function garantirGestorInicial(prisma: PrismaClient) {
  if (!env.GESTOR_EMAIL || !env.GESTOR_PASSWORD) {
    console.warn(
      "GESTOR_EMAIL/GESTOR_PASSWORD não definidos em .env — nenhuma conta de gestor foi criada.",
    );
    return;
  }

  const existente = await prisma.utilizador.findUnique({ where: { email: env.GESTOR_EMAIL } });
  if (existente) return;

  await prisma.utilizador.create({
    data: {
      familiaId: null,
      nome: "Gestor da Aplicação",
      email: env.GESTOR_EMAIL,
      passwordHash: await hashPassword(env.GESTOR_PASSWORD),
      papel: "GESTOR",
    },
  });
  console.log(`Conta de gestor criada (${env.GESTOR_EMAIL}).`);
}
