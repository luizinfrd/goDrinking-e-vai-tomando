import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { recomendacaoService } from '../services/recomendacaoService';

export const recomendacaoController = {
  async recomendar(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { tipo, limite } = req.query as { tipo?: string; limite?: string };

      const recomendacoes = await recomendacaoService.recomendar(
        userId,
        tipo,
        limite ? Number(limite) : 10
      );

      res.status(200).json(recomendacoes);
    } catch (error: any) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async recomendarLocais(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { limite } = req.query as { limite?: string };

      const locais = await recomendacaoService.recomendarLocais(
        userId,
        limite ? Number(limite) : 5
      );

      res.status(200).json(locais);
    } catch (error: any) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },
};