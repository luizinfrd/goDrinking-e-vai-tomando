import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function isErroDeValidacao(msg: string): boolean {
  return msg.startsWith('[validacao]');
}

export { isErroDeValidacao };

export const avaliacaoService = {
  async criar(userId: string, dados: {
    bebidaId: string;
    nota: number;
    comentario?: string;
  }) {
    const { bebidaId, nota, comentario } = dados;

    if (nota < 1 || nota > 5) {
      throw new Error('[validacao] A nota deve ser entre 1 e 5');
    }

    const bebida = await prisma.bebida.findUnique({ where: { id: bebidaId } });
    if (!bebida) {
      throw new Error('[validacao] Bebida não encontrada');
    }

    const avaliacaoExistente = await prisma.avaliacao.findFirst({
      where: { userId, bebidaId },
    });
    if (avaliacaoExistente) {
      throw new Error('[validacao] Você já avaliou essa bebida');
    }

    const preferencias = await prisma.userPreference.findUnique({
      where: { userId },
    });
    if (!preferencias) {
      throw new Error('[validacao] Preferências do usuário não encontradas');
    }

    const totalAvaliacoes = await prisma.avaliacao.count({ where: { userId } });

    // calcula os novos scores de preferência usando média ponderada
    const fator = nota / 5; // normaliza a nota para 0-1
    const novosPesos = {
      pesoDoce:      (preferencias.pesoDoce      * totalAvaliacoes + bebida.atributoDoce      * fator) / (totalAvaliacoes + 1),
      pesoSeco:      (preferencias.pesoSeco      * totalAvaliacoes + bebida.atributoSeco      * fator) / (totalAvaliacoes + 1),
      pesoCitrico:   (preferencias.pesoCitrico   * totalAvaliacoes + bebida.atributoCitrico   * fator) / (totalAvaliacoes + 1),
      pesoEncorpado: (preferencias.pesoEncorpado * totalAvaliacoes + bebida.atributoEncorpado * fator) / (totalAvaliacoes + 1),
    };

    const totalAvaliacoesBebida = await prisma.avaliacao.count({ where: { bebidaId } });

    // calcula a nova nota média da bebida
    const novaNotaMedia = (bebida.notaMedia * totalAvaliacoesBebida + nota) / (totalAvaliacoesBebida + 1);

    const avaliacao = await prisma.$transaction(async (tx) => {
      // 1. cria a avaliação
      const novaAvaliacao = await tx.avaliacao.create({
        data: { userId, bebidaId, nota, comentario },
      });

      // 2. atualiza a nota média da bebida
      await tx.bebida.update({
        where: { id: bebidaId },
        data: { notaMedia: novaNotaMedia },
      });

      // 3. atualiza o vetor de preferências do usuário
      await tx.userPreference.update({
        where: { userId },
        data: novosPesos,
      });

      return novaAvaliacao;
    });

    return avaliacao;
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
        bebida: { select: { id: true, nome: true, tipo: true } },
      },
      orderBy: { data: 'desc' },
    });
  },

  async deletar(id: string, userId: string) {
    const avaliacao = await prisma.avaliacao.findUnique({ where: { id } });

    if (!avaliacao) {
      throw new Error('[validacao] Avaliação não encontrada');
    }

    if (avaliacao.userId !== userId) {
      throw new Error('[validacao] Você não tem permissão para deletar essa avaliação');
    }

    await prisma.avaliacao.delete({ where: { id } });
  },
};