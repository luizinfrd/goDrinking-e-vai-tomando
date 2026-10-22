import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { atualizarBebidaSchema, criarBebidaSchema, listarBebidasSchema } from '../schemas/bebida';
import { paramsComId } from '../schemas/comum';
import { bebidaService } from '../services/bebidaService';

export const bebidaController = {
  async listar(req: AuthRequest, res: Response) {
    res.status(200).json(await bebidaService.listar(listarBebidasSchema.parse(req.query)));
  },

  async buscarPorId(req: AuthRequest, res: Response) {
    const { id } = paramsComId.parse(req.params);
    res.status(200).json(await bebidaService.buscarPorId(id));
  },

  // o schema só deixa passar campos permitidos (notaMedia, id e criadoUser são do sistema)
  async criar(req: AuthRequest, res: Response) {
    const dados = criarBebidaSchema.parse(req.body ?? {});
    res.status(201).json(await bebidaService.criar(dados));
  },

  async atualizar(req: AuthRequest, res: Response) {
    const { id } = paramsComId.parse(req.params);
    const dados = atualizarBebidaSchema.parse(req.body ?? {});
    res.status(200).json(await bebidaService.atualizar(id, dados));
  },

  async deletar(req: AuthRequest, res: Response) {
    const { id } = paramsComId.parse(req.params);
    await bebidaService.deletar(id);
    res.status(204).send();
  },
};
