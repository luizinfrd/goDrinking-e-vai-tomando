import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { DadosLocal, localService } from '../services/localService';
import { responderErro } from '../utils/erros';
import { selecionarCampos } from '../utils/validacao';

const CAMPOS_LOCAL = ['nome', 'tipo', 'endereco', 'descricao', 'imagemUrl', 'latitude', 'longitude'] as const;

// retorna a mensagem de erro ou null se as coordenadas estiverem ok
function validarCoordenadas(dados: DadosLocal): string | null {
  const { latitude, longitude } = dados;
  if (latitude !== undefined && latitude !== null) {
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      return 'latitude deve ser um número entre -90 e 90';
    }
  }
  if (longitude !== undefined && longitude !== null) {
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      return 'longitude deve ser um número entre -180 e 180';
    }
  }
  return null;
}

export const localController = {
  async listar(req: AuthRequest, res: Response) {
    try {
      const { tipo, nome } = req.query as { tipo?: string; nome?: string };
      const locais = await localService.listar(tipo, nome);
      res.status(200).json(locais);
    } catch (error) {
      responderErro(res, error);
    }
  },

  async buscarPorId(req: AuthRequest, res: Response) {
    try {
      const local = await localService.buscarPorId(req.params.id as string);
      res.status(200).json(local);
    } catch (error) {
      responderErro(res, error);
    }
  },

  async criar(req: AuthRequest, res: Response) {
    try {
      const dados = selecionarCampos(req.body ?? {}, CAMPOS_LOCAL) as DadosLocal;

      if (!dados.nome || !String(dados.nome).trim()) {
        res.status(400).json({ error: 'Nome é obrigatório' });
        return;
      }

      const erroCoordenadas = validarCoordenadas(dados);
      if (erroCoordenadas) {
        res.status(400).json({ error: erroCoordenadas });
        return;
      }

      const local = await localService.criar({ ...dados, nome: String(dados.nome).trim() });
      res.status(201).json(local);
    } catch (error) {
      responderErro(res, error);
    }
  },

  async atualizar(req: AuthRequest, res: Response) {
    try {
      const dados = selecionarCampos(req.body ?? {}, CAMPOS_LOCAL) as DadosLocal;

      const erroCoordenadas = validarCoordenadas(dados);
      if (erroCoordenadas) {
        res.status(400).json({ error: erroCoordenadas });
        return;
      }

      const local = await localService.atualizar(req.params.id as string, dados);
      res.status(200).json(local);
    } catch (error) {
      responderErro(res, error);
    }
  },

  async deletar(req: AuthRequest, res: Response) {
    try {
      await localService.deletar(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      responderErro(res, error);
    }
  },

  async associarBebida(req: AuthRequest, res: Response) {
    try {
      const { bebidaId } = req.body ?? {};
      if (!bebidaId) {
        res.status(400).json({ error: 'bebidaId é obrigatório' });
        return;
      }
      const associacao = await localService.associarBebida(req.params.id as string, String(bebidaId));
      res.status(201).json(associacao);
    } catch (error) {
      responderErro(res, error);
    }
  },

  async desassociarBebida(req: AuthRequest, res: Response) {
    try {
      await localService.desassociarBebida(req.params.id as string, req.params.bebidaId as string);
      res.status(204).send();
    } catch (error) {
      responderErro(res, error);
    }
  },
};
