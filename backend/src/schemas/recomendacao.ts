import { z } from 'zod';

// limite inválido cai no padrão; acima de 50 é cortado
const limite = z.coerce.number().int().positive().transform((n) => Math.min(n, 50)).optional().catch(undefined);

export const recomendarSchema = z.object({
  tipo: z.enum(['drink', 'vinho']).optional().catch(undefined),
  limite,
});

export const recomendarLocaisSchema = z.object({ limite });
