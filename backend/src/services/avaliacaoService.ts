import { prisma } from '../lib/prisma';
import { NaoEncontradoError, ProibidoError, seDuplicado } from '../errors/AppError';
import { colunasPercebidas } from '../domain/sabor';
import { AtualizarAvaliacao, CriarAvaliacao } from '../schemas/avaliacao';
import { avaliacaoRepository } from '../repositories/avaliacaoRepository';
import { bebidaRepository } from '../repositories/bebidaRepository';
import { usuarioRepository } from '../repositories/usuarioRepository';
import { preferenciaService } from './preferenciaService';

// a percepção chega como vetor e é gravada nas quatro colunas; undefined não altera, null limpa
function colunasDaAvaliacao<T extends Pick<AtualizarAvaliacao, 'percepcao'>>(dados: T) {
  const { percepcao, ...resto } = dados;
  return { ...resto, ...(percepcao !== undefined && colunasPercebidas(percepcao)) };
}

async function buscarParaAlterar(id: string, userId: string, acao: string, { permiteAdmin = false } = {}) {
  const avaliacao = await avaliacaoRepository.buscarPorId(id);
  if (!avaliacao) {
    throw new NaoEncontradoError('Avaliação não encontrada');
  }
  // moderação: admin pode remover avaliações de terceiros (mas não editá-las)
  if (avaliacao.userId !== userId && !(permiteAdmin && (await usuarioRepository.ehAdmin(userId)))) {
    throw new ProibidoError(`Você não tem permissão para ${acao} essa avaliação`);
  }
  return avaliacao;
}

export const avaliacaoService = {
  // grava e recalcula nota média + vetor de preferências na mesma transação.
  // a unique (userId, bebidaId) e as FKs garantem as regras sem consulta prévia
  async criar(userId: string, dados: CriarAvaliacao) {
    return prisma.$transaction(async (tx) => {
      const avaliacao = await seDuplicado(
        avaliacaoRepository.criar({ userId, ...colunasDaAvaliacao(dados) }, tx),
        'Você já avaliou essa bebida'
      );
      await preferenciaService.recalcularNotasMedias([dados.bebidaId], tx);
      await preferenciaService.recalcular(userId, tx);
      return avaliacao;
    });
  },

  async atualizar(id: string, userId: string, dados: AtualizarAvaliacao) {
    const avaliacao = await buscarParaAlterar(id, userId, 'editar');

    return prisma.$transaction(async (tx) => {
      const atualizada = await avaliacaoRepository.atualizar(id, colunasDaAvaliacao(dados), tx);
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

  // remove e desfaz o efeito na nota média e nas preferências do autor (RF17)
  async deletar(id: string, userId: string) {
    const avaliacao = await buscarParaAlterar(id, userId, 'deletar', { permiteAdmin: true });

    await prisma.$transaction(async (tx) => {
      await avaliacaoRepository.excluir(id, tx);
      await preferenciaService.recalcularNotasMedias([avaliacao.bebidaId], tx);
      await preferenciaService.recalcular(avaliacao.userId, tx);
    });
  },
};
