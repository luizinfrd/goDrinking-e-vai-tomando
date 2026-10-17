// protege rotas: sem token → login; sem onboarding → questionário de paladar
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErroBox, Spinner } from './ui';

export function PrivateRoute({ exigeOnboarding = true }: { exigeOnboarding?: boolean }) {
  const { autenticado, carregando, perfil, refreshMe } = useAuth();
  const location = useLocation();

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ de: location.pathname }} />;
  }

  if (carregando) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-obsidian">
        <Spinner texto="Preparando seu bar..." />
      </div>
    );
  }

  // token salvo, mas a API não respondeu (ex.: backend fora do ar)
  if (!perfil) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-obsidian p-6">
        <ErroBox
          mensagem="Não foi possível carregar seu perfil. Verifique se a API está rodando."
          onTentar={() => refreshMe().catch(() => undefined)}
        />
      </div>
    );
  }

  if (exigeOnboarding && !perfil.onboardingConcluido) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

// páginas de login/cadastro: quem já está logado vai direto para o app
export function PublicOnlyRoute() {
  const { autenticado } = useAuth();
  if (autenticado) return <Navigate to="/" replace />;
  return <Outlet />;
}
