import { Prisma } from '@prisma/client';
import { Db, prisma } from '../lib/prisma';
import { FiltrosLocal } from '../schemas/local';

export const SELECAO_BEBIDA_RESUMO = {
  id: true, nome: true, tipo: true, notaMedia: true, imagemUrl: true,
  tipoVinho: true, baseAlcoolica: true,
} as const;

export const localRepository = {
  listar(filtros: FiltrosLocal, db: Db = prisma) {
    return db.local.findMany({
      where: {
        ...(filtros.tipo && { tipo: { equals: filtros.tipo, mode: 'insensitive' } }),
        ...(filtros.nome && { nome: { contains: filtros.nome, mode: 'insensitive' } }),
        ...(filtros.faixaPrecoMax && { faixaPreco: { lte: filtros.faixaPrecoMax } }),
      },
      // inclui as bebidas para o popup do mapa
      include: { bebidas: { include: { bebida: { select: SELECAO_BEBIDA_RESUMO } } } },
      orderBy: { nome: 'asc' },
    });
  },

  buscarDetalhe(id: string, db: Db = prisma) {
    return db.local.findUnique({
      where: { id },
      include: {
        bebidas: {
          include: { bebida: { select: { ...SELECAO_BEBIDA_RESUMO, descricao: true } } },
          orderBy: { bebida: { notaMedia: 'desc' } },
        },
      },
    });
  },

  criar(dados: Prisma.LocalCreateInput, db: Db = prisma) {
    return db.local.create({ data: dados });
  },

  atualizar(id: string, dados: Prisma.LocalUpdateInput, db: Db = prisma) {
    return db.local.update({ where: { id }, data: dados });
  },

  excluir(id: string, db: Db = prisma) {
    return db.local.delete({ where: { id } });
  },

  associarBebida(localId: string, bebidaId: string, db: Db = prisma) {
    return db.bebidaLocal.create({
      data: { localId, bebidaId },
      include: { bebida: { select: SELECAO_BEBIDA_RESUMO } },
    });
  },

  desassociarBebida(localId: string, bebidaId: string, db: Db = prisma) {
    return db.bebidaLocal.delete({ where: { localId_bebidaId: { localId, bebidaId } } });
  },

  // locais que oferecem pelo menos uma das bebidas, trazendo só essas bebidas
  comAlgumaDasBebidas(bebidaIds: string[], filtros: { faixaPrecoMax?: number } = {}, db: Db = prisma) {
    return db.local.findMany({
      where: {
        bebidas: { some: { bebidaId: { in: bebidaIds } } },
        ...(filtros.faixaPrecoMax && { faixaPreco: { lte: filtros.faixaPrecoMax } }),
      },
      include: {
        bebidas: {
          where: { bebidaId: { in: bebidaIds } },
          include: { bebida: { select: { id: true, nome: true, tipo: true } } },
        },
      },
    });
  },
};
