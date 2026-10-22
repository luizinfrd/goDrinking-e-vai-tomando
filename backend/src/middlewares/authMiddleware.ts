// valida o token JWT nas rotas protegidas
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { NaoAutorizadoError } from '../errors/AppError';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new NaoAutorizadoError('Token não fornecido');
  }

  try {
    const token = authHeader.slice('Bearer '.length);
    // algoritmo fixo: não aceita tokens assinados com outro algoritmo
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as { id: string; email: string };
    req.user = { id: decoded.id, email: decoded.email };
  } catch {
    throw new NaoAutorizadoError('Token inválido ou expirado');
  }
  next();
};

// id do usuário autenticado (as rotas que usam isso passam pelo authMiddleware)
export function usuarioLogado(req: AuthRequest): string {
  if (!req.user) throw new NaoAutorizadoError('Token não fornecido');
  return req.user.id;
}
