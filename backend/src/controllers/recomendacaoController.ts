import { Response } from 'express';
import { AuthRequest, usuarioLogado } from '../middlewares/authMiddleware';
import { recomendarLocaisSchema, recomendarSchema } from '../schemas/recomendacao';
import { recomendacaoService } from '../services/recomendacaoService';

// o cold start responde 409 com code ONBOARDING_PENDENTE, que o front usa para mandar ao onboarding
export const recomendacaoController = {
  async recomendar(req: AuthRequest, res: Response) {
    const filtros = recomendarSchema.parse(req.query);
    res.status(200).json(await recomendacaoService.recomendar(usuarioLogado(req), filtros));
  },

  async recomendarLocais(req: AuthRequest, res: Response) {
    const filtros = recomendarLocaisSchema.parse(req.query);
    res.status(200).json(await recomendacaoService.recomendarLocais(usuarioLogado(req), filtros));
  },
};
