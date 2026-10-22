// vetor de sabor: as quatro dimensões usadas em todo o algoritmo, sempre na mesma ordem
export const DIMENSOES = ['doce', 'seco', 'citrico', 'encorpado'] as const;

export type Dimensao = (typeof DIMENSOES)[number];
export type VetorSabor = Record<Dimensao, number>;

export const VETOR_ZERO: VetorSabor = { doce: 0, seco: 0, citrico: 0, encorpado: 0 };

export function criarVetor(valorDe: (dimensao: Dimensao) => number): VetorSabor {
  return { doce: valorDe('doce'), seco: valorDe('seco'), citrico: valorDe('citrico'), encorpado: valorDe('encorpado') };
}

export const paraLista = (vetor: VetorSabor) => DIMENSOES.map((d) => vetor[d]);

export const ehVetorNulo = (vetor: VetorSabor) => DIMENSOES.every((d) => vetor[d] === 0);

export function arredondar(valor: number, casas = 4): number {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

// mapeamentos das colunas do banco para o vetor
export type AtributosBebida = {
  atributoDoce: number;
  atributoSeco: number;
  atributoCitrico: number;
  atributoEncorpado: number;
};

export function vetorDaBebida(b: AtributosBebida): VetorSabor {
  return { doce: b.atributoDoce, seco: b.atributoSeco, citrico: b.atributoCitrico, encorpado: b.atributoEncorpado };
}

export function vetorDePesos(p: { pesoDoce: number; pesoSeco: number; pesoCitrico: number; pesoEncorpado: number }): VetorSabor {
  return { doce: p.pesoDoce, seco: p.pesoSeco, citrico: p.pesoCitrico, encorpado: p.pesoEncorpado };
}

export function vetorBase(p: { baseDoce: number; baseSeco: number; baseCitrico: number; baseEncorpado: number }): VetorSabor {
  return { doce: p.baseDoce, seco: p.baseSeco, citrico: p.baseCitrico, encorpado: p.baseEncorpado };
}
