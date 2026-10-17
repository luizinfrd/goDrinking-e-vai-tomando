import { prisma } from '../lib/prisma';
import { erros } from '../utils/erros';
import { preferenciaService } from './preferenciaService';

export { isErroDeValidacao } from '../utils/erros';

const COMENTARIO_MAX = 500;

function validarNota(nota: number) {
  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    throw erros.validacao('A nota deve ser um número inteiro entre 1 e 5');
  }
}

function normalizarComentario(comentario: unknown): string | null {
  if (comentario === undefined || comentario === null) return null;
  const texto = String(comentario).trim();
  if (texto.length > COMENTARIO_MAX) {
    throw erros.validacao(`O comentário deve ter no máximo ${COMENTARIO_MAX} caracteres`);
  }
  return texto || null;
}

export const avaliacaoService = {
  async criar(userId: string, dados: {
    bebidaId: string;
    nota: number;
    comentario?: string;
  }) {
    const { bebidaId, nota } = dados;
    validarNota(nota);
    const comentario = normalizarComentario(dados.comentario);

    const bebida = await prisma.bebida.findUnique({ where: { id: bebidaId } });
    if (!bebida) {
      throw erros.naoEncontrado('Bebida não encontrada');
    }

    const avaliacaoExistente = await prisma.avaliacao.findUnique({
      where: { userId_bebidaId: { userId, bebidaId } },
    });
    if (avaliacaoExistente) {
      throw erros.conflito('Você já avaliou essa bebida');
    }

    // cria a avaliação e recalcula nota média + vetor de preferências na mesma transação
    return prisma.$transaction(async (tx) => {
      const novaAvaliacao = await tx.avaliacao.create({
        data: { userId, bebidaId, nota, comentario },
        include: { user: { select: { id: true, nome: true } } },
      });
      await preferenciaService.recalcularNotaMedia(bebidaId, tx);
      await preferenciaService.recalcular(userId, tx);
      return novaAvaliacao;
    });
  },

  async atualizar(id: string, userId: string, dados: { nota?: number; comentario?: string }) {
    const avaliacao = await prisma.avaliacao.findUnique({ where: { id } });

    if (!avaliacao) {
      throw erros.naoEncontrado('Avaliação não encontrada');
    }
    if (avaliacao.userId !== userId) {
      throw erros.proibido('Você não tem permissão para editar essa avaliação');
    }
    if (dados.nota !== undefined) validarNota(dados.nota);

    return prisma.$transaction(async (tx) => {
      const atualizada = await tx.avaliacao.update({
        where: { id },
        data: {
          ...(dados.nota !== undefined && { nota: dados.nota }),
          ...(dados.comentario !== undefined && { comentario: normalizarComentario(dados.comentario) }),
        },
        include: { user: { select: { id: true, nome: true } } },
      });
      await preferenciaService.recalcularNotaMedia(avaliacao.bebidaId, tx);
      await preferenciaService.recalcular(userId, tx);
      return atualizada;
    });
  },

  async listarPorBebida(bebidaId: string) {
    return prisma.avaliacao.findMany({
      where: { bebidaId },
      include: {
        user: { select: { id: true, nome: true } },
      },
      orderBy: { data: 'desc' },
    });
  },

  async listarPorUsuario(userId: string) {
    return prisma.avaliacao.findMany({
      where: { userId },
      include: {
        bebida: { select: { id: true, nome: true, tipo: true, imagemUrl: true, notaMedia: true } },
      },
      orderBy: { data: 'desc' },
    });
  },

  async deletar(id: string, userId: string) {
    const avaliacao = await prisma.avaliacao.findUnique({ where: { id } });

    if (!avaliacao) {
      throw erros.naoEncontrado('Avaliação não encontrada');
    }

    if (avaliacao.userId !== userId) {
      throw erros.proibido('Você não tem permissão para deletar essa avaliação');
    }

    // remove e desfaz o efeito na nota média e nas preferências (RF17)
    await prisma.$transaction(async (tx) => {
      await tx.avaliacao.delete({ where: { id } });
      await preferenciaService.recalcularNotaMedia(avaliacao.bebidaId, tx);
      await preferenciaService.recalcular(userId, tx);
    });
  },
};
