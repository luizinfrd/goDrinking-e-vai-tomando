import { Db, prisma } from '../lib/prisma';
import { SELECAO_BEBIDA_RESUMO } from './localRepository';

export const favoritoRepository = {
  listar(userId: string, db: Db = prisma) {
    return db.favorito.findMany({
      where: { userId },
      include: { bebida: { select: SELECAO_BEBIDA_RESUMO } },
      orderBy: { criadoEm: 'desc' },
    });
  },

  async idsDasBebidas(userId: string, db: Db = prisma) {
    const favoritos = await db.favorito.findMany({ where: { userId }, select: { bebidaId: true } });
    return favoritos.map((f) => f.bebidaId);
  },

  // idempotente: favoritar de novo não é erro
  adicionar(userId: string, bebidaId: string, db: Db = prisma) {
    return db.favorito.upsert({
      where: { userId_bebidaId: { userId, bebidaId } },
      create: { userId, bebidaId },
      update: {},
      include: { bebida: { select: SELECAO_BEBIDA_RESUMO } },
    });
  },

  remover(userId: string, bebidaId: string, db: Db = prisma) {
    return db.favorito.deleteMany({ where: { userId, bebidaId } });
  },
};
