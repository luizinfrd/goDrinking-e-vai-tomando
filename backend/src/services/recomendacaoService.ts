import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// calcula a similaridade cosseno entre dois vetores
function similaridadeCosseno(a: number[], b: number[]): number {
  const produtoEscalar = a.reduce((soma, val, i) => soma + val * b[i], 0);
  
  const magnitudeA = Math.sqrt(a.reduce((soma, val) => soma + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((soma, val) => soma + val * val, 0));

  // evita divisão por zero
  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return produtoEscalar / (magnitudeA * magnitudeB);
}

export const recomendacaoService = {
  async recomendar(userId: string, tipo?: string, limite: number = 10) {
    // busca o vetor de preferências do usuário
    const preferencias = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!preferencias) {
      throw new Error('Preferências do usuário não encontradas');
    }

    // monta o vetor do usuário
    const vetorUsuario = [
      preferencias.pesoDoce,
      preferencias.pesoSeco,
      preferencias.pesoCitrico,
      preferencias.pesoEncorpado,
    ];

    // busca os ids das bebidas que o usuário já avaliou
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { userId },
      select: { bebidaId: true },
    });

    const bebidasJaAvaliadas = avaliacoes.map((a) => a.bebidaId);

    // busca bebidas ainda não avaliadas pelo usuário
    const bebidas = await prisma.bebida.findMany({
      where: {
        id: { notIn: bebidasJaAvaliadas },
        ...(tipo && { tipo: { equals: tipo, mode: 'insensitive' } }),
      },
    });

    // calcula a similaridade de cada bebida com o perfil do usuário
    const bebidasComScore = bebidas.map((bebida) => {
      const vetorBebida = [
        bebida.atributoDoce,
        bebida.atributoSeco,
        bebida.atributoCitrico,
        bebida.atributoEncorpado,
      ];

      const score = similaridadeCosseno(vetorUsuario, vetorBebida);

      return { ...bebida, score };
    });

    // ordena pelo score e retorna as top-N
    return bebidasComScore
      .sort((a, b) => b.score - a.score)
      .slice(0, limite)
      .map(({ score, ...bebida }) => ({
        ...bebida,
        score: Math.round(score * 100) / 100, // arredonda para 2 casas
      }));
  },

  async recomendarLocais(userId: string, limite: number = 5) {
    // busca as bebidas recomendadas para o usuário
    const bebidasRecomendadas = await recomendacaoService.recomendar(userId, undefined, 20);
    const idsBebidas = bebidasRecomendadas.map((b) => b.id);

    // busca locais que têm essas bebidas
    const locais = await prisma.local.findMany({
      where: {
        bebidas: {
          some: {
            bebidaId: { in: idsBebidas },
          },
        },
      },
      include: {
        bebidas: {
          where: {
            bebidaId: { in: idsBebidas },
          },
          include: {
            bebida: {
              select: { id: true, nome: true, tipo: true },
            },
          },
        },
      },
      take: limite,
    });

    // enriquece cada local com o score médio das bebidas compatíveis
    return locais.map((local) => {
      const scoresBebidasNoLocal = local.bebidas.map((bl) => {
        const bebidaRec = bebidasRecomendadas.find((b) => b.id === bl.bebidaId);
        return bebidaRec?.score ?? 0;
      });

      const scoreLocal =
        scoresBebidasNoLocal.reduce((soma, s) => soma + s, 0) /
        scoresBebidasNoLocal.length;

      return {
        ...local,
        scoreCompatibilidade: Math.round(scoreLocal * 100) / 100,
      };
    }).sort((a, b) => b.scoreCompatibilidade - a.scoreCompatibilidade);
  },
};