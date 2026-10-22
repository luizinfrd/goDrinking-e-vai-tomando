// estado global de autenticação: token JWT + perfil do usuário no localStorage
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, registrarExpiracaoSessao, TOKEN_KEY, USER_KEY } from '../lib/api';
import type { Perfil, Usuario } from '../lib/types';

type AuthContextValue = {
  token: string | null;
  usuario: Usuario | null;
  perfil: Perfil | null;
  carregando: boolean;
  autenticado: boolean;
  login: (email: string, senha: string) => Promise<Perfil>;
  register: (nome: string, email: string, senha: string) => Promise<Perfil>;
  logout: () => void;
  refreshMe: () => Promise<Perfil | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function lerUsuarioSalvo(): Usuario | null {
  try {
    const salvo = localStorage.getItem(USER_KEY);
    return salvo ? (JSON.parse(salvo) as Usuario) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [usuario, setUsuario] = useState<Usuario | null>(lerUsuarioSalvo);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState<boolean>(() => !!localStorage.getItem(TOKEN_KEY));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUsuario(null);
    setPerfil(null);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) return null;
    const me = await api<Perfil>('/usuarios/me');
    const resumo = { id: me.id, nome: me.nome, email: me.email };
    localStorage.setItem(USER_KEY, JSON.stringify(resumo));
    setUsuario(resumo);
    setPerfil(me);
    return me;
  }, []);

  // token expirado em qualquer chamada → volta para o login
  useEffect(() => registrarExpiracaoSessao(logout), [logout]);

  // ao abrir o app com token salvo, valida a sessão buscando o perfil
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    // 401 já desloga via registrarExpiracaoSessao; erro de rede mantém a sessão
    refreshMe()
      .catch(() => undefined)
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, senha: string) => {
      const resposta = await api<{ token: string; user: Usuario }>('/auth/login', {
        method: 'POST',
        body: { email, senha },
      });
      // o api() lê o token do localStorage, então ele precisa estar lá para buscar o perfil
      localStorage.setItem(TOKEN_KEY, resposta.token);
      try {
        const me = await api<Perfil>('/usuarios/me');
        const resumo = { id: me.id, nome: me.nome, email: me.email };
        localStorage.setItem(USER_KEY, JSON.stringify(resumo));
        setUsuario(resumo);
        setPerfil(me);
        setToken(resposta.token);
        return me;
      } catch (erro) {
        // sem perfil o login não se completa: não deixa um token órfão para a próxima abertura do app
        localStorage.removeItem(TOKEN_KEY);
        throw erro;
      }
    },
    []
  );

  const register = useCallback(
    async (nome: string, email: string, senha: string) => {
      await api('/auth/register', { method: 'POST', body: { nome, email, senha } });
      return login(email, senha);
    },
    [login]
  );

  const valor = useMemo<AuthContextValue>(
    () => ({
      token,
      usuario,
      perfil,
      carregando,
      autenticado: !!token,
      login,
      register,
      logout,
      refreshMe,
    }),
    [token, usuario, perfil, carregando, login, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return contexto;
}
