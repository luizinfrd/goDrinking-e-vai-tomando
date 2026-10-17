// cliente http da API: injeta o token JWT e padroniza os erros

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

export const TOKEN_KEY = 'godrinking:token';
export const USER_KEY = 'godrinking:user';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// chamado quando a API responde 401 com token (sessão expirada)
let aoExpirarSessao: (() => void) | null = null;
export function registrarExpiracaoSessao(callback: () => void) {
  aoExpirarSessao = callback;
}

type Opcoes = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
};

export async function api<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = opcoes;

  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([chave, valor]) => {
    if (valor !== undefined && valor !== '') params.set(chave, String(valor));
  });
  const qs = params.toString();

  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}${qs ? `?${qs}` : ''}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (erro) {
    if ((erro as Error).name === 'AbortError') throw erro;
    throw new ApiError('Não foi possível conectar ao servidor. Verifique se a API está rodando.', 0);
  }

  if (resposta.status === 204) return undefined as T;

  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    if (resposta.status === 401 && token) aoExpirarSessao?.();
    throw new ApiError(dados.error || 'Erro inesperado', resposta.status, dados.code);
  }

  return dados as T;
}

export function mensagemDeErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Erro inesperado';
}
