import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '../components/AuthShell';
import { Logo } from '../components/AppLayout';
import { Icon } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { mensagemDeErro } from '../lib/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Erros = Partial<Record<'nome' | 'email' | 'senha' | 'termos' | 'geral', string>>;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [termos, setTermos] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);

  function validar(): Erros {
    const e: Erros = {};
    if (!nome.trim()) e.nome = 'Informe seu nome.';
    if (!EMAIL_REGEX.test(email)) e.email = 'Informe um e-mail válido.';
    if (senha.length < 8) e.senha = 'A senha precisa ter no mínimo 8 caracteres.';
    if (!termos) e.termos = 'É preciso aceitar os termos para continuar.';
    return e;
  }

  async function cadastrar(ev: FormEvent) {
    ev.preventDefault();
    const encontrados = validar();
    setErros(encontrados);
    if (Object.keys(encontrados).length) return;

    setEnviando(true);
    try {
      await register(nome.trim(), email.trim(), senha);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      const msg = mensagemDeErro(err);
      setErros(msg === 'Email já cadastrado' ? { email: 'Este e-mail já está cadastrado.' } : { geral: msg });
    } finally {
      setEnviando(false);
    }
  }

  const erroCampo = (campo: keyof Erros) =>
    erros[campo] && <p className="mt-2 text-xs text-error">{erros[campo]}</p>;

  return (
    <AuthShell decoracao="Misture com arte">
      <div className="glass-panel rounded-2xl p-6 shadow-[0_32px_64px_rgba(0,0,0,0.5)] sm:p-8 md:p-12">
        <div className="mb-10">
          <Logo />
          <h1 className="mt-6 font-display-lg text-headline-lg">Crie sua conta</h1>
          <p className="mt-2 text-on-surface-variant">Descubra bebidas e lugares que combinam com o seu paladar.</p>
        </div>

        <form onSubmit={cadastrar} className="space-y-7" noValidate>
          <div className="group">
            <label htmlFor="nome" className="field-label">
              Nome completo
            </label>
            <input
              id="nome"
              autoComplete="name"
              placeholder="Ex.: Ana Souza"
              className="input-line"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            {erroCampo('nome')}
          </div>

          <div className="group">
            <label htmlFor="email" className="field-label">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              className="input-line"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {erroCampo('email')}
          </div>

          <div className="group">
            <label htmlFor="senha" className="field-label">
              Senha
            </label>
            <div className="relative">
              <input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
                className="input-line pr-12"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute -right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-outline transition-colors hover:text-primary"
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                <Icon name={mostrarSenha ? 'visibility_off' : 'visibility'} />
              </button>
            </div>
            {erroCampo('senha')}
          </div>

          <div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 py-1 text-sm text-on-surface-variant">
              <input
                type="checkbox"
                checked={termos}
                onChange={(e) => setTermos(e.target.checked)}
                className="h-5 w-5 shrink-0 rounded border-outline bg-transparent accent-primary"
              />
              <span>
                Concordo com os <span className="text-primary">Termos de Uso</span> e a{' '}
                <span className="text-primary">Política de Privacidade</span>, e declaro ter 18 anos ou mais.
              </span>
            </label>
            {erroCampo('termos')}
          </div>

          {erros.geral && (
            <p className="flex items-center gap-2 rounded-lg bg-error-container/30 px-4 py-3 text-sm text-error" role="alert">
              <Icon name="error" /> {erros.geral}
            </p>
          )}

          <button type="submit" disabled={enviando} className="btn-primary w-full py-5">
            {enviando ? <Icon name="progress_activity" className="animate-spin" /> : 'Criar conta'}
          </button>
        </form>

        <p className="mt-10 border-t border-surface-variant/20 pt-8 text-center text-on-surface-variant">
          Já possui uma conta?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Acesse aqui
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
