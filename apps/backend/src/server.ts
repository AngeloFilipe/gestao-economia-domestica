import { buildApp } from "./app.js";
import { env } from "./env.js";
import { agendarRecalculoDiario } from "./jobs/recalculo-diario.job.js";

async function main() {
  const app = await buildApp();
  agendarRecalculoDiario(app.prisma);

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  app.log.info(`API disponível em http://localhost:${env.PORT} (documentação em /docs)`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
