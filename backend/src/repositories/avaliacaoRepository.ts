import { Prisma } from '@prisma/client';
import { Db, prisma } from '../lib/prisma';

const COM_AUTOR = { user: { select: { id: true, nome: true } } } as const;

export const avaliacaoRepository = {
  buscarPorId(id: string, db: Db = prisma) {
    return db.avaliacao.findUnique({ where: { id } });
  },

  criar(dados: Prisma.AvaliacaoUncheckedCreateInput, db: Db = prisma) {
    return db.avaliacao.create({ data: dados, include: COM_AUTOR });
  },

  atualizar(id: string, dados: Prisma.AvaliacaoUncheckedUpdateInput, db: Db = prisma) {
    return db.avaliacao.update({ where: { id }, data: dados, include: COM_AUTOR });
  },

  excluir(id: string, db: Db = prisma) {
    return db.avaliacao.delete({ where: { id } });
  },

  listarPorBebida(bebidaId: string, db: Db = prisma) {
    return db.avaliacao.findMany({ where: { bebidaId }, include: COM_AUTOR, orderBy: { data: 'desc' } });
  },

  listarPorUsuario(userId: string, filtros: { bebidaId?: string } = {}, db: Db = prisma) {
    return db.avaliacao.findMany({
      where: { userId, ...(filtros.bebidaId && { bebidaId: filtros.bebidaId }) },
      include: { bebida: { select: { id: true, nome: true, tipo: true, imagemUrl: true, notaMedia: true } } },
      orderBy: { data: 'desc' },
    });
  },

  // o que o recálculo do vetor de preferências precisa de cada avaliação
  listarParaVetor(userId: string, db: Db = prisma) {
    return db.avaliacao.findMany({
      where: { userId },
      select: {
        nota: true,
        bebida: {
          select: { atributoDoce: true, atributoSeco: true, atributoCitrico: true, atributoEncorpado: true },
        },
      },
    });
  },

  async idsDeBebidasAvaliadas(userId: string, db: Db = prisma) {
    const avaliacoes = await db.avaliacao.findMany({ where: { userId }, select: { bebidaId: true } });
    return avaliacoes.map((a) => a.bebidaId);
  },

  async idsDosAutores(bebidaId: string, db: Db = prisma) {
    const avaliacoes = await db.avaliacao.findMany({ where: { bebidaId }, select: { userId: true } });
    return avaliacoes.map((a) => a.userId);
  },

  // média das notas por bebida, numa query só
  async mediasDasNotas(bebidaIds: string[], db: Db = prisma) {
    const grupos = await db.avaliacao.groupBy({
      by: ['bebidaId'],
      where: { bebidaId: { in: bebidaIds } },
      _avg: { nota: true },
    });
    return new Map(grupos.map((g) => [g.bebidaId, g._avg.nota ?? 0]));
  },

  estatisticasDoUsuario(userId: string, db: Db = prisma) {
    return db.avaliacao.aggregate({ where: { userId }, _count: { _all: true }, _avg: { nota: true } });
  },
};
