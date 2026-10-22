// recálculo do vetor de preferências (RF24) e da nota média das bebidas
import { Db, prisma } from '../lib/prisma';
import { calcularVetorPreferencia } from '../domain/preferencia';
import { arredondar, vetorBase, vetorDaBebida, VetorSabor } from '../domain/sabor';
import { avaliacaoRepository } from '../repositories/avaliacaoRepository';
import { bebidaRepository } from '../repositories/bebidaRepository';
import { preferenciaRepository } from '../repositories/preferenciaRepository';

export const preferenciaService = {
  // deve rodar sempre que uma avaliação do usuário (ou uma bebida avaliada por ele) mudar, na mesma transação
  async recalcular(userId: string, db: Db = prisma) {
    const preferencia = await preferenciaRepository.buscar(userId, db);
    if (!preferencia) return null;

    const avaliacoes = await avaliacaoRepository.listarParaVetor(userId, db);
    const vetor = calcularVetorPreferencia(
      preferencia.onboardingConcluido ? vetorBase(preferencia) : null,
      avaliacoes.map((a) => ({ nota: a.nota, vetor: vetorDaBebida(a.bebida) }))
    );
    return preferenciaRepository.atualizarPesos(userId, vetor, db);
  },

  async recalcularVarios(userIds: string[], db: Db = prisma) {
    for (const userId of new Set(userIds)) {
      await preferenciaService.recalcular(userId, db);
    }
  },

  // grava as respostas do onboarding como vetor base e recalcula (RF03)
  async salvarOnboarding(userId: string, vetor: VetorSabor) {
    return prisma.$transaction(async (tx) => {
      await preferenciaRepository.salvarBase(userId, vetor, tx);
      return preferenciaService.recalcular(userId, tx);
    });
  },

  // nota média recalculada a partir das avaliações existentes (bebida sem avaliação fica com 0)
  async recalcularNotasMedias(bebidaIds: string[], db: Db = prisma) {
    const ids = [...new Set(bebidaIds)];
    const medias = await avaliacaoRepository.mediasDasNotas(ids, db);
    for (const id of ids) {
      await bebidaRepository.atualizarNotaMedia(id, arredondar(medias.get(id) ?? 0, 2), db);
    }
  },
};
