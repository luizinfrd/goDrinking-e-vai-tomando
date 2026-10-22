// construtores de campos com mensagens em pt-BR (a primeira mensagem vira o "error" da resposta 400)
import { z } from 'zod';

export const texto = (rotulo: string, max = 200) =>
  z
    .string({ error: `${rotulo} é obrigatório` })
    .trim()
    .min(1, `${rotulo} é obrigatório`)
    .max(max, `${rotulo} deve ter no máximo ${max} caracteres`);

// texto opcional: string vazia vira null; undefined continua undefined (não altera no update)
export const textoOpcional = (rotulo: string, max = 1000) =>
  z
    .string({ error: `${rotulo} deve ser um texto` })
    .trim()
    .max(max, `${rotulo} deve ter no máximo ${max} caracteres`)
    .nullish()
    .transform((v) => (v === undefined ? undefined : v || null));

// aceita caminho servido pelo front (/img/...) ou url http(s)
export const urlOpcional = (rotulo: string) =>
  z
    .string({ error: `${rotulo} deve ser um texto` })
    .trim()
    .max(500, `${rotulo} deve ter no máximo 500 caracteres`)
    .refine((v) => v === '' || /^(https?:\/\/|\/)/.test(v), `${rotulo} deve ser uma URL`)
    .nullish()
    .transform((v) => (v === undefined ? undefined : v || null));

// atributos de sabor sempre entre 0 e 1 (usados no cálculo de similaridade)
export const atributo = (rotulo: string) => {
  const mensagem = `${rotulo} deve ser um número entre 0 e 1`;
  return z.number({ error: mensagem }).min(0, mensagem).max(1, mensagem);
};

export const id = (rotulo: string) => z.uuid({ error: `${rotulo} inválido` });

export const paramsComId = z.object({ id: id('id') });

export const vetorSabor = z.object({
  doce: atributo('doce'),
  seco: atributo('seco'),
  citrico: atributo('citrico'),
  encorpado: atributo('encorpado'),
});
