import { z } from 'zod';
import { id, texto, textoOpcional, urlOpcional } from './comum';

const coordenada = (rotulo: string, limite: number) => {
  const mensagem = `${rotulo} deve ser um número entre -${limite} e ${limite}`;
  return z.number({ error: mensagem }).min(-limite, mensagem).max(limite, mensagem).nullish();
};

const camposLocal = {
  nome: texto('Nome', 120),
  tipo: textoOpcional('tipo', 40),
  endereco: textoOpcional('endereco', 300),
  descricao: textoOpcional('descricao', 1000),
  imagemUrl: urlOpcional('imagemUrl'),
  latitude: coordenada('latitude', 90),
  longitude: coordenada('longitude', 180),
};

export const criarLocalSchema = z.object(camposLocal);
export const atualizarLocalSchema = z.object(camposLocal).partial();

export const listarLocaisSchema = z.object({
  tipo: z.string().trim().optional(),
  nome: z.string().trim().optional(),
});

export const associarBebidaSchema = z.object({ bebidaId: id('bebidaId') });

export const paramsLocalBebida = z.object({ id: id('id'), bebidaId: id('bebidaId') });

export type CriarLocal = z.infer<typeof criarLocalSchema>;
export type AtualizarLocal = z.infer<typeof atualizarLocalSchema>;
export type FiltrosLocal = z.infer<typeof listarLocaisSchema>;
