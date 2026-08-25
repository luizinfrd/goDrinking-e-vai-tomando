import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { bebidaService, isErroDeValidacao } from '../services/bebidaService';

export const bebidaController = {
    async listar(req: AuthRequest, res: Response) {
        try {
            const { tipo, nome } = req.query as { tipo?: string; nome?: string };
            const bebidas = await bebidaService.listar(tipo, nome);
            res.status(200).json(bebidas);
        } catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async buscarPorId(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id as string;
            const bebida = await bebidaService.buscarPorId(id);
            res.status(200).json(bebida);
        } catch (error: any) {
            if (isErroDeValidacao(error.message)) {
                res.status(404).json({ error: 'Bebida não encontrada' });
                return;
            }
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async criar(req: AuthRequest, res: Response) {
    try {
      const { nome, tipo } = req.body;

      if (!nome || !tipo) {
        res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
        return;
      }

      const bebida = await bebidaService.criar({
        ...req.body,
        criadoUser: true,
      });

      res.status(201).json(bebida);
    } catch (error: any) {
      if (isErroDeValidacao(error.message)) {
        res.status(400).json({ error: error.message.replace('[validacao] ', '') });
        return;
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async atualizar(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const bebida = await bebidaService.atualizar(id, req.body);
      res.status(200).json(bebida);
    } catch (error: any) {
      if (isErroDeValidacao(error.message)) {
        res.status(404).json({ error: 'Bebida não encontrada' });
        return;
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async deletar(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      await bebidaService.deletar(id);
      res.status(204).send();
    } catch (error: any) {
      if (isErroDeValidacao(error.message)) {
        res.status(404).json({ error: 'Bebida não encontrada' });
        return;
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },
};