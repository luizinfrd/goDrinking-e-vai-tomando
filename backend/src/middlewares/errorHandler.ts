// tratamento único de erros: o express 5 já encaminha para cá os erros lançados em handlers async
import { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

type Resposta = { status: number; error: string };

export const rotaNaoEncontrada: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
};

// fallback para violações que o service não traduziu com uma mensagem própria
function respostaDoPrisma(erro: Prisma.PrismaClientKnownRequestError): Resposta | null {
  if (erro.code === 'P2002') return { status: 409, error: 'Registro duplicado' };
  if (erro.code === 'P2025') return { status: 404, error: 'Registro não encontrado' };
  if (erro.code === 'P2003') {
    const campo = String(erro.meta?.constraint ?? erro.meta?.field_name ?? '');
    // token de uma conta já excluída: força novo login
    if (campo.includes('userId')) return { status: 401, error: 'Sessão inválida, faça login novamente' };
    if (campo.includes('bebidaId')) return { status: 404, error: 'Bebida não encontrada' };
    if (campo.includes('localId')) return { status: 404, error: 'Local não encontrado' };
    return { status: 400, error: 'Referência inválida' };
  }
  return null;
}

function detalhesDaValidacao(erro: ZodError): Record<string, string> {
  const detalhes: Record<string, string> = {};
  for (const issue of erro.issues) {
    const campo = issue.path.join('.') || '_';
    detalhes[campo] ??= issue.message;
  }
  return detalhes;
}

export const tratarErros: ErrorRequestHandler = (erro, _req, res, _next) => {
  if (erro instanceof AppError) {
    res.status(erro.status).json({ error: erro.message, ...(erro.code && { code: erro.code }) });
    return;
  }
  if (erro instanceof ZodError) {
    res.status(400).json({
      error: erro.issues[0]?.message ?? 'Dados inválidos',
      detalhes: detalhesDaValidacao(erro),
    });
    return;
  }
  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    const resposta = respostaDoPrisma(erro);
    if (resposta) {
      res.status(resposta.status).json({ error: resposta.error });
      return;
    }
  }
  if (erro?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'JSON inválido no corpo da requisição' });
    return;
  }
  console.error(erro);
  res.status(500).json({ error: 'Erro interno do servidor' });
};
