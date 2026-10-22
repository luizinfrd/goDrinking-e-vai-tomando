import { Response } from 'express';
import { AuthRequest, usuarioLogado } from '../middlewares/authMiddleware';
import { paramsFavorito } from '../schemas/favorito';
import { favoritoService } from '../services/favoritoService';

export const favoritoController = {
  async listar(req: AuthRequest, res: Response) {
    res.status(200).json(await favoritoService.listar(usuarioLogado(req)));
  },

  async adicionar(req: AuthRequest, res: Response) {
    const { bebidaId } = paramsFavorito.parse(req.params);
    res.status(201).json(await favoritoService.adicionar(usuarioLogado(req), bebidaId));
  },

  async remover(req: AuthRequest, res: Response) {
    const { bebidaId } = paramsFavorito.parse(req.params);
    await favoritoService.remover(usuarioLogado(req), bebidaId);
    res.status(204).send();
  },
};
