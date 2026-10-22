import { Bebida } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NaoEncontradoError, seInexistente, ValidacaoError } from '../errors/AppError';
import { AtualizarBebida, CriarBebida, FiltrosBebida } from '../schemas/bebida';
import { avaliacaoRepository } from '../repositories/avaliacaoRepository';
import { bebidaRepository } from '../repositories/bebidaRepository';
import { preferenciaService } from './preferenciaService';

const CAMPOS_EXCLUSIVOS = {
  drink: ['tipoVinho', 'uva', 'paisOrigem'],
  vinho: ['baseAlcoolica', 'ingredientes'],
} as const;

const ATRIBUTOS = ['atributoDoce', 'atributoSeco', 'atributoCitrico', 'atributoEncorpado'] as const;

// um vinho não recebe campos de drink e vice-versa
function validarCamposDoTipo(bebida: Bebida, dados: AtualizarBebida) {
  const proibidos = CAMPOS_EXCLUSIVOS[bebida.tipo as keyof typeof CAMPOS_EXCLUSIVOS] ?? [];
  const invalido = proibidos.find((campo) => dados[campo] !== undefined);
  if (invalido) {
    throw new ValidacaoError(`O campo ${invalido} não se aplica a ${bebida.tipo === 'vinho' ? 'vinhos' : 'drinks'}`);
  }
}

export const bebidaService = {
  async listar(filtros: FiltrosBebida) {
    return bebidaRepository.listar(filtros);
  },

  async buscarPorId(id: string) {
    const bebida = await bebidaRepository.buscarDetalhe(id);
    if (!bebida) {
      throw new NaoEncontradoError('Bebida não encontrada');
    }
    return bebida;
  },

  async criar(dados: CriarBebida) {
    return bebidaRepository.criar({ ...dados, criadoUser: true });
  },

  async atualizar(id: string, dados: AtualizarBebida) {
    const bebida = await bebidaRepository.buscarPorId(id);
    if (!bebida) {
      throw new NaoEncontradoError('Bebida não encontrada');
    }
    validarCamposDoTipo(bebida, dados);

    const { tipo: _tipo, ...campos } = dados;
    const mudouSabor = ATRIBUTOS.some((a) => campos[a] !== undefined && campos[a] !== bebida[a]);

    return prisma.$transaction(async (tx) => {
      const atualizada = await bebidaRepository.atualizar(id, campos, tx);
      // o vetor de quem avaliou depende dos atributos da bebida
      if (mudouSabor) {
        await preferenciaService.recalcularVarios(await avaliacaoRepository.idsDosAutores(id, tx), tx);
      }
      return atualizada;
    });
  },

  async deletar(id: string) {
    await prisma.$transaction(async (tx) => {
      const autores = await avaliacaoRepository.idsDosAutores(id, tx);
      await seInexistente(bebidaRepository.excluir(id, tx), 'Bebida não encontrada');
      // as avaliações caem em cascade; o vetor de quem avaliou precisa esquecer a bebida
      await preferenciaService.recalcularVarios(autores, tx);
    });
  },
};
