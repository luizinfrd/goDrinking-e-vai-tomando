import { z } from 'zod';
import { id, urlOpcional, vetorSabor } from './comum';

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

// opcionais: percepção dos atributos (B1) e diário de degustação (B8); null limpa o campo
const camposOpcionais = {
  comentario,
  percepcao: vetorSabor.nullish(),
  localId: id('localId').nullish(),
  fotoUrl: urlOpcional('fotoUrl'),
};

export const criarAvaliacaoSchema = z.object({
  bebidaId: id('bebidaId'),
  nota,
  ...camposOpcionais,
});

export const atualizarAvaliacaoSchema = z.object({
  nota: nota.optional(),
  ...camposOpcionais,
});

export const minhasAvaliacoesSchema = z.object({ bebidaId: id('bebidaId').optional() });

export type CriarAvaliacao = z.infer<typeof criarAvaliacaoSchema>;
export type AtualizarAvaliacao = z.infer<typeof atualizarAvaliacaoSchema>;
