import { z } from 'zod';
import { atributo, textoOpcional, texto, urlOpcional } from './comum';

const camposComuns = {
  nome: texto('Nome', 120),
  descricao: textoOpcional('descricao', 1000),
  imagemUrl: urlOpcional('imagemUrl'),
  atributoDoce: atributo('atributoDoce').optional(),
  atributoSeco: atributo('atributoSeco').optional(),
  atributoCitrico: atributo('atributoCitrico').optional(),
  atributoEncorpado: atributo('atributoEncorpado').optional(),
};

const camposDrink = {
  baseAlcoolica: texto('baseAlcoolica', 80),
  ingredientes: textoOpcional('ingredientes', 500),
};

const camposVinho = {
  tipoVinho: texto('tipoVinho', 40),
  uva: textoOpcional('uva', 120),
  paisOrigem: textoOpcional('paisOrigem', 80),
};

// os campos específicos dependem do tipo (RF de cadastro por tipo)
export const criarBebidaSchema = z.discriminatedUnion(
  'tipo',
  [
    z.object({ tipo: z.literal('drink'), ...camposComuns, ...camposDrink }),
    z.object({ tipo: z.literal('vinho'), ...camposComuns, ...camposVinho }),
  ],
  { error: 'Tipo deve ser "vinho" ou "drink"' }
);

// o tipo não muda depois de criado; a coerência dos campos específicos é checada no service
export const atualizarBebidaSchema = z.object({
  tipo: z.never({ error: 'O tipo da bebida não pode ser alterado' }).optional(),
  ...camposComuns,
  ...camposDrink,
  ...camposVinho,
}).partial();

export const listarBebidasSchema = z.object({
  tipo: z.string().trim().toLowerCase().optional(),
  nome: z.string().trim().optional(),
});

export type CriarBebida = z.infer<typeof criarBebidaSchema>;
export type AtualizarBebida = z.infer<typeof atualizarBebidaSchema>;
export type FiltrosBebida = z.infer<typeof listarBebidasSchema>;
