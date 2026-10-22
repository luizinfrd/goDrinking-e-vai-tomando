import { prisma } from '../lib/prisma';
import { NaoEncontradoError, seInexistente } from '../errors/AppError';
import { calcularConquistas, LIMIAR_CITRICO } from '../domain/conquistas';
import { vetorBase, vetorDePesos, VetorSabor } from '../domain/sabor';
import { avaliacaoRepository } from '../repositories/avaliacaoRepository';
import { bebidaRepository } from '../repositories/bebidaRepository';
import { usuarioRepository } from '../repositories/usuarioRepository';
import { preferenciaService } from './preferenciaService';

export const usuarioService = {
  // dados do perfil + preferências + estatísticas para o "Meu Bar"
  async buscarPerfil(userId: string) {
    const [user, estatisticas, porTipo, paraConquistas, totalCitricas] = await Promise.all([
      usuarioRepository.buscarComPreferencias(userId),
      avaliacaoRepository.estatisticasDoUsuario(userId),
      bebidaRepository.contagemPorTipoAvaliadaPor(userId),
      avaliacaoRepository.listarParaConquistas(userId),
      bebidaRepository.contarComAtributoCitricoMinimo(LIMIAR_CITRICO),
    ]);
    if (!user) {
      throw new NaoEncontradoError('Usuário não encontrado');
    }

    const { preferences, ...dados } = user;
    return {
      ...dados,
      onboardingConcluido: preferences?.onboardingConcluido ?? false,
      preferencias: preferences && vetorDePesos(preferences),
      preferenciasBase: preferences && vetorBase(preferences),
      estatisticas: {
        totalAvaliacoes: estatisticas._count._all,
        mediaNotas: Math.round((estatisticas._avg.nota ?? 0) * 10) / 10,
        drinks: porTipo.find((t) => t.tipo === 'drink')?._count._all ?? 0,
        vinhos: porTipo.find((t) => t.tipo === 'vinho')?._count._all ?? 0,
      },
      conquistas: calcularConquistas(paraConquistas, totalCitricas),
    };
  },

  async atualizarPerfil(userId: string, nome: string) {
    return seInexistente(usuarioRepository.atualizarNome(userId, nome), 'Usuário não encontrado');
  },

  async salvarPreferencias(userId: string, vetor: VetorSabor) {
    await preferenciaService.salvarOnboarding(userId, vetor);
    return usuarioService.buscarPerfil(userId);
  },

  // exclusão definitiva (RF06 / LGPD): avaliações e preferências caem em cascade
  async excluirConta(userId: string) {
    await prisma.$transaction(async (tx) => {
      const bebidasAvaliadas = await avaliacaoRepository.idsDeBebidasAvaliadas(userId, tx);
      await seInexistente(usuarioRepository.excluir(userId, tx), 'Usuário não encontrado');
      await preferenciaService.recalcularNotasMedias(bebidasAvaliadas, tx);
    });
  },
};
