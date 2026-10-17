import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { bebidaService, DadosBebida } from '../services/bebidaService';
import { responderErro } from '../utils/erros';
import { atributoValido, selecionarCampos } from '../utils/validacao';

// únicos campos que o cliente pode enviar (notaMedia, id e criadoUser são controlados pelo sistema)
const CAMPOS_BEBIDA = [
    'nome', 'tipo', 'descricao', 'imagemUrl',
    'atributoDoce', 'atributoSeco', 'atributoCitrico', 'atributoEncorpado',
    'tipoVinho', 'uva', 'paisOrigem',
    'ingredientes', 'baseAlcoolica',
] as const;

const ATRIBUTOS = ['atributoDoce', 'atributoSeco', 'atributoCitrico', 'atributoEncorpado'] as const;

// retorna a mensagem de erro ou null se os atributos estiverem ok
function validarAtributos(dados: Record<string, unknown>): string | null {
    for (const atributo of ATRIBUTOS) {
        if (dados[atributo] !== undefined && !atributoValido(dados[atributo])) {
            return `${atributo} deve ser um número entre 0 e 1`;
        }
    }
    return null;
}

export const bebidaController = {
    async listar(req: AuthRequest, res: Response) {
        try {
            const { tipo, nome } = req.query as { tipo?: string; nome?: string };
            const bebidas = await bebidaService.listar(tipo, nome);
            res.status(200).json(bebidas);
        } catch (error) {
            responderErro(res, error);
        }
    },

    async buscarPorId(req: AuthRequest, res: Response) {
        try {
            const id = req.params.id as string;
            const bebida = await bebidaService.buscarPorId(id);
            res.status(200).json(bebida);
        } catch (error) {
            responderErro(res, error);
        }
    },

    async criar(req: AuthRequest, res: Response) {
    try {
      const dados = selecionarCampos(req.body ?? {}, CAMPOS_BEBIDA) as DadosBebida;

      if (!dados.nome || !dados.tipo) {
        res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
        return;
      }

      const erroAtributos = validarAtributos(dados);
      if (erroAtributos) {
        res.status(400).json({ error: erroAtributos });
        return;
      }

      const bebida = await bebidaService.criar({
        ...dados,
        nome: String(dados.nome).trim(),
        tipo: String(dados.tipo),
        criadoUser: true,
      });

      res.status(201).json(bebida);
    } catch (error) {
      responderErro(res, error);
    }
  },

  async atualizar(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const dados = selecionarCampos(req.body ?? {}, CAMPOS_BEBIDA) as DadosBebida;

      const erroAtributos = validarAtributos(dados);
      if (erroAtributos) {
        res.status(400).json({ error: erroAtributos });
        return;
      }

      const bebida = await bebidaService.atualizar(id, dados);
      res.status(200).json(bebida);
    } catch (error) {
      responderErro(res, error);
    }
  },

  async deletar(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      await bebidaService.deletar(id);
      res.status(204).send();
    } catch (error) {
      responderErro(res, error);
    }
  },
};
