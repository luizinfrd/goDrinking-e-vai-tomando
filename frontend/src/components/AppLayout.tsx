// estrutura base das páginas autenticadas: sidebar fixa (desktop) e barra inferior (mobile)
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icon } from './ui';

const NAV_PRINCIPAL = [
  { to: '/', icone: 'explore', rotulo: 'Início', end: true },
  { to: '/bebidas', icone: 'menu_book', rotulo: 'Bebidas', end: false },
  { to: '/mapa', icone: 'distance', rotulo: 'Mapa', end: false },
  { to: '/meu-bar', icone: 'local_bar', rotulo: 'Meu Bar', end: false },
];

const NAV_SECUNDARIA = [
  { to: '/minhas-avaliacoes', icone: 'history', rotulo: 'Minhas avaliações' },
  { to: '/bebidas/nova', icone: 'add_circle', rotulo: 'Cadastrar bebida' },
];

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display-lg text-headline-lg tracking-wide text-primary ${className}`}>
      go<span className="italic">Drinking</span>
    </span>
  );
}

function iniciais(nome?: string) {
  if (!nome) return '?';
  const partes = nome.trim().split(/\s+/);
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

export function AppLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const sair = () => {
    logout();
    navigate('/login');
  };

  const classeItem = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-4 rounded-lg px-4 py-3 font-label-md text-label-md transition-all duration-200 ${
      isActive
        ? 'border-r-2 border-primary bg-surface-variant/10 font-bold text-primary'
        : 'text-on-surface-variant hover:bg-surface-variant/20 hover:text-primary'
    }`;

  return (
    <div className="min-h-screen bg-obsidian">
      {/* sidebar desktop */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col gap-8 border-r border-surface-variant/10 bg-surface-container-lowest px-6 py-8 lg:flex">
        <NavLink to="/">
          <Logo />
        </NavLink>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-label-md text-primary">
            {iniciais(usuario?.nome)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-label-md text-label-md text-on-surface">{usuario?.nome}</p>
            <p className="truncate text-[11px] uppercase tracking-widest text-outline">Explorador de sabores</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_PRINCIPAL.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={classeItem}>
              {({ isActive }) => (
                <>
                  <Icon name={item.icone} fill={isActive} />
                  {item.rotulo}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t border-surface-variant/10 pt-6">
          {NAV_SECUNDARIA.map((item) => (
            <NavLink key={item.to} to={item.to} end className={classeItem}>
              <Icon name={item.icone} />
              {item.rotulo}
            </NavLink>
          ))}
        </div>

        <button
          onClick={sair}
          className="mt-auto flex items-center gap-4 rounded-lg px-4 py-3 font-label-md text-label-md text-outline transition-colors hover:text-error"
        >
          <Icon name="logout" /> Sair
        </button>
      </aside>

      {/* topo mobile */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-surface-variant/10 bg-obsidian/80 px-5 backdrop-blur-xl lg:hidden">
        <NavLink to="/">
          <Logo className="text-headline-md" />
        </NavLink>
        <div className="flex items-center gap-1">
          <NavLink to="/minhas-avaliacoes" className="p-2 text-on-surface-variant" aria-label="Minhas avaliações">
            <Icon name="history" />
          </NavLink>
          <button onClick={sair} className="p-2 text-on-surface-variant" aria-label="Sair">
            <Icon name="logout" />
          </button>
        </div>
      </header>

      <main className="pb-24 lg:ml-64 lg:pb-0">
        <Outlet />
      </main>

      {/* navegação inferior mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-4 border-t border-surface-variant/10 bg-surface-container-lowest/95 backdrop-blur-xl lg:hidden">
        {NAV_PRINCIPAL.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-3 text-[11px] uppercase tracking-wider ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={item.icone} fill={isActive} />
                {item.rotulo}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
