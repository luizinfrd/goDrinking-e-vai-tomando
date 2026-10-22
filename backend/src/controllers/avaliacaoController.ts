import { Response } from 'express';
import { AuthRequest, usuarioLogado } from '../middlewares/authMiddleware';
import { atualizarAvaliacaoSchema, criarAvaliacaoSchema, minhasAvaliacoesSchema } from '../schemas/avaliacao';
import { paramsComId } from '../schemas/comum';
import { avaliacaoService } from '../services/avaliacaoService';

export const avaliacaoController = {
  async criar(req: AuthRequest, res: Response) {
    const dados = criarAvaliacaoSchema.parse(req.body ?? {});
    res.status(201).json(await avaliacaoService.criar(usuarioLogado(req), dados));
  },

  async atualizar(req: AuthRequest, res: Response) {
    const { id } = paramsComId.parse(req.params);
    const dados = atualizarAvaliacaoSchema.parse(req.body ?? {});
    res.status(200).json(await avaliacaoService.atualizar(id, usuarioLogado(req), dados));
  },

  async listarPorBebida(req: AuthRequest, res: Response) {
    const { id } = paramsComId.parse(req.params);
    res.status(200).json(await avaliacaoService.listarPorBebida(id));
  },

  async listarPorUsuario(req: AuthRequest, res: Response) {
    const filtros = minhasAvaliacoesSchema.parse(req.query);
    res.status(200).json(await avaliacaoService.listarPorUsuario(usuarioLogado(req), filtros));
  },

  async deletar(req: AuthRequest, res: Response) {
    const { id } = paramsComId.parse(req.params);
    await avaliacaoService.deletar(id, usuarioLogado(req));
    res.status(204).send();
  },
};
