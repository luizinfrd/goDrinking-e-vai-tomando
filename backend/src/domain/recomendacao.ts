// núcleo do algoritmo de recomendação (content-based com similaridade cosseno), sem acesso a banco
import { DIMENSOES, Dimensao, VetorSabor } from './sabor';

const ROTULOS: Record<Dimensao, string> = {
  doce: 'doces',
  seco: 'secas',
  citrico: 'cítricas',
  encorpado: 'encorpadas',
};

// calcula a similaridade cosseno entre dois vetores
export function similaridadeCosseno(a: number[], b: number[]): number {
  const produtoEscalar = a.reduce((soma, val, i) => soma + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((soma, val) => soma + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((soma, val) => soma + val * val, 0));

  // evita divisão por zero
  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return produtoEscalar / (magnitudeA * magnitudeB);
}

// explica a recomendação (RF26): as duas dimensões que mais contribuíram para o produto escalar
export function explicar(usuario: VetorSabor, bebida: VetorSabor): string {
  const principais = DIMENSOES
    .map((dim) => ({ dim, valor: usuario[dim] * bebida[dim] }))
    .filter((c) => c.valor > 0.05)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 2)
    .map((c) => ROTULOS[c.dim]);

  if (principais.length === 0) return 'Uma sugestão para ampliar seu repertório';
  return `Porque você gosta de bebidas ${principais.join(' e ')}`;
}
