import { Bebida } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NaoEncontradoError, ProibidoError, ValidacaoError } from '../errors/AppError';
import { assertividade, MINIMO_RESPOSTAS_PERCEPCAO, Percepcao, pesoDaPercepcao } from '../domain/recomendacao';
import { vetorDaBebida } from '../domain/sabor';
import { AtualizarBebida, CriarBebida, FiltrosBebida } from '../schemas/bebida';
import { avaliacaoRepository } from '../repositories/avaliacaoRepository';
import { bebidaRepository } from '../repositories/bebidaRepository';
import { usuarioRepository } from '../repositories/usuarioRepository';
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

// o catálogo é mantido pelos admins; bebidas sugeridas pela comunidade também podem ser mantidas pelo autor
async function garantirPermissaoDeEdicao(bebida: Bebida, userId: string) {
  const ehAutor = bebida.criadoUser && bebida.criadoPorId === userId;
  if (!ehAutor && !(await usuarioRepository.ehAdmin(userId))) {
    throw new ProibidoError('Só o autor da sugestão ou um administrador pode alterar esta bebida');
  }
}

// resumo da percepção dos usuários × atributos declarados (B1)
function resumoDaPercepcao(bebida: Bebida, percepcao?: Percepcao) {
  const total = percepcao?.total ?? 0;
  const suficiente = total >= MINIMO_RESPOSTAS_PERCEPCAO;
  return {
    total,
    media: percepcao && total > 0 ? percepcao.media : null,
    assertividade: percepcao && suficiente ? assertividade(vetorDaBebida(bebida), percepcao.media) : null,
    pesoNoAlgoritmo: Math.round(pesoDaPercepcao(total) * 100) / 100,
  };
}

async function buscarExistente(id: string) {
  const bebida = await bebidaRepository.buscarPorId(id);
  if (!bebida) {
    throw new NaoEncontradoError('Bebida não encontrada');
  }
  return bebida;
}

export const bebidaService = {
  async listar(filtros: FiltrosBebida) {
    const [bebidas, percepcoes] = await Promise.all([
      bebidaRepository.listar(filtros),
      avaliacaoRepository.percepcoesPorBebida(),
    ]);
    return bebidas.map((b) => {
      const { total, assertividade } = resumoDaPercepcao(b, percepcoes.get(b.id));
      return { ...b, percepcao: { total, assertividade } };
    });
  },

  async buscarPorId(id: string) {
    const [bebida, percepcao] = await Promise.all([
      bebidaRepository.buscarDetalhe(id),
      avaliacaoRepository.percepcaoDaBebida(id),
    ]);
    if (!bebida) {
      throw new NaoEncontradoError('Bebida não encontrada');
    }
    return { ...bebida, percepcao: resumoDaPercepcao(bebida, percepcao) };
  },

  // sugestão de usuário comum fica marcada como da comunidade
  async criar(dados: CriarBebida, autorId: string) {
    const admin = await usuarioRepository.ehAdmin(autorId);
    return bebidaRepository.criar({ ...dados, criadoUser: !admin, criadoPor: { connect: { id: autorId } } });
  },

  async atualizar(id: string, dados: AtualizarBebida, userId: string) {
    const bebida = await buscarExistente(id);
    await garantirPermissaoDeEdicao(bebida, userId);
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

  async deletar(id: string, userId: string) {
    const bebida = await buscarExistente(id);
    await garantirPermissaoDeEdicao(bebida, userId);

    await prisma.$transaction(async (tx) => {
      const autores = await avaliacaoRepository.idsDosAutores(id, tx);
      await bebidaRepository.excluir(id, tx);
      // as avaliações caem em cascade; o vetor de quem avaliou precisa esquecer a bebida
      await preferenciaService.recalcularVarios(autores, tx);
    });
  },
};
