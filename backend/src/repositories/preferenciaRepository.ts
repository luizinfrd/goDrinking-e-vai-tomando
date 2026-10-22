import { Db, prisma } from '../lib/prisma';
import { VetorSabor } from '../domain/sabor';

export const preferenciaRepository = {
  buscar(userId: string, db: Db = prisma) {
    return db.userPreference.findUnique({ where: { userId } });
  },

  atualizarPesos(userId: string, vetor: VetorSabor, db: Db = prisma) {
    return db.userPreference.update({
      where: { userId },
      data: { pesoDoce: vetor.doce, pesoSeco: vetor.seco, pesoCitrico: vetor.citrico, pesoEncorpado: vetor.encorpado },
    });
  },

  // vetores de todos os outros usuários com algum paladar conhecido (componente colaborativo)
  listarVetoresExceto(userId: string, db: Db = prisma) {
    return db.userPreference.findMany({
      where: {
        userId: { not: userId },
        OR: [{ onboardingConcluido: true }, { user: { avaliacoes: { some: {} } } }],
      },
      select: { userId: true, pesoDoce: true, pesoSeco: true, pesoCitrico: true, pesoEncorpado: true },
    });
  },

  listarTodas(db: Db = prisma) {
    return db.userPreference.findMany();
  },

  salvarBase(userId: string, vetor: VetorSabor, db: Db = prisma) {
    const base = {
      baseDoce: vetor.doce,
      baseSeco: vetor.seco,
      baseCitrico: vetor.citrico,
      baseEncorpado: vetor.encorpado,
      onboardingConcluido: true,
    };
    return db.userPreference.upsert({ where: { userId }, create: { userId, ...base }, update: base });
  },
};
