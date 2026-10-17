import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { PrivateRoute, PublicOnlyRoute } from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import RecomendacoesPage from './pages/RecomendacoesPage';
import BebidasPage from './pages/BebidasPage';
import BebidaDetalhePage from './pages/BebidaDetalhePage';
import NovaBebidaPage from './pages/NovaBebidaPage';
import MapaPage from './pages/MapaPage';
import LocalDetalhePage from './pages/LocalDetalhePage';
import MeuBarPage from './pages/MeuBarPage';
import MinhasAvaliacoesPage from './pages/MinhasAvaliacoesPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
      </Route>

      {/* onboarding exige login, mas não o próprio onboarding */}
      <Route element={<PrivateRoute exigeOnboarding={false} />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RecomendacoesPage />} />
          <Route path="/bebidas" element={<BebidasPage />} />
          <Route path="/bebidas/nova" element={<NovaBebidaPage />} />
          <Route path="/bebidas/:id" element={<BebidaDetalhePage />} />
          <Route path="/mapa" element={<MapaPage />} />
          <Route path="/locais/:id" element={<LocalDetalhePage />} />
          <Route path="/meu-bar" element={<MeuBarPage />} />
          <Route path="/minhas-avaliacoes" element={<MinhasAvaliacoesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
