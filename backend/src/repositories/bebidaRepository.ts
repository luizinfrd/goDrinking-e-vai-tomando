import { Prisma } from '@prisma/client';
import { Db, prisma } from '../lib/prisma';
import { FiltrosBebida } from '../schemas/bebida';

export const bebidaRepository = {
  listar(filtros: FiltrosBebida, db: Db = prisma) {
    return db.bebida.findMany({
      where: {
        ...(filtros.tipo && { tipo: { equals: filtros.tipo, mode: 'insensitive' } }),
        // busca parcial: "negr" encontra "Negroni"
        ...(filtros.nome && { nome: { contains: filtros.nome, mode: 'insensitive' } }),
      },
      include: { _count: { select: { avaliacoes: true } } },
      orderBy: [{ notaMedia: 'desc' }, { nome: 'asc' }],
    });
  },

  buscarDetalhe(id: string, db: Db = prisma) {
    return db.bebida.findUnique({
      where: { id },
      include: {
        avaliacoes: {
          orderBy: { data: 'desc' },
          take: 10,
          include: { user: { select: { id: true, nome: true } } },
        },
        locais: { include: { local: true }, orderBy: { local: { nome: 'asc' } } },
        _count: { select: { avaliacoes: true } },
      },
    });
  },

  buscarPorId(id: string, db: Db = prisma) {
    return db.bebida.findUnique({ where: { id } });
  },

  async existe(id: string, db: Db = prisma) {
    return (await db.bebida.count({ where: { id } })) > 0;
  },

  criar(dados: Prisma.BebidaCreateInput, db: Db = prisma) {
    return db.bebida.create({ data: dados });
  },

  atualizar(id: string, dados: Prisma.BebidaUpdateInput, db: Db = prisma) {
    return db.bebida.update({ where: { id }, data: dados });
  },

  excluir(id: string, db: Db = prisma) {
    return db.bebida.delete({ where: { id } });
  },

  atualizarNotaMedia(id: string, notaMedia: number, db: Db = prisma) {
    return db.bebida.update({ where: { id }, data: { notaMedia } });
  },

  // candidatas à recomendação: o que o usuário ainda não avaliou, com até 3 locais (cruzamento de dados)
  candidatasParaRecomendacao(filtros: { excluirIds: string[]; tipo?: string }, db: Db = prisma) {
    return db.bebida.findMany({
      where: {
        id: { notIn: filtros.excluirIds },
        ...(filtros.tipo && { tipo: filtros.tipo }),
      },
      include: {
        locais: {
          take: 3,
          orderBy: { local: { nome: 'asc' } },
          include: { local: { select: { id: true, nome: true, endereco: true, tipo: true } } },
        },
      },
    });
  },

  contagemPorTipoAvaliadaPor(userId: string, db: Db = prisma) {
    return db.bebida.groupBy({
      by: ['tipo'],
      where: { avaliacoes: { some: { userId } } },
      _count: { _all: true },
    });
  },
};
