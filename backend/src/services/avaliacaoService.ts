import { prisma } from '../lib/prisma';
import { NaoEncontradoError, ProibidoError, seDuplicado } from '../errors/AppError';
import { AtualizarAvaliacao, CriarAvaliacao } from '../schemas/avaliacao';
import { avaliacaoRepository } from '../repositories/avaliacaoRepository';
import { bebidaRepository } from '../repositories/bebidaRepository';
import { preferenciaService } from './preferenciaService';

async function avaliacaoDoUsuario(id: string, userId: string, acao: string) {
  const avaliacao = await avaliacaoRepository.buscarPorId(id);
  if (!avaliacao) {
    throw new NaoEncontradoError('Avaliação não encontrada');
  }
  if (avaliacao.userId !== userId) {
    throw new ProibidoError(`Você não tem permissão para ${acao} essa avaliação`);
  }
  return avaliacao;
}

export const avaliacaoService = {
  // grava e recalcula nota média + vetor de preferências na mesma transação.
  // a unique (userId, bebidaId) e a FK da bebida garantem as regras sem consulta prévia
  async criar(userId: string, dados: CriarAvaliacao) {
    return prisma.$transaction(async (tx) => {
      const avaliacao = await seDuplicado(
        avaliacaoRepository.criar({ userId, ...dados }, tx),
        'Você já avaliou essa bebida'
      );
      await preferenciaService.recalcularNotasMedias([dados.bebidaId], tx);
      await preferenciaService.recalcular(userId, tx);
      return avaliacao;
    });
  },

  async atualizar(id: string, userId: string, dados: AtualizarAvaliacao) {
    const avaliacao = await avaliacaoDoUsuario(id, userId, 'editar');

    return prisma.$transaction(async (tx) => {
      const atualizada = await avaliacaoRepository.atualizar(id, dados, tx);
      await preferenciaService.recalcularNotasMedias([avaliacao.bebidaId], tx);
      await preferenciaService.recalcular(userId, tx);
      return atualizada;
    });
  },

  async listarPorBebida(bebidaId: string) {
    const [existe, avaliacoes] = await Promise.all([
      bebidaRepository.existe(bebidaId),
      avaliacaoRepository.listarPorBebida(bebidaId),
    ]);
    if (!existe) {
      throw new NaoEncontradoError('Bebida não encontrada');
    }
    return avaliacoes;
  },

  async listarPorUsuario(userId: string, filtros: { bebidaId?: string } = {}) {
    return avaliacaoRepository.listarPorUsuario(userId, filtros);
  },

  // remove e desfaz o efeito na nota média e nas preferências (RF17)
  async deletar(id: string, userId: string) {
    const avaliacao = await avaliacaoDoUsuario(id, userId, 'deletar');

    await prisma.$transaction(async (tx) => {
      await avaliacaoRepository.excluir(id, tx);
      await preferenciaService.recalcularNotasMedias([avaliacao.bebidaId], tx);
      await preferenciaService.recalcular(userId, tx);
    });
  },
};
