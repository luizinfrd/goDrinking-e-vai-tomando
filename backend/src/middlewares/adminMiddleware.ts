// restringe a rota a administradores (manutenção do catálogo e métricas)
import { NextFunction, Response } from 'express';
import { ProibidoError } from '../errors/AppError';
import { usuarioRepository } from '../repositories/usuarioRepository';
import { AuthRequest, usuarioLogado } from './authMiddleware';

// o papel é lido do banco a cada requisição: rebaixar um admin vale na hora, sem esperar o token expirar
export async function exigirAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  if (!(await usuarioRepository.ehAdmin(usuarioLogado(req)))) {
    throw new ProibidoError('Apenas administradores podem fazer isso');
  }
  next();
}
