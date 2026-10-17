import { prisma } from '../lib/prisma';
import { erros } from '../utils/erros';
import { preferenciaService, VetorSabor } from './preferenciaService';

export const usuarioService = {
  // dados do perfil + preferências + estatísticas para o "Meu Bar"
  async buscarPerfil(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nome: true, email: true, dataCriacao: true, preferences: true },
    });
    if (!user) {
      throw erros.naoEncontrado('Usuário não encontrado');
    }

    const estatisticas = await prisma.avaliacao.aggregate({
      where: { userId },
      _count: { _all: true },
      _avg: { nota: true },
    });
    const porTipo = await prisma.bebida.groupBy({
      by: ['tipo'],
      where: { avaliacoes: { some: { userId } } },
      _count: { _all: true },
    });

    const { preferences, ...dados } = user;
    return {
      ...dados,
      onboardingConcluido: preferences?.onboardingConcluido ?? false,
      preferencias: preferences && {
        doce: preferences.pesoDoce,
        seco: preferences.pesoSeco,
        citrico: preferences.pesoCitrico,
        encorpado: preferences.pesoEncorpado,
      },
      preferenciasBase: preferences && {
        doce: preferences.baseDoce,
        seco: preferences.baseSeco,
        citrico: preferences.baseCitrico,
        encorpado: preferences.baseEncorpado,
      },
      estatisticas: {
        totalAvaliacoes: estatisticas._count._all,
        mediaNotas: Math.round((estatisticas._avg.nota ?? 0) * 10) / 10,
        drinks: porTipo.find((t) => t.tipo === 'drink')?._count._all ?? 0,
        vinhos: porTipo.find((t) => t.tipo === 'vinho')?._count._all ?? 0,
      },
    };
  },

  async atualizarPerfil(userId: string, nome: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { nome },
      select: { id: true, nome: true, email: true },
    });
  },

  async salvarPreferencias(userId: string, vetor: VetorSabor) {
    await preferenciaService.salvarOnboarding(userId, vetor);
    return usuarioService.buscarPerfil(userId);
  },

  // exclusão definitiva (RF06 / LGPD): avaliações e preferências caem em cascade
  async excluirConta(userId: string) {
    const avaliacoes = await prisma.avaliacao.findMany({ where: { userId }, select: { bebidaId: true } });
    await prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id: userId } });
      for (const { bebidaId } of avaliacoes) {
        await preferenciaService.recalcularNotaMedia(bebidaId, tx);
      }
    });
  },
};
