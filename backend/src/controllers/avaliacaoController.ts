import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { avaliacaoService } from '../services/avaliacaoService';
import { responderErro } from '../utils/erros';

export const avaliacaoController = {
  async criar(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { bebidaId, nota, comentario } = req.body ?? {};

      if (!bebidaId || nota === undefined || nota === null) {
        res.status(400).json({ error: 'bebidaId e nota são obrigatórios' });
        return;
      }

      const avaliacao = await avaliacaoService.criar(userId, {
        bebidaId,
        nota: Number(nota),
        comentario,
      });

      res.status(201).json(avaliacao);
    } catch (error) {
      responderErro(res, error);
    }
  },

  async atualizar(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      const { nota, comentario } = req.body ?? {};

      const avaliacao = await avaliacaoService.atualizar(id, userId, {
        ...(nota !== undefined && { nota: Number(nota) }),
        ...(comentario !== undefined && { comentario }),
      });

      res.status(200).json(avaliacao);
    } catch (error) {
      responderErro(res, error);
    }
  },

  async listarPorBebida(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const avaliacoes = await avaliacaoService.listarPorBebida(id);
      res.status(200).json(avaliacoes);
    } catch (error) {
      responderErro(res, error);
    }
  },

  async listarPorUsuario(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const avaliacoes = await avaliacaoService.listarPorUsuario(userId);
      res.status(200).json(avaliacoes);
    } catch (error) {
      responderErro(res, error);
    }
  },

  async deletar(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;

      await avaliacaoService.deletar(id, userId);
      res.status(204).send();
    } catch (error) {
      responderErro(res, error);
    }
  },
};
