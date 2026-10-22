// erros de negócio: o status http vai junto do erro e o errorHandler só repassa
import { Prisma } from '@prisma/client';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidacaoError extends AppError {
  constructor(mensagem: string) {
    super(400, mensagem);
  }
}

export class NaoAutorizadoError extends AppError {
  constructor(mensagem: string) {
    super(401, mensagem);
  }
}

export class ProibidoError extends AppError {
  constructor(mensagem: string) {
    super(403, mensagem);
  }
}

export class NaoEncontradoError extends AppError {
  constructor(mensagem: string) {
    super(404, mensagem);
  }
}

export class ConflitoError extends AppError {
  constructor(mensagem: string, code?: string) {
    super(409, mensagem, code);
  }
}

export function codigoPrisma(erro: unknown): string | undefined {
  return erro instanceof Prisma.PrismaClientKnownRequestError ? erro.code : undefined;
}

// deixa o banco garantir a unicidade (sem check-then-create, que tem race) e traduz a violação
export async function seDuplicado<T>(operacao: Promise<T>, mensagem: string): Promise<T> {
  try {
    return await operacao;
  } catch (erro) {
    if (codigoPrisma(erro) === 'P2002') throw new ConflitoError(mensagem);
    throw erro;
  }
}

// update/delete de registro inexistente (P2025) vira 404 sem precisar buscar antes
export async function seInexistente<T>(operacao: Promise<T>, mensagem: string): Promise<T> {
  try {
    return await operacao;
  } catch (erro) {
    if (codigoPrisma(erro) === 'P2025') throw new NaoEncontradoError(mensagem);
    throw erro;
  }
}
