import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3333),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_DIAS: z.coerce.number().int().positive().default(30),
});

const resultado = EnvSchema.safeParse(process.env);
if (!resultado.success) {
  console.error("Variáveis de ambiente inválidas:", resultado.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = resultado.data;
