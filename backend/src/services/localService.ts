import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { erros } from '../utils/erros';

export type DadosLocal = {
  nome?: string;
  tipo?: string | null;
  endereco?: string | null;
  descricao?: string | null;
  imagemUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const SELECAO_BEBIDA = {
  id: true, nome: true, tipo: true, notaMedia: true, imagemUrl: true,
  tipoVinho: true, baseAlcoolica: true,
} as const;

async function garantirLocal(id: string) {
  const local = await prisma.local.findUnique({ where: { id } });
  if (!local) {
    throw erros.naoEncontrado('Local não encontrado');
  }
  return local;
}

export const localService = {
  async listar(tipo?: string, nome?: string) {
    const locais = await prisma.local.findMany({
      where: {
        ...(tipo && { tipo: { equals: tipo, mode: 'insensitive' } }),
        ...(nome && { nome: { contains: nome, mode: 'insensitive' } }),
      },
      // inclui as bebidas para o popup do mapa
      include: {
        bebidas: { include: { bebida: { select: SELECAO_BEBIDA } } },
      },
      orderBy: { nome: 'asc' },
    });

    return locais.map(({ bebidas, ...local }) => ({
      ...local,
      bebidas: bebidas.map((bl) => bl.bebida),
    }));
  },

  async buscarPorId(id: string) {
    const local = await prisma.local.findUnique({
      where: { id },
      include: {
        bebidas: {
          include: { bebida: { select: { ...SELECAO_BEBIDA, descricao: true } } },
          orderBy: { bebida: { notaMedia: 'desc' } },
        },
      },
    });

    if (!local) {
      throw erros.naoEncontrado('Local não encontrado');
    }

    const { bebidas, ...dados } = local;
    return { ...dados, bebidas: bebidas.map((bl) => bl.bebida) };
  },

  async criar(dados: DadosLocal & { nome: string }) {
    return prisma.local.create({ data: dados as Prisma.LocalCreateInput });
  },

  async atualizar(id: string, dados: DadosLocal) {
    await garantirLocal(id);
    return prisma.local.update({ where: { id }, data: dados as Prisma.LocalUpdateInput });
  },

  async deletar(id: string) {
    await garantirLocal(id);
    await prisma.local.delete({ where: { id } });
  },

  // associa uma bebida ao local (tabela bebidas_locais)
  async associarBebida(localId: string, bebidaId: string) {
    await garantirLocal(localId);

    const bebida = await prisma.bebida.findUnique({ where: { id: bebidaId } });
    if (!bebida) {
      throw erros.naoEncontrado('Bebida não encontrada');
    }

    const existente = await prisma.bebidaLocal.findUnique({
      where: { localId_bebidaId: { localId, bebidaId } },
    });
    if (existente) {
      throw erros.conflito('Essa bebida já está associada ao local');
    }

    return prisma.bebidaLocal.create({
      data: { localId, bebidaId },
      include: { bebida: { select: SELECAO_BEBIDA } },
    });
  },

  async desassociarBebida(localId: string, bebidaId: string) {
    const existente = await prisma.bebidaLocal.findUnique({
      where: { localId_bebidaId: { localId, bebidaId } },
    });
    if (!existente) {
      throw erros.naoEncontrado('Essa bebida não está associada ao local');
    }

    await prisma.bebidaLocal.delete({
      where: { localId_bebidaId: { localId, bebidaId } },
    });
  },
};
