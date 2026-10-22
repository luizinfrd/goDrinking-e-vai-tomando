import { HARMONIZACOES } from '../../src/schemas/comum';
import { VetorSabor } from '../../src/domain/sabor';

export type Harmonizacao = (typeof HARMONIZACOES)[number];

/*
 * critério dos atributos (0 a 1):
 * doce      → açúcar residual / xaropes / licores
 * seco      → ausência de açúcar, amargor, taninos e álcool marcante
 * citrico   → acidez e presença de frutas cítricas
 * encorpado → corpo, peso e intensidade na boca
 */
export type BebidaSeed = {
  nome: string;
  descricao: string;
  sabor: VetorSabor;
  harmonizaCom: Harmonizacao[];
  // foto servida pelo front (frontend/public/img), créditos em frontend/public/img/CREDITOS.md
  imagem?: string;
} & (
  | { tipo: 'drink'; baseAlcoolica: string; ingredientes: string }
  | { tipo: 'vinho'; tipoVinho: string; uva: string; paisOrigem: string }
);

export type LocalSeed = {
  nome: string;
  tipo: 'bar' | 'restaurante' | 'adega';
  endereco: string;
  latitude: number;
  longitude: number;
  descricao: string;
  faixaPreco: 1 | 2 | 3 | 4;
  imagem?: string;
  // nomes das bebidas do seed servidas no local (cardápio ilustrativo)
  bebidas: string[];
};
