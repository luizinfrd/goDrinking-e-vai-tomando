import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { paramsComId } from '../schemas/comum';
import {
  associarBebidaSchema,
  atualizarLocalSchema,
  criarLocalSchema,
  listarLocaisSchema,
  paramsLocalBebida,
} from '../schemas/local';
import { localService } from '../services/localService';

export const localController = {
  async listar(req: AuthRequest, res: Response) {
    res.status(200).json(await localService.listar(listarLocaisSchema.parse(req.query)));
  },

  async buscarPorId(req: AuthRequest, res: Response) {
    const { id } = paramsComId.parse(req.params);
    res.status(200).json(await localService.buscarPorId(id));
  },

  async criar(req: AuthRequest, res: Response) {
    res.status(201).json(await localService.criar(criarLocalSchema.parse(req.body ?? {})));
  },

  async atualizar(req: AuthRequest, res: Response) {
    const { id } = paramsComId.parse(req.params);
    res.status(200).json(await localService.atualizar(id, atualizarLocalSchema.parse(req.body ?? {})));
  },

  async deletar(req: AuthRequest, res: Response) {
    const { id } = paramsComId.parse(req.params);
    await localService.deletar(id);
    res.status(204).send();
  },

  async associarBebida(req: AuthRequest, res: Response) {
    const { id } = paramsComId.parse(req.params);
    const { bebidaId } = associarBebidaSchema.parse(req.body ?? {});
    res.status(201).json(await localService.associarBebida(id, bebidaId));
  },

  async desassociarBebida(req: AuthRequest, res: Response) {
    const { id, bebidaId } = paramsLocalBebida.parse(req.params);
    await localService.desassociarBebida(id, bebidaId);
    res.status(204).send();
  },
};
