// lista "quero provar" (B3)
import { favoritoRepository } from '../repositories/favoritoRepository';

export const favoritoService = {
  async listar(userId: string) {
    const favoritos = await favoritoRepository.listar(userId);
    return favoritos.map((f) => ({ ...f.bebida, favoritadoEm: f.criadoEm }));
  },

  // bebida inexistente vira 404 pela FK no errorHandler
  async adicionar(userId: string, bebidaId: string) {
    const favorito = await favoritoRepository.adicionar(userId, bebidaId);
    return { ...favorito.bebida, favoritadoEm: favorito.criadoEm };
  },

  async remover(userId: string, bebidaId: string) {
    await favoritoRepository.remover(userId, bebidaId);
  },
};
