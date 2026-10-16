// recálculo do vetor de preferências do usuário (RF24)
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

type Cliente = Prisma.TransactionClient | typeof prisma;

export type VetorSabor = {
  doce: number;
  seco: number;
  citrico: number;
  encorpado: number;
};

const arredondar = (v: number) => Math.round(v * 10000) / 10000;

export const preferenciaService = {
  /*
   * média ponderada entre o vetor do onboarding (peso 1) e cada avaliação,
   * onde o valor de cada avaliação = atributos da bebida × (nota / 5).
   * é exatamente a fórmula novo_score = (score_atual × n + valor) / (n + 1)
   * aplicada em sequência, mas recalculada do zero — assim editar ou
   * excluir uma avaliação também deixa o vetor correto.
   */
  async recalcular(userId: string, cliente: Cliente = prisma) {
    const preferencia = await cliente.userPreference.findUnique({ where: { userId } });
    if (!preferencia) return null;

    const avaliacoes = await cliente.avaliacao.findMany({
      where: { userId },
      select: {
        nota: true,
        bebida: {
          select: { atributoDoce: true, atributoSeco: true, atributoCitrico: true, atributoEncorpado: true },
        },
      },
    });

    // sem onboarding o vetor base é zero e não entra na média
    const pesoBase = preferencia.onboardingConcluido ? 1 : 0;
    const soma = {
      doce: preferencia.baseDoce * pesoBase,
      seco: preferencia.baseSeco * pesoBase,
      citrico: preferencia.baseCitrico * pesoBase,
      encorpado: preferencia.baseEncorpado * pesoBase,
    };

    for (const { nota, bebida } of avaliacoes) {
      const fator = nota / 5; // normaliza a nota para 0-1
      soma.doce += bebida.atributoDoce * fator;
      soma.seco += bebida.atributoSeco * fator;
      soma.citrico += bebida.atributoCitrico * fator;
      soma.encorpado += bebida.atributoEncorpado * fator;
    }

    const n = pesoBase + avaliacoes.length;
    const divisor = n === 0 ? 1 : n;

    return cliente.userPreference.update({
      where: { userId },
      data: {
        pesoDoce: arredondar(soma.doce / divisor),
        pesoSeco: arredondar(soma.seco / divisor),
        pesoCitrico: arredondar(soma.citrico / divisor),
        pesoEncorpado: arredondar(soma.encorpado / divisor),
      },
    });
  },

  // grava as respostas do onboarding como vetor base e recalcula (RF03)
  async salvarOnboarding(userId: string, vetor: VetorSabor) {
    return prisma.$transaction(async (tx) => {
      await tx.userPreference.upsert({
        where: { userId },
        create: {
          userId,
          baseDoce: vetor.doce,
          baseSeco: vetor.seco,
          baseCitrico: vetor.citrico,
          baseEncorpado: vetor.encorpado,
          onboardingConcluido: true,
        },
        update: {
          baseDoce: vetor.doce,
          baseSeco: vetor.seco,
          baseCitrico: vetor.citrico,
          baseEncorpado: vetor.encorpado,
          onboardingConcluido: true,
        },
      });
      return preferenciaService.recalcular(userId, tx);
    });
  },

  // nota média da bebida recalculada a partir das avaliações existentes
  async recalcularNotaMedia(bebidaId: string, cliente: Cliente = prisma) {
    const { _avg } = await cliente.avaliacao.aggregate({
      where: { bebidaId },
      _avg: { nota: true },
    });
    const notaMedia = Math.round((_avg.nota ?? 0) * 100) / 100;
    await cliente.bebida.update({ where: { id: bebidaId }, data: { notaMedia } });
    return notaMedia;
  },
};
