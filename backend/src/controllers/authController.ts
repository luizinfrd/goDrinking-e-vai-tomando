// valida a entrada e delega ao service; erros seguem para o errorHandler
import { Request, Response } from 'express';
import { loginSchema, registerSchema } from '../schemas/auth';
import { authService } from '../services/authService';

export const authController = {
  async register(req: Request, res: Response) {
    const { nome, email, senha } = registerSchema.parse(req.body ?? {});
    const user = await authService.register(nome, email, senha);
    res.status(201).json({ message: 'Usuário cadastrado com sucesso', user });
  },

  async login(req: Request, res: Response) {
    const { email, senha } = loginSchema.parse(req.body ?? {});
    res.status(200).json(await authService.login(email, senha));
  },
};
