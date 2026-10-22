import { Db, prisma } from '../lib/prisma';

const DADOS_PUBLICOS = { id: true, nome: true, email: true, dataCriacao: true } as const;

export const usuarioRepository = {
  buscarPorEmail(email: string, db: Db = prisma) {
    return db.user.findUnique({ where: { email } });
  },

  // preferências nascem zeradas até o onboarding
  criar(dados: { nome: string; email: string; senhaHash: string }, db: Db = prisma) {
    return db.user.create({
      data: { nome: dados.nome, email: dados.email, senha: dados.senhaHash, preferences: { create: {} } },
      select: DADOS_PUBLICOS,
    });
  },

  buscarComPreferencias(id: string, db: Db = prisma) {
    return db.user.findUnique({
      where: { id },
      select: { ...DADOS_PUBLICOS, preferences: true },
    });
  },

  atualizarNome(id: string, nome: string, db: Db = prisma) {
    return db.user.update({ where: { id }, data: { nome }, select: { id: true, nome: true, email: true } });
  },

  excluir(id: string, db: Db = prisma) {
    return db.user.delete({ where: { id } });
  },
};
