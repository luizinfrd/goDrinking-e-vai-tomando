// perfil do usuário: estatísticas, vetor de paladar e gestão da conta (RF04, RF06)
import { FormEvent, ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pagina } from '../components/Pagina';
import { BebidaCard } from '../components/BebidaCard';
import { RadarSabor } from '../components/RadarSabor';
import { BarraSabor, Icon, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFavoritos } from '../context/FavoritosContext';
import { api, mensagemDeErro } from '../lib/api';
import { DIMENSOES, evolucaoDoPaladar, formatarNota } from '../lib/sabor';
import type { Conquista } from '../lib/types';

function CartaoConquista({ conquista }: { conquista: Conquista }) {
  const pct = Math.round((conquista.progresso / conquista.meta) * 100);
  return (
    <li
      className={`glass-card flex items-start gap-4 rounded-2xl p-4 sm:p-5 ${conquista.conquistada ? 'shine-border' : 'opacity-70'}`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
          conquista.conquistada ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-outline'
        }`}
      >
        <Icon name={conquista.icone} fill={conquista.conquistada} className="text-2xl" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-headline-md text-[18px] leading-tight">{conquista.titulo}</p>
        <p className="text-sm text-on-surface-variant">{conquista.descricao}</p>
        {!conquista.conquistada && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-variant">
              <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-outline">
              {conquista.progresso}/{conquista.meta}
            </span>
          </div>
        )}
      </div>
    </li>
  );
}

function Stat({
  rotulo,
  valor,
  legenda,
  largo = false,
  children,
}: {
  rotulo: string;
  valor: string;
  legenda: string;
  largo?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`glass-panel flex flex-col gap-2 rounded-2xl p-5 md:gap-4 md:p-8 ${largo ? 'col-span-2 md:col-span-1' : ''}`}>
      <span className="eyebrow !tracking-[0.15em] md:!tracking-[0.3em]">{rotulo}</span>
      <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:gap-3">
        <span className="font-display-lg text-[36px] leading-none md:text-display-lg">{valor}</span>
        <span className="text-sm text-on-surface-variant md:text-body-md">{legenda}</span>
      </div>
      {children}
    </div>
  );
}

export default function MeuBarPage() {
  const { perfil, refreshMe, logout } = useAuth();
  const { favoritos } = useFavoritos();
  const navigate = useNavigate();
  const [editandoNome, setEditandoNome] = useState(false);
  const [nome, setNome] = useState(perfil?.nome ?? '');
  const [erro, setErro] = useState('');
  const [salvandoNome, setSalvandoNome] = useState(false);

  if (!perfil) return <Spinner />;

  const { estatisticas, preferencias, preferenciasBase, conquistas } = perfil;
  const conquistadas = conquistas.filter((c) => c.conquistada).length;
  const desde = new Date(perfil.dataCriacao).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const dominante = preferencias
    ? DIMENSOES.reduce((a, b) => (preferencias[b.chave] > preferencias[a.chave] ? b : a))
    : null;

  async function salvarNome(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim() || salvandoNome) return;
    setSalvandoNome(true);
    try {
      await api('/usuarios/me', { method: 'PUT', body: { nome: nome.trim() } });
      await refreshMe();
      setEditandoNome(false);
      setErro('');
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setSalvandoNome(false);
    }
  }

  function sair() {
    logout();
    navigate('/login');
  }

  async function excluirConta() {
    const ok = window.confirm(
      'Excluir sua conta permanentemente? Todas as suas avaliações e preferências serão apagadas. Essa ação não pode ser desfeita.'
    );
    if (!ok) return;
    try {
      await api('/usuarios/me', { method: 'DELETE' });
      logout();
      navigate('/cadastro', { replace: true });
    } catch (err) {
      setErro(mensagemDeErro(err));
    }
  }

  return (
    <Pagina>
      <header className="mb-8 flex flex-col md:mb-12 justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          {editandoNome ? (
            <form onSubmit={salvarNome} className="flex items-center gap-3">
              <input
                autoFocus
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input-line font-display-lg text-headline-lg"
                aria-label="Seu nome"
              />
              <button type="submit" disabled={salvandoNome} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary" aria-label="Salvar nome">
                <Icon name="check" />
              </button>
              <button type="button" onClick={() => setEditandoNome(false)} className="flex h-11 w-11 shrink-0 items-center justify-center text-outline" aria-label="Cancelar">
                <Icon name="close" />
              </button>
            </form>
          ) : (
            <h1 className="flex items-center gap-1 break-words font-display-lg text-headline-lg-mobile md:text-display-lg">
              {perfil.nome}
              <button
                onClick={() => {
                  setNome(perfil.nome);
                  setEditandoNome(true);
                }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-outline hover:text-primary"
                aria-label="Editar nome"
              >
                <Icon name="edit" />
              </button>
            </h1>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-on-surface-variant">
            {dominante && (
              <span className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-primary">
                <Icon name="verified" fill className="text-base" /> Paladar {dominante.rotulo.toLowerCase()}
              </span>
            )}
            <span className="break-all">{perfil.email}</span>
            <span>Membro desde {desde}</span>
          </div>
          {erro && <p className="mt-3 text-sm text-error" role="alert">{erro}</p>}
        </div>
        <div className="flex flex-wrap gap-3 xl:shrink-0">
          <Link to="/bebidas" className="btn-primary">
            <Icon name="add" /> Avaliar uma bebida
          </Link>
          {perfil.papel === 'admin' && (
            <Link to="/admin" className="btn-ghost lg:hidden">
              <Icon name="admin_panel_settings" /> Administração
            </Link>
          )}
          <button onClick={sair} className="btn-ghost lg:hidden">
            <Icon name="logout" /> Sair da conta
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6">
        <Stat rotulo="Experiências" valor={String(estatisticas.totalAvaliacoes)} legenda="bebidas avaliadas">
          <p className="text-sm text-outline">
            {estatisticas.drinks} drinks · {estatisticas.vinhos} vinhos
          </p>
        </Stat>
        <Stat rotulo="Exigência" valor={formatarNota(estatisticas.mediaNotas)} legenda="nota média dada">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className={`h-2 w-2 rounded-full ${n <= Math.round(estatisticas.mediaNotas) ? 'bg-primary' : 'bg-surface-variant'}`} />
            ))}
          </div>
        </Stat>
        <Stat rotulo="Conquistas" valor={`${conquistadas}/${conquistas.length}`} legenda="desbloqueadas" largo>
          <Link to="/minhas-avaliacoes" className="inline-flex min-h-11 items-center text-sm font-bold text-primary hover:underline">
            Ver meu diário de degustação
          </Link>
        </Stat>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 md:mt-12 md:gap-6 xl:grid-cols-12">
        <div className="glass-card shine-border space-y-6 rounded-[32px] p-6 md:p-8 xl:col-span-7">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
            <div>
              <h2 className="font-display-lg text-headline-lg-mobile md:text-headline-lg">Seu perfil de paladar</h2>
              <p className="text-sm text-on-surface-variant">
                Vetor atual usado na similaridade cosseno — combina o onboarding com suas avaliações.
              </p>
            </div>
            <Link to="/onboarding" className="btn-ghost shrink-0 px-4 py-2 text-xs">
              <Icon name="refresh" /> Refazer
            </Link>
          </div>
          {preferencias && (
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
              <div>
                <RadarSabor atual={preferencias} base={perfil.onboardingConcluido ? preferenciasBase : null} />
                {perfil.onboardingConcluido && preferenciasBase && (
                  <p className="mt-4 text-center text-sm text-on-surface-variant">{evolucaoDoPaladar(preferenciasBase, preferencias)}</p>
                )}
              </div>
              <div className="space-y-6">
                {DIMENSOES.map((d) => (
                  <BarraSabor key={d.chave} rotulo={d.rotulo} valor={preferencias[d.chave]} destaque={d.chave === dominante?.chave} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 md:gap-6 xl:col-span-5">
          <div className="glass-panel rounded-2xl p-6 md:p-8">
            <h3 className="font-headline-md text-headline-md">Como funciona</h3>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              Cada avaliação puxa seu vetor na direção dos atributos da bebida, com peso proporcional à nota (nota ÷ 5). O
              resultado é uma média ponderada entre suas respostas iniciais e tudo que você já provou.
            </p>
          </div>
          <div className="rounded-2xl border border-error/20 p-6 md:p-8">
            <h3 className="font-headline-md text-headline-md text-error">Zona de perigo</h3>
            <p className="mt-3 text-sm text-on-surface-variant">
              Exclui sua conta e todos os dados associados (LGPD).
            </p>
            <button onClick={excluirConta} className="mt-3 flex min-h-11 items-center gap-2 text-sm font-bold text-error hover:underline">
              <Icon name="delete_forever" /> Excluir minha conta
            </button>
          </div>
        </div>
      </section>

      <section className="mt-10 md:mt-14" aria-labelledby="titulo-quero-provar">
        <div className="mb-5 flex items-center gap-3 sm:gap-4">
          <div className="h-px w-8 shrink-0 bg-primary sm:w-12" />
          <h2 id="titulo-quero-provar" className="font-display-lg text-headline-lg-mobile md:text-headline-lg">
            Quero provar
          </h2>
        </div>
        {favoritos.length === 0 ? (
          <p className="text-on-surface-variant">
            Toque no <Icon name="favorite" className="align-middle text-base text-primary" /> de uma bebida para guardá-la aqui. Os locais que
            servem suas favoritas ganham destaque nas recomendações.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-3 2xl:grid-cols-4">
            {favoritos.map((b) => (
              <BebidaCard key={b.id} bebida={b} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 md:mt-14" aria-labelledby="titulo-conquistas">
        <div className="mb-5 flex items-center gap-3 sm:gap-4">
          <div className="h-px w-8 shrink-0 bg-primary sm:w-12" />
          <h2 id="titulo-conquistas" className="font-display-lg text-headline-lg-mobile md:text-headline-lg">
            Conquistas
          </h2>
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {conquistas.map((c) => (
            <CartaoConquista key={c.id} conquista={c} />
          ))}
        </ul>
      </section>
    </Pagina>
  );
}
