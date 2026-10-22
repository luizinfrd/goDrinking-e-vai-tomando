import { Prisma } from '@prisma/client';
import { Db, prisma } from '../lib/prisma';

const COM_AUTOR = {
  user: { select: { id: true, nome: true } },
  local: { select: { id: true, nome: true } },
} as const;

const COLUNAS_PERCEBIDAS = {
  percebidoDoce: true,
  percebidoSeco: true,
  percebidoCitrico: true,
  percebidoEncorpado: true,
} as const;

// só entram na média as avaliações que informaram a percepção (as quatro colunas andam juntas)
const COM_PERCEPCAO = { percebidoDoce: { not: null } } as const;

type MediasPercebidas = {
  _avg: { percebidoDoce: number | null; percebidoSeco: number | null; percebidoCitrico: number | null; percebidoEncorpado: number | null };
  _count: { _all: number };
};

function paraPercepcao({ _avg, _count }: MediasPercebidas) {
  return {
    total: _count._all,
    media: {
      doce: _avg.percebidoDoce ?? 0,
      seco: _avg.percebidoSeco ?? 0,
      citrico: _avg.percebidoCitrico ?? 0,
      encorpado: _avg.percebidoEncorpado ?? 0,
    },
  };
}

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
      include: {
        bebida: { select: { id: true, nome: true, tipo: true, imagemUrl: true, notaMedia: true, tipoVinho: true, baseAlcoolica: true } },
        local: { select: { id: true, nome: true } },
      },
      orderBy: { data: 'desc' },
    });
  },

  // o que o recálculo do vetor de preferências precisa de cada avaliação
  listarParaVetor(userId: string, db: Db = prisma) {
    return db.avaliacao.findMany({
      where: { userId },
      select: {
        nota: true,
        ...COLUNAS_PERCEBIDAS,
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

  // percepção média de uma bebida (B1)
  async percepcaoDaBebida(bebidaId: string, db: Db = prisma) {
    const resultado = await db.avaliacao.aggregate({
      where: { bebidaId, ...COM_PERCEPCAO },
      _avg: COLUNAS_PERCEBIDAS,
      _count: { _all: true },
    });
    return paraPercepcao(resultado);
  },

  // percepção média de várias bebidas numa query só
  async percepcoesPorBebida(bebidaIds?: string[], db: Db = prisma) {
    const grupos = await db.avaliacao.groupBy({
      by: ['bebidaId'],
      where: { ...COM_PERCEPCAO, ...(bebidaIds && { bebidaId: { in: bebidaIds } }) },
      _avg: COLUNAS_PERCEBIDAS,
      _count: { _all: true },
    });
    return new Map(grupos.map((g) => [g.bebidaId, paraPercepcao(g)]));
  },

  notasDosUsuarios(userIds: string[], db: Db = prisma) {
    return db.avaliacao.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, bebidaId: true, nota: true },
    });
  },

  listarParaConquistas(userId: string, db: Db = prisma) {
    return db.avaliacao.findMany({
      where: { userId },
      select: {
        localId: true,
        bebida: { select: { id: true, tipo: true, tipoVinho: true, paisOrigem: true, atributoCitrico: true } },
      },
    });
  },

  listarTodasParaMetricas(db: Db = prisma) {
    return db.avaliacao.findMany({ select: { userId: true, bebidaId: true, nota: true, ...COLUNAS_PERCEBIDAS } });
  },

  estatisticasDoUsuario(userId: string, db: Db = prisma) {
    return db.avaliacao.aggregate({ where: { userId }, _count: { _all: true }, _avg: { nota: true } });
  },
};
