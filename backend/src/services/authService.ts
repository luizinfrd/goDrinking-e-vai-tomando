// lógica de negócio da autenticação (hash, comparar senha, gerar token)
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { NaoAutorizadoError, seDuplicado } from '../errors/AppError';
import { usuarioRepository } from '../repositories/usuarioRepository';

const SALT_ROUNDS = 10;

// hash fixo para comparar quando o e-mail não existe: o tempo de resposta não revela contas cadastradas
const HASH_FICTICIO = bcrypt.hashSync('senha-que-nunca-confere', SALT_ROUNDS);

export const authService = {
  async register(nome: string, email: string, senha: string) {
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    return seDuplicado(usuarioRepository.criar({ nome, email, senhaHash }), 'Email já cadastrado');
  },

  async login(email: string, senha: string) {
    const user = await usuarioRepository.buscarPorEmail(email);
    const senhaCorreta = await bcrypt.compare(senha, user?.senha ?? HASH_FICTICIO);
    if (!user || !senhaCorreta) {
      throw new NaoAutorizadoError('Credenciais inválidas');
    }

    const token = jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    });

    return { token, user: { id: user.id, nome: user.nome, email: user.email } };
  },
};
