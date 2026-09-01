import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { avaliacaoService, isErroDeValidacao } from '../services/avaliacaoService';

export const avaliacaoController = {
  async criar(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { bebidaId, nota, comentario } = req.body;

      if (!bebidaId || !nota) {
        res.status(400).json({ error: 'bebidaId e nota são obrigatórios' });
        return;
      }

      const avaliacao = await avaliacaoService.criar(userId, {
        bebidaId,
        nota: Number(nota),
        comentario,
      });

      res.status(201).json(avaliacao);
    } catch (error: any) {
      if (isErroDeValidacao(error.message)) {
        res.status(400).json({ error: error.message.replace('[validacao] ', '') });
        return;
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async listarPorBebida(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const avaliacoes = await avaliacaoService.listarPorBebida(id);
      res.status(200).json(avaliacoes);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async listarPorUsuario(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const avaliacoes = await avaliacaoService.listarPorUsuario(userId);
      res.status(200).json(avaliacoes);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async deletar(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;

      await avaliacaoService.deletar(id, userId);
      res.status(204).send();
    } catch (error: any) {
      if (isErroDeValidacao(error.message)) {
        res.status(400).json({ error: error.message.replace('[validacao] ', '') });
        return;
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },
};