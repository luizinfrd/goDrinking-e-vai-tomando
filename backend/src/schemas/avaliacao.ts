import { z } from 'zod';
import { id } from './comum';

const nota = z
  .number({ error: 'A nota deve ser um número inteiro entre 1 e 5' })
  .int('A nota deve ser um número inteiro entre 1 e 5')
  .min(1, 'A nota deve ser um número inteiro entre 1 e 5')
  .max(5, 'A nota deve ser um número inteiro entre 1 e 5');

const comentario = z
  .string({ error: 'O comentário deve ser um texto' })
  .trim()
  .max(500, 'O comentário deve ter no máximo 500 caracteres')
  .nullish()
  .transform((v) => (v === undefined ? undefined : v || null));

export const criarAvaliacaoSchema = z.object({
  bebidaId: id('bebidaId'),
  nota,
  comentario,
});

export const atualizarAvaliacaoSchema = z.object({
  nota: nota.optional(),
  comentario,
});

export type CriarAvaliacao = z.infer<typeof criarAvaliacaoSchema>;
export type AtualizarAvaliacao = z.infer<typeof atualizarAvaliacaoSchema>;
