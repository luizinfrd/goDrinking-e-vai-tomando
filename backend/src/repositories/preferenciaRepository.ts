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
