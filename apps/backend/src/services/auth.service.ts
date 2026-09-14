import type { PrismaClient } from "@prisma/client";
import type {
  AgregadoDTO,
  ConvidarGestorInput,
  ConvidarMembroInput,
  CriarAgregadoInput,
  LoginGestorInput,
  LoginInput,
  RegistarAgregadoInput,
  UtilizadorPublico,
} from "@ged/shared";
import { env } from "../env.js";
import { normalizarCodigoLogin } from "../lib/agregado.js";
import { assinarAccessToken } from "../lib/jwt.js";
import { hashPassword, verificarPassword } from "../lib/password.js";
import { gerarRefreshTokenBruto, hashRefreshToken } from "../lib/refresh-token.js";

export class ErroAutenticacao extends Error {}

/** Nome de agregado já ocupado — carrega sempre uma alternativa livre pronta a propor. */
export class ErroNomeAgregadoOcupado extends ErroAutenticacao {
  constructor(
    mensagem: string,
    public sugestao: string,
  ) {
    super(mensagem);
  }
}

/**
 * Encontra uma variante livre de `nomeOriginal` (ex.: "Costa Filipe 2",
 * "Costa Filipe 3", …) para propor quando o nome pedido já está ocupado.
 * Usa `normalizarCodigoLogin` para verificar disponibilidade real (a mesma
 * regra usada no login), não apenas igualdade de texto.
 */
async function sugerirNomeAgregadoLivre(prisma: PrismaClient, nomeOriginal: string): Promise<string> {
  const base = nomeOriginal.trim();
  for (let sufixo = 2; sufixo <= 50; sufixo++) {
    const candidato = `${base} ${sufixo}`;
    const ocupado = await prisma.familia.findUnique({
      where: { codigoLogin: normalizarCodigoLogin(candidato) },
    });
    if (!ocupado) return candidato;
  }
  // Extremamente improvável (50 famílias com o mesmo nome-base) — garante sempre uma saída.
  return `${base} ${Date.now().toString().slice(-5)}`;
}

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

/**
 * Auto-registo do "Chefe de Agregado": cria o seu próprio agregado e fica
 * automaticamente como Gestor do Agregado (papel ADMIN) — não depende do
 * gestor da aplicação. O nome de utilizador nasce igual ao email (não se
 * pede um nome à parte no registo). Se o nome de agregado pedido já
 * existir, não falha a direito: devolve uma sugestão livre para o utilizador
 * aceitar ou ajustar.
 */
export async function registarAgregado(prisma: PrismaClient, input: RegistarAgregadoInput) {
  if (input.password !== input.confirmarPassword) {
    throw new ErroAutenticacao("As passwords não coincidem.");
  }

  const emailExistente = await prisma.utilizador.findUnique({ where: { email: input.email } });
  if (emailExistente) throw new ErroAutenticacao("Já existe uma conta com este email.");

  const codigoLogin = normalizarCodigoLogin(input.nomeAgregado);
  const agregadoExistente = await prisma.familia.findUnique({ where: { codigoLogin } });
  if (agregadoExistente) {
    const sugestao = await sugerirNomeAgregadoLivre(prisma, input.nomeAgregado);
    throw new ErroNomeAgregadoOcupado("Já existe um agregado com este nome.", sugestao);
  }

  const agregado = await prisma.familia.create({
    data: { nome: input.nomeAgregado.trim(), codigoLogin },
  });

  const utilizador = await prisma.utilizador.create({
    data: {
      familiaId: agregado.id,
      nome: input.email,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      papel: "ADMIN",
    },
  });

  const sessao = await emitirSessao(prisma, utilizador.id, agregado.id, "ADMIN");
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
  if (agregadoExistente) {
    const sugestao = await sugerirNomeAgregadoLivre(prisma, input.nomeAgregado);
    throw new ErroNomeAgregadoOcupado("Já existe um agregado com este nome.", sugestao);
  }

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

/** Um gestor existente cadastra outro gestor da aplicação — nenhum pertence a um agregado. */
export async function convidarGestor(prisma: PrismaClient, input: ConvidarGestorInput) {
  const jaExiste = await prisma.utilizador.findUnique({ where: { email: input.email } });
  if (jaExiste) throw new ErroAutenticacao("Já existe uma conta com este email.");

  const utilizador = await prisma.utilizador.create({
    data: {
      familiaId: null,
      nome: input.nome,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      papel: "GESTOR",
    },
  });
  return paraPublico(utilizador);
}

export async function listarGestores(prisma: PrismaClient): Promise<UtilizadorPublico[]> {
  const gestores = await prisma.utilizador.findMany({
    where: { papel: "GESTOR" },
    orderBy: { criadoEm: "asc" },
  });
  return gestores.map(paraPublico);
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
