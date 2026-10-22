import { z } from 'zod';
import { harmonizacao } from './comum';
import { faixaPrecoMax } from './local';

// limite inválido cai no padrão; acima de 50 é cortado
const limite = z.coerce.number().int().positive().transform((n) => Math.min(n, 50)).optional().catch(undefined);

export const recomendarSchema = z.object({
  tipo: z.enum(['drink', 'vinho']).optional().catch(undefined),
  harmoniza: harmonizacao.optional().catch(undefined),
  limite,
});

// lat/lng opcionais: com elas, a distância entra no score (B4)
export const recomendarLocaisSchema = z
  .object({
    limite,
    lat: z.coerce.number().min(-90).max(90).optional().catch(undefined),
    lng: z.coerce.number().min(-180).max(180).optional().catch(undefined),
    raioKm: z.coerce.number().positive().max(100).optional().catch(undefined),
    faixaPrecoMax,
  })
  .transform(({ lat, lng, ...resto }) => ({
    ...resto,
    posicao: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
  }));

export const metricasSchema = z.object({
  k: z.coerce.number().int().min(1).max(20).optional().catch(undefined),
});
