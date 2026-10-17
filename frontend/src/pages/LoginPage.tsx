import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { Logo } from '../components/AppLayout';
import { Icon } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { mensagemDeErro } from '../lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const destino = (location.state as { de?: string } | null)?.de ?? '/';

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    if (!email || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }
    setEnviando(true);
    try {
      const perfil = await login(email, senha);
      // primeiro acesso → onboarding de paladar (fluxograma)
      navigate(perfil.onboardingConcluido ? destino : '/onboarding', { replace: true });
    } catch (err) {
      setErro(mensagemDeErro(err) === 'Credenciais inválidas' ? 'E-mail ou senha incorretos.' : mensagemDeErro(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthShell decoracao="Beba melhor">
      <div className="glass-panel ambient-glow rounded-2xl p-8 md:p-12">
        <div className="mb-10 text-center">
          <Logo className="text-display-lg" />
          <p className="mt-2 font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
            Seu paladar, suas descobertas
          </p>
        </div>

        <form onSubmit={entrar} className="space-y-8" noValidate>
          <div className="group">
            <label htmlFor="email" className="field-label">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nome@exemplo.com"
              className="input-line"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="group">
            <label htmlFor="senha" className="field-label">
              Senha
            </label>
            <div className="relative">
              <input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="input-line pr-10"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-primary"
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <Icon name={mostrarSenha ? 'visibility_off' : 'visibility'} />
              </button>
            </div>
          </div>

          {erro && (
            <p className="flex items-center gap-2 rounded-lg bg-error-container/30 px-4 py-3 text-sm text-error" role="alert">
              <Icon name="error" /> {erro}
            </p>
          )}

          <button type="submit" disabled={enviando} className="btn-primary w-full rounded-lg">
            {enviando ? <Icon name="progress_activity" className="animate-spin" /> : 'Entrar'}
          </button>
        </form>

        <p className="mt-10 text-center text-on-surface-variant">
          Não tem uma conta?{' '}
          <Link to="/cadastro" className="font-bold text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
