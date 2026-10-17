// valida o token JWT (só em rotas protegidas) após a definição do endpoint

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token não fornecido' });
      return;
    }

    // extrai o token
    const token = authHeader.split(' ')[1];

    // verifica e decodifica o token (secret lido só agora, depois do dotenv)
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; email: string };
    req.user = { id: decoded.id, email: decoded.email };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
