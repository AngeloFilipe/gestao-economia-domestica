import type { FastifyRequest } from "fastify";

/**
 * A maior parte das rotas (orçamento, movimentos, relatórios, alertas,
 * categorias) só faz sentido para um utilizador associado a um agregado
 * (ADMIN/MEMBRO) — nunca para o GESTOR da aplicação, cujo familiaId é
 * sempre NULL. Este helper centraliza essa verificação, em vez de repetir
 * `request.utilizador!.familiaId` (que o TypeScript já não aceitaria como
 * `string`, agora que familiaId é opcional).
 */
export function familiaIdObrigatoria(request: FastifyRequest): string {
  const familiaId = request.utilizador?.familiaId;
  if (!familiaId) {
    const erro = new Error("Esta ação requer uma conta associada a um agregado familiar.");
    (erro as Error & { statusCode: number }).statusCode = 403;
    throw erro;
  }
  return familiaId;
}
