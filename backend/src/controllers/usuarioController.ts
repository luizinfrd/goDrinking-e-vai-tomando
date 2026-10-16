import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { usuarioService } from '../services/usuarioService';
import { responderErro } from '../utils/erros';
import { atributoValido } from '../utils/validacao';

export const usuarioController = {
  async me(req: AuthRequest, res: Response) {
    try {
      const perfil = await usuarioService.buscarPerfil(req.user!.id);
      res.status(200).json(perfil);
    } catch (error) {
      responderErro(res, error);
    }
  },

  async atualizar(req: AuthRequest, res: Response) {
    try {
      const nome = String(req.body?.nome ?? '').trim();
      if (!nome) {
        res.status(400).json({ error: 'Nome é obrigatório' });
        return;
      }
      const user = await usuarioService.atualizarPerfil(req.user!.id, nome);
      res.status(200).json(user);
    } catch (error) {
      responderErro(res, error);
    }
  },

  async salvarPreferencias(req: AuthRequest, res: Response) {
    try {
      const { doce, seco, citrico, encorpado } = req.body ?? {};
      const vetor = { doce, seco, citrico, encorpado };

      for (const [chave, valor] of Object.entries(vetor)) {
        if (!atributoValido(valor)) {
          res.status(400).json({ error: `${chave} deve ser um número entre 0 e 1` });
          return;
        }
      }

      const perfil = await usuarioService.salvarPreferencias(req.user!.id, vetor);
      res.status(200).json(perfil);
    } catch (error) {
      responderErro(res, error);
    }
  },

  async excluir(req: AuthRequest, res: Response) {
    try {
      await usuarioService.excluirConta(req.user!.id);
      res.status(204).send();
    } catch (error) {
      responderErro(res, error);
    }
  },
};
