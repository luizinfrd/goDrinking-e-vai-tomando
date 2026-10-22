import { NaoEncontradoError, seDuplicado, seInexistente } from '../errors/AppError';
import { AtualizarLocal, CriarLocal, FiltrosLocal } from '../schemas/local';
import { localRepository } from '../repositories/localRepository';

export const localService = {
  async listar(filtros: FiltrosLocal) {
    const locais = await localRepository.listar(filtros);
    return locais.map(({ bebidas, ...local }) => ({ ...local, bebidas: bebidas.map((bl) => bl.bebida) }));
  },

  async buscarPorId(id: string) {
    const local = await localRepository.buscarDetalhe(id);
    if (!local) {
      throw new NaoEncontradoError('Local não encontrado');
    }
    const { bebidas, ...dados } = local;
    return { ...dados, bebidas: bebidas.map((bl) => bl.bebida) };
  },

  async criar(dados: CriarLocal) {
    return localRepository.criar(dados);
  },

  async atualizar(id: string, dados: AtualizarLocal) {
    return seInexistente(localRepository.atualizar(id, dados), 'Local não encontrado');
  },

  async deletar(id: string) {
    await seInexistente(localRepository.excluir(id), 'Local não encontrado');
  },

  // associa uma bebida ao local (tabela bebidas_locais); FK inexistente vira 404 no errorHandler
  async associarBebida(localId: string, bebidaId: string) {
    return seDuplicado(localRepository.associarBebida(localId, bebidaId), 'Essa bebida já está associada ao local');
  },

  async desassociarBebida(localId: string, bebidaId: string) {
    await seInexistente(
      localRepository.desassociarBebida(localId, bebidaId),
      'Essa bebida não está associada ao local'
    );
  },
};
