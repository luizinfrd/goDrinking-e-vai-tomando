// perfil do usuário: estatísticas, vetor de paladar e gestão da conta (RF04, RF06)
import { FormEvent, ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarraSabor, Icon, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { api, mensagemDeErro } from '../lib/api';
import { DIMENSOES, formatarNota } from '../lib/sabor';

function Stat({ rotulo, valor, legenda, children }: { rotulo: string; valor: string; legenda: string; children?: ReactNode }) {
  return (
    <div className="glass-panel flex flex-col gap-4 rounded-2xl p-8">
      <span className="eyebrow">{rotulo}</span>
      <div className="flex items-baseline gap-3">
        <span className="font-display-lg text-display-lg">{valor}</span>
        <span className="text-on-surface-variant">{legenda}</span>
      </div>
      {children}
    </div>
  );
}

export default function MeuBarPage() {
  const { perfil, refreshMe, logout } = useAuth();
  const navigate = useNavigate();
  const [editandoNome, setEditandoNome] = useState(false);
  const [nome, setNome] = useState(perfil?.nome ?? '');
  const [erro, setErro] = useState('');

  if (!perfil) return <Spinner />;

  const { estatisticas, preferencias } = perfil;
  const desde = new Date(perfil.dataCriacao).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const dominante = preferencias
    ? DIMENSOES.reduce((a, b) => (preferencias[b.chave] > preferencias[a.chave] ? b : a))
    : null;

  async function salvarNome(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    try {
      await api('/usuarios/me', { method: 'PUT', body: { nome: nome.trim() } });
      await refreshMe();
      setEditandoNome(false);
      setErro('');
    } catch (err) {
      setErro(mensagemDeErro(err));
    }
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
    <div className="mx-auto max-w-container-max px-5 py-12 md:px-margin-desktop">
      <header className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
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
              <button type="submit" className="rounded-full bg-primary p-2 text-on-primary" aria-label="Salvar nome">
                <Icon name="check" />
              </button>
              <button type="button" onClick={() => setEditandoNome(false)} className="p-2 text-outline" aria-label="Cancelar">
                <Icon name="close" />
              </button>
            </form>
          ) : (
            <h1 className="flex items-center gap-3 font-display-lg text-headline-lg-mobile md:text-display-lg">
              {perfil.nome}
              <button
                onClick={() => {
                  setNome(perfil.nome);
                  setEditandoNome(true);
                }}
                className="text-outline hover:text-primary"
                aria-label="Editar nome"
              >
                <Icon name="edit" />
              </button>
            </h1>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
            {dominante && (
              <span className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-primary">
                <Icon name="verified" fill className="text-base" /> Paladar {dominante.rotulo.toLowerCase()}
              </span>
            )}
            <span>•</span>
            <span>{perfil.email}</span>
            <span>•</span>
            <span>Membro desde {desde}</span>
          </div>
          {erro && <p className="mt-3 text-sm text-error">{erro}</p>}
        </div>
        <Link to="/bebidas" className="btn-primary shrink-0">
          <Icon name="add" /> Avaliar uma bebida
        </Link>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
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
        <Stat rotulo="Histórico" valor="→" legenda="suas avaliações">
          <Link to="/minhas-avaliacoes" className="text-sm font-bold text-primary hover:underline">
            Ver, editar ou excluir
          </Link>
        </Stat>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-12">
        <div className="glass-card shine-border space-y-6 rounded-[32px] p-8 lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display-lg text-headline-lg">Seu perfil de paladar</h2>
              <p className="text-sm text-on-surface-variant">
                Vetor atual usado na similaridade cosseno — combina o onboarding com suas avaliações.
              </p>
            </div>
            <Link to="/onboarding" className="btn-ghost shrink-0 px-4 py-2 text-xs">
              <Icon name="refresh" /> Refazer
            </Link>
          </div>
          {preferencias &&
            DIMENSOES.map((d) => (
              <BarraSabor key={d.chave} rotulo={d.rotulo} valor={preferencias[d.chave]} destaque={d.chave === dominante?.chave} />
            ))}
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="glass-panel rounded-2xl p-8">
            <h3 className="font-headline-md text-headline-md">Como funciona</h3>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              Cada avaliação puxa seu vetor na direção dos atributos da bebida, com peso proporcional à nota (nota ÷ 5). O
              resultado é uma média ponderada entre suas respostas iniciais e tudo que você já provou.
            </p>
          </div>
          <div className="rounded-2xl border border-error/20 p-8">
            <h3 className="font-headline-md text-headline-md text-error">Zona de perigo</h3>
            <p className="mt-3 text-sm text-on-surface-variant">
              Exclui sua conta e todos os dados associados (LGPD).
            </p>
            <button onClick={excluirConta} className="mt-5 flex items-center gap-2 text-sm font-bold text-error hover:underline">
              <Icon name="delete_forever" /> Excluir minha conta
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
