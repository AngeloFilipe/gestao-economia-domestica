import cron from "node-cron";
import type { PrismaClient } from "@prisma/client";
import { avaliarAlertasTodosPeriodosAtivos } from "../services/alertas.service.js";

/**
 * Corre 1x/dia, dentro do próprio processo do backend (sem infraestrutura de
 * filas/scheduler externa — adequado à escala de uma app doméstica). Recalcula
 * o saldo projetado de todos os períodos ATIVO mesmo que não tenha havido
 * nenhum movimento novo, porque o simples avançar dos dias muda quanto do
 * orçamento ainda resta para gastar.
 */
export function agendarRecalculoDiario(prisma: PrismaClient) {
  cron.schedule("0 3 * * *", async () => {
    try {
      await avaliarAlertasTodosPeriodosAtivos(prisma);
    } catch (erro) {
      console.error("Falha no recálculo diário de alertas:", erro);
    }
  });
}
