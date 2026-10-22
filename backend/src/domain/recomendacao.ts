// núcleo do algoritmo de recomendação (content-based com similaridade cosseno), sem acesso a banco
import { DIMENSOES, Dimensao, paraLista, VetorSabor } from './sabor';

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

// contribuição de cada dimensão para o produto escalar, em % (explicação detalhada do RF26)
export type Contribuicao = { dimensao: Dimensao; percentual: number };

export function contribuicoes(usuario: VetorSabor, bebida: VetorSabor): Contribuicao[] {
  const produtos = DIMENSOES.map((dimensao) => ({ dimensao, valor: usuario[dimensao] * bebida[dimensao] }));
  const total = produtos.reduce((soma, p) => soma + p.valor, 0);
  if (total === 0) return [];
  return produtos
    .map((p) => ({ dimensao: p.dimensao, percentual: Math.round((p.valor / total) * 100) }))
    .sort((a, b) => b.percentual - a.percentual);
}

/*
 * percepção dos usuários: média dos atributos que quem provou informou na avaliação.
 * o vetor efetivo da bebida mistura o declarado com o percebido, e o peso do percebido
 * cresce com o número de respostas: n / (n + 5). com poucas respostas vale o catálogo;
 * com muitas, a opinião de quem provou.
 */
export const MINIMO_RESPOSTAS_PERCEPCAO = 3;
const SUAVIZACAO_PERCEPCAO = 5;

export type Percepcao = { media: VetorSabor; total: number };

export function pesoDaPercepcao(total: number): number {
  return total / (total + SUAVIZACAO_PERCEPCAO);
}

export function vetorEfetivoDaBebida(declarado: VetorSabor, percepcao?: Percepcao | null): VetorSabor {
  if (!percepcao || percepcao.total === 0) return declarado;
  const peso = pesoDaPercepcao(percepcao.total);
  const efetivo = { ...declarado };
  for (const d of DIMENSOES) efetivo[d] = declarado[d] * (1 - peso) + percepcao.media[d] * peso;
  return efetivo;
}

// quanto a descrição acerta segundo quem provou: 100% = percepção igual ao declarado
export function assertividade(declarado: VetorSabor, percebido: VetorSabor): number {
  const diferencaMedia = DIMENSOES.reduce((soma, d) => soma + Math.abs(declarado[d] - percebido[d]), 0) / DIMENSOES.length;
  return Math.round((1 - diferencaMedia) * 100);
}

/*
 * componente colaborativo (leve): os k usuários de paladar mais parecido (cosseno entre vetores
 * de preferência) e as notas que deram. entra com peso 0,2 no score final; bebidas sem nota
 * dos vizinhos ficam só com o score de conteúdo.
 */
export const PESO_COLABORATIVO = 0.2;
export const TOTAL_VIZINHOS = 10;

export type VetorDeUsuario = { userId: string; vetor: VetorSabor };
export type Vizinho = { userId: string; similaridade: number };
export type NotaDeUsuario = { userId: string; bebidaId: string; nota: number };
export type SinalColaborativo = { score: number; notaMedia: number; avaliadores: number };

export function vizinhosMaisProximos(vetor: VetorSabor, outros: VetorDeUsuario[], k = TOTAL_VIZINHOS): Vizinho[] {
  const lista = paraLista(vetor);
  return outros
    .map((o) => ({ userId: o.userId, similaridade: similaridadeCosseno(lista, paraLista(o.vetor)) }))
    .filter((v) => v.similaridade > 0)
    .sort((a, b) => b.similaridade - a.similaridade)
    .slice(0, k);
}

// nota média dos vizinhos ponderada pela similaridade, normalizada de 1–5 para 0–1
export function sinaisColaborativos(vizinhos: Vizinho[], notas: NotaDeUsuario[]): Map<string, SinalColaborativo> {
  const similaridade = new Map(vizinhos.map((v) => [v.userId, v.similaridade]));
  const acumulado = new Map<string, { somaPesos: number; somaNotas: number; avaliadores: number }>();
  for (const { userId, bebidaId, nota } of notas) {
    const peso = similaridade.get(userId);
    if (!peso) continue;
    const atual = acumulado.get(bebidaId) ?? { somaPesos: 0, somaNotas: 0, avaliadores: 0 };
    atual.somaPesos += peso;
    atual.somaNotas += peso * nota;
    atual.avaliadores += 1;
    acumulado.set(bebidaId, atual);
  }
  const sinais = new Map<string, SinalColaborativo>();
  for (const [bebidaId, { somaPesos, somaNotas, avaliadores }] of acumulado) {
    const notaMedia = somaNotas / somaPesos;
    sinais.set(bebidaId, { score: (notaMedia - 1) / 4, notaMedia, avaliadores });
  }
  return sinais;
}

export function scoreHibrido(conteudo: number, sinal?: SinalColaborativo): number {
  if (!sinal) return conteudo;
  return (1 - PESO_COLABORATIVO) * conteudo + PESO_COLABORATIVO * sinal.score;
}

// prioriza a explicação social quando os vizinhos aprovaram de verdade
export function explicarColaborativo(sinal?: SinalColaborativo): string | null {
  if (!sinal || sinal.avaliadores < 2 || sinal.notaMedia < 4) return null;
  return `Pessoas com paladar parecido com o seu deram ${sinal.notaMedia.toFixed(1).replace('.', ',')}`;
}

export type Candidata = { id: string; notaMedia: number; vetor: VetorSabor };
export type Ranqueada = { id: string; score: number; scoreConteudo: number; sinal?: SinalColaborativo };

// ordena as candidatas pelo score (em empate, a melhor avaliada primeiro)
export function ranquear(usuario: VetorSabor, candidatas: Candidata[], sinais?: Map<string, SinalColaborativo>): Ranqueada[] {
  const lista = paraLista(usuario);
  const notaMedia = new Map(candidatas.map((c) => [c.id, c.notaMedia]));
  return candidatas
    .map((c) => {
      const scoreConteudo = similaridadeCosseno(lista, paraLista(c.vetor));
      const sinal = sinais?.get(c.id);
      return { id: c.id, scoreConteudo, sinal, score: scoreHibrido(scoreConteudo, sinal) };
    })
    .sort((a, b) => b.score - a.score || (notaMedia.get(b.id) ?? 0) - (notaMedia.get(a.id) ?? 0));
}
