import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { CODIGO_ONBOARDING_PENDENTE, recomendacaoService } from '../services/recomendacaoService';
import { responderErro, statusDoErro } from '../utils/erros';

function limiteDaQuery(valor: string | undefined, padrao: number) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? Math.min(n, 50) : padrao;
}

// trata o cold start com um código que o front usa para mandar ao onboarding
function responder(res: Response, error: unknown) {
  const { status, mensagem } = statusDoErro(error);
  if (status === 409 && mensagem === CODIGO_ONBOARDING_PENDENTE) {
    res.status(409).json({
      error: 'Conclua o onboarding de paladar para receber recomendações',
      code: CODIGO_ONBOARDING_PENDENTE,
    });
    return;
  }
  responderErro(res, error);
}

export const recomendacaoController = {
  async recomendar(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { tipo, limite } = req.query as { tipo?: string; limite?: string };

      const recomendacoes = await recomendacaoService.recomendar(
        userId,
        tipo,
        limiteDaQuery(limite, 10)
      );

      res.status(200).json(recomendacoes);
    } catch (error) {
      responder(res, error);
    }
  },

  async recomendarLocais(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { limite } = req.query as { limite?: string };

      const locais = await recomendacaoService.recomendarLocais(
        userId,
        limiteDaQuery(limite, 5)
      );

      res.status(200).json(locais);
    } catch (error) {
      responder(res, error);
    }
  },
};
