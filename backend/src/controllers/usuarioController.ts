import { Response } from 'express';
import { AuthRequest, usuarioLogado } from '../middlewares/authMiddleware';
import { atualizarPerfilSchema, preferenciasSchema } from '../schemas/usuario';
import { usuarioService } from '../services/usuarioService';

export const usuarioController = {
  async me(req: AuthRequest, res: Response) {
    res.status(200).json(await usuarioService.buscarPerfil(usuarioLogado(req)));
  },

  async atualizar(req: AuthRequest, res: Response) {
    const { nome } = atualizarPerfilSchema.parse(req.body ?? {});
    res.status(200).json(await usuarioService.atualizarPerfil(usuarioLogado(req), nome));
  },

  async salvarPreferencias(req: AuthRequest, res: Response) {
    const vetor = preferenciasSchema.parse(req.body ?? {});
    res.status(200).json(await usuarioService.salvarPreferencias(usuarioLogado(req), vetor));
  },

  async excluir(req: AuthRequest, res: Response) {
    await usuarioService.excluirConta(usuarioLogado(req));
    res.status(204).send();
  },
};
