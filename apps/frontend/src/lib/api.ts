import type { SessaoResposta } from "@ged/shared";

let accessTokenAtual: string | null = null;

export function definirAccessToken(token: string | null) {
  accessTokenAtual = token;
}

export class ErroApi extends Error {
  constructor(
    public status: number,
    mensagem: string,
    /** Presente quando o backend sugere uma alternativa (ex.: nome de agregado já ocupado). */
    public sugestao?: string,
  ) {
    super(mensagem);
  }
}

interface OpcoesPedido extends RequestInit {
  semRetentativa?: boolean;
}

/**
 * O refresh token é de uso único (roda a cada pedido). Se várias chamadas em
 * paralelo (ex.: várias queries a carregar ao mesmo tempo, ou o duplo-mount
 * do React StrictMode) tentassem cada uma renovar a sessão por si, apenas a
 * primeira teria sucesso — as restantes usariam um cookie já rodado e
 * terminariam a sessão por engano. Por isso todas as chamadas concorrentes
 * partilham a mesma promessa em curso, em vez de disparar um pedido cada.
 */
let promessaRenovacao: Promise<SessaoResposta | null> | null = null;

export function renovarSessao(): Promise<SessaoResposta | null> {
  if (!promessaRenovacao) {
    promessaRenovacao = fetch("/api/auth/refrescar", { method: "POST", credentials: "include" })
      .then(async (resposta) => {
        if (!resposta.ok) return null;
        const dados = (await resposta.json()) as SessaoResposta;
        definirAccessToken(dados.accessToken);
        return dados;
      })
      .catch(() => null)
      .finally(() => {
        promessaRenovacao = null;
      });
  }
  return promessaRenovacao;
}

export async function pedidoApi<T>(caminho: string, opcoes: OpcoesPedido = {}): Promise<T> {
  const executar = () =>
    fetch(`/api${caminho}`, {
      ...opcoes,
      credentials: "include",
      headers: {
        ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
        ...(accessTokenAtual ? { Authorization: `Bearer ${accessTokenAtual}` } : {}),
        ...opcoes.headers,
      },
    });

  let resposta = await executar();

  if (resposta.status === 401 && !opcoes.semRetentativa) {
    const sessao = await renovarSessao();
    if (sessao) resposta = await executar();
  }

  if (resposta.status === 204) return undefined as T;

  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : undefined;

  if (!resposta.ok) {
    throw new ErroApi(resposta.status, dados?.mensagem ?? "Ocorreu um erro inesperado.", dados?.sugestao);
  }

  return dados as T;
}

export const api = {
  get: <T>(caminho: string) => pedidoApi<T>(caminho),
  post: <T>(caminho: string, corpo?: unknown) =>
    pedidoApi<T>(caminho, { method: "POST", body: corpo !== undefined ? JSON.stringify(corpo) : undefined }),
  put: <T>(caminho: string, corpo?: unknown) =>
    pedidoApi<T>(caminho, { method: "PUT", body: corpo !== undefined ? JSON.stringify(corpo) : undefined }),
  patch: <T>(caminho: string, corpo?: unknown) =>
    pedidoApi<T>(caminho, { method: "PATCH", body: corpo !== undefined ? JSON.stringify(corpo) : undefined }),
  delete: <T>(caminho: string) => pedidoApi<T>(caminho, { method: "DELETE" }),
};
