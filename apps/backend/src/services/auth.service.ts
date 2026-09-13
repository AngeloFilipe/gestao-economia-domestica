import type { PrismaClient } from "@prisma/client";
import type {
  ConvidarMembroInput,
  LoginInput,
  RegistarFamiliaInput,
  UtilizadorPublico,
} from "@ged/shared";
import { env } from "../env.js";
import { assinarAccessToken } from "../lib/jwt.js";
import { hashPassword, verificarPassword } from "../lib/password.js";
import { gerarRefreshTokenBruto, hashRefreshToken } from "../lib/refresh-token.js";

export class ErroAutenticacao extends Error {}

function paraPublico(utilizador: {
  id: string;
  familiaId: string;
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

async function emitirSessao(prisma: PrismaClient, utilizadorId: string, familiaId: string, papel: string) {
  const accessToken = assinarAccessToken({ sub: utilizadorId, familiaId, papel: papel as "ADMIN" | "MEMBRO" });

  const refreshTokenBruto = gerarRefreshTokenBruto();
  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + env.REFRESH_TOKEN_EXPIRES_DIAS);

  await prisma.refreshToken.create({
    data: { utilizadorId, tokenHash: hashRefreshToken(refreshTokenBruto), expiraEm },
  });

  return { accessToken, refreshTokenBruto };
}

export async function registarFamilia(prisma: PrismaClient, input: RegistarFamiliaInput) {
  const jaExiste = await prisma.utilizador.findUnique({ where: { email: input.email } });
  if (jaExiste) throw new ErroAutenticacao("Já existe uma conta com este email.");

  const familia = await prisma.familia.create({ data: { nome: input.nomeFamilia } });
  const utilizador = await prisma.utilizador.create({
    data: {
      familiaId: familia.id,
      nome: input.nomeUtilizador,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      papel: "ADMIN",
    },
  });

  const sessao = await emitirSessao(prisma, utilizador.id, familia.id, utilizador.papel);
  return { utilizador: paraPublico(utilizador), ...sessao };
}

export async function autenticar(prisma: PrismaClient, input: LoginInput) {
  const utilizador = await prisma.utilizador.findUnique({ where: { email: input.email } });
  if (!utilizador || !utilizador.ativo) throw new ErroAutenticacao("Credenciais inválidas.");

  const passwordValida = await verificarPassword(utilizador.passwordHash, input.password);
  if (!passwordValida) throw new ErroAutenticacao("Credenciais inválidas.");

  const sessao = await emitirSessao(prisma, utilizador.id, utilizador.familiaId, utilizador.papel);
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
