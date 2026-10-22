import { z } from 'zod';
import { texto } from './comum';

const email = z
  .string({ error: 'E-mail é obrigatório' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Formato de e-mail inválido' }));

export const registerSchema = z.object({
  nome: texto('Nome', 100),
  email,
  // bcrypt só considera os primeiros 72 bytes
  senha: z
    .string({ error: 'Senha é obrigatória' })
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .max(72, 'A senha deve ter no máximo 72 caracteres'),
});

export const loginSchema = z.object({
  email: z.string({ error: 'Email e senha são obrigatórios' }).trim().toLowerCase().min(1, 'Email e senha são obrigatórios'),
  senha: z.string({ error: 'Email e senha são obrigatórios' }).min(1, 'Email e senha são obrigatórios'),
});
