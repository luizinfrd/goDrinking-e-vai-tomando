// variáveis de ambiente validadas no boot: configuração errada derruba a API na subida, não na primeira requisição
import 'dotenv/config';
import { z } from 'zod';

const esquema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL não configurada'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET não configurado'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const resultado = esquema.safeParse(process.env);
if (!resultado.success) {
  console.error('configuração inválida:', resultado.error.issues.map((i) => i.message).join('; '));
  process.exit(1);
}

export const env = resultado.data;
export const origensPermitidas = env.CORS_ORIGIN.split(',').map((o) => o.trim());
