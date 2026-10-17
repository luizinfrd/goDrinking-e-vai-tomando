import { Response } from 'express';

// erros de regra de negócio são lançados com prefixo para o controller mapear o status http

export const PREFIXO_VALIDACAO = '[validacao] ';
export const PREFIXO_NAO_ENCONTRADO = '[nao_encontrado] ';
export const PREFIXO_PROIBIDO = '[proibido] ';
export const PREFIXO_CONFLITO = '[conflito] ';

export function isErroDeValidacao(msg: string): boolean {
  return msg.startsWith('[validacao]');
}

export const erros = {
  validacao: (msg: string) => new Error(PREFIXO_VALIDACAO + msg),
  naoEncontrado: (msg: string) => new Error(PREFIXO_NAO_ENCONTRADO + msg),
  proibido: (msg: string) => new Error(PREFIXO_PROIBIDO + msg),
  conflito: (msg: string) => new Error(PREFIXO_CONFLITO + msg),
};

// converte o erro lançado pelo service em status + mensagem limpa
export function statusDoErro(error: unknown): { status: number; mensagem: string } {
  const msg = error instanceof Error ? error.message : '';
  const mapa: [string, number][] = [
    [PREFIXO_VALIDACAO, 400],
    [PREFIXO_NAO_ENCONTRADO, 404],
    [PREFIXO_PROIBIDO, 403],
    [PREFIXO_CONFLITO, 409],
  ];
  for (const [prefixo, status] of mapa) {
    if (msg.startsWith(prefixo)) {
      return { status, mensagem: msg.slice(prefixo.length) };
    }
  }
  return { status: 500, mensagem: 'Erro interno do servidor' };
}

// resposta padrão de erro usada pelos controllers
export function responderErro(res: Response, error: unknown) {
  const { status, mensagem } = statusDoErro(error);
  if (status === 500) console.error(error);
  res.status(status).json({ error: mensagem });
}
