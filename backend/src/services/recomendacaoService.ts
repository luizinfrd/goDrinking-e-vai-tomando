import { prisma } from '../lib/prisma';
import { erros } from '../utils/erros';

export const CODIGO_ONBOARDING_PENDENTE = 'ONBOARDING_PENDENTE';

const DIMENSOES = ['doce', 'seco', 'citrico', 'encorpado'] as const;
const ROTULOS: Record<(typeof DIMENSOES)[number], string> = {
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
function explicar(vetorUsuario: number[], vetorBebida: number[]): string {
  const contribuicoes = DIMENSOES
    .map((dim, i) => ({ dim, valor: vetorUsuario[i] * vetorBebida[i] }))
    .filter((c) => c.valor > 0.05)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 2)
    .map((c) => ROTULOS[c.dim]);

  if (contribuicoes.length === 0) return 'Uma sugestão para ampliar seu repertório';
  return `Porque você gosta de bebidas ${contribuicoes.join(' e ')}`;
}

async function vetorDoUsuario(userId: string) {
  const preferencias = await prisma.userPreference.findUnique({ where: { userId } });

  if (!preferencias) {
    throw erros.naoEncontrado('Preferências do usuário não encontradas');
  }

  const vetor = [
    preferencias.pesoDoce,
    preferencias.pesoSeco,
    preferencias.pesoCitrico,
    preferencias.pesoEncorpado,
  ];

  // cold start: sem onboarding e sem avaliações não há como recomendar
  if (vetor.every((v) => v === 0)) {
    throw erros.conflito(CODIGO_ONBOARDING_PENDENTE);
  }

  return vetor;
}

export const recomendacaoService = {
  async recomendar(userId: string, tipo?: string, limite: number = 10) {
    // busca o vetor de preferências do usuário
    const vetorUsuario = await vetorDoUsuario(userId);

    // busca as bebidas que o usuário ainda não avaliou
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { userId },
      select: { bebidaId: true },
    });

    const bebidasJaAvaliadas = avaliacoes.map((a) => a.bebidaId);

    const bebidas = await prisma.bebida.findMany({
      where: {
        id: { notIn: bebidasJaAvaliadas },
        ...(tipo && { tipo: { equals: tipo, mode: 'insensitive' } }),
      },
      // cruzamento de dados: locais onde a bebida está disponível
      include: {
        locais: {
          take: 3,
          include: { local: { select: { id: true, nome: true, endereco: true, tipo: true } } },
        },
      },
    });

    // calcula o score de similaridade de cada bebida
    const bebidasComScore = bebidas.map(({ locais, ...bebida }) => {
      const vetorBebida = [
        bebida.atributoDoce,
        bebida.atributoSeco,
        bebida.atributoCitrico,
        bebida.atributoEncorpado,
      ];

      return {
        ...bebida,
        score: similaridadeCosseno(vetorUsuario, vetorBebida),
        motivo: explicar(vetorUsuario, vetorBebida),
        locais: locais.map((bl) => bl.local),
      };
    });

    // ordena pelo score e retorna as top N (em empate, a melhor avaliada primeiro)
    return bebidasComScore
      .sort((a, b) => b.score - a.score || b.notaMedia - a.notaMedia)
      .slice(0, limite)
      .map((bebida) => ({
        ...bebida,
        score: Math.round(bebida.score * 100) / 100,
      }));
  },

  async recomendarLocais(userId: string, limite: number = 5) {
    // pega as top 20 bebidas recomendadas para o usuário
    const bebidasRecomendadas = await recomendacaoService.recomendar(userId, undefined, 20);
    const idsBebidas = bebidasRecomendadas.map((b) => b.id);

    // busca locais que têm essas bebidas
    const locais = await prisma.local.findMany({
      where: {
        bebidas: { some: { bebidaId: { in: idsBebidas } } },
      },
      include: {
        bebidas: {
          where: { bebidaId: { in: idsBebidas } },
          include: { bebida: { select: { id: true, nome: true, tipo: true } } },
        },
      },
    });

    // calcula um score para cada local baseado nas bebidas recomendadas que ele tem
    return locais
      .map((local) => {
        const scores = local.bebidas.map(
          (bl) => bebidasRecomendadas.find((b) => b.id === bl.bebidaId)?.score ?? 0
        );
        const scoreLocal = scores.reduce((soma, s) => soma + s, 0) / scores.length;
        return { ...local, scoreCompatibilidade: Math.round(scoreLocal * 100) / 100 };
      })
      // ordena antes de cortar, para retornar os realmente mais compatíveis
      .sort((a, b) => b.scoreCompatibilidade - a.scoreCompatibilidade)
      .slice(0, limite);
  },
};
