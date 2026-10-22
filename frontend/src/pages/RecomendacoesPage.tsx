// dashboard: recomendações personalizadas "Beba X no Local Y" (RF22, RF25, RF26)
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { BebidaImagem, EstadoVazio, ErroBox, GradeSkeleton, Icon, LocalImagem, TipoTag } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { api, ApiError } from '../lib/api';
import { filtrosDeTipo, FiltroTipo } from '../lib/filtros';
import { formatarNota, subtituloBebida } from '../lib/sabor';
import type { LocalComBebidas, Recomendacao } from '../lib/types';

const FILTROS = filtrosDeTipo('Todos');

type LocalRecomendado = Omit<LocalComBebidas, 'bebidas'> & {
  scoreCompatibilidade: number;
  bebidas: { bebida: { id: string; nome: string; tipo: string } }[];
};

function Compatibilidade({ score }: { score: number }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary/15 px-3 py-1 font-label-sm text-label-sm text-primary">
      <Icon name="auto_awesome" fill className="text-sm" />
      {Math.round(score * 100)}%<span className="sr-only xs:not-sr-only">&nbsp;compatível</span>
    </span>
  );
}

function OndeBeber({ locais }: { locais: Recomendacao['locais'] }) {
  if (locais.length === 0) {
    return <p className="text-sm text-outline">Ainda não há locais cadastrados com essa bebida.</p>;
  }
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-on-surface-variant">
      <Icon name="location_on" className="text-base text-primary" />
      {locais.map((l, i) => (
        <span key={l.id}>
          <Link to={`/locais/${l.id}`} className="text-on-surface hover:text-primary">
            {l.nome}
          </Link>
          {i < locais.length - 1 && <span className="text-outline">,</span>}
        </span>
      ))}
    </p>
  );
}

export default function RecomendacoesPage() {
  const { usuario, perfil } = useAuth();
  const [filtro, setFiltro] = useState<FiltroTipo>('');

  const { dados: recomendacoes, carregando, erro, recarregar } = useFetch(
    (signal) => api<Recomendacao[]>('/recomendacoes', { query: { tipo: filtro || undefined, limite: 13 }, signal }),
    [filtro]
  );
  const { dados: locais } = useFetch(
    (signal) => api<LocalRecomendado[]>('/recomendacoes/locais', { query: { limite: 3 }, signal }),
    []
  );

  if (erro instanceof ApiError && erro.code === 'ONBOARDING_PENDENTE') {
    return <Navigate to="/onboarding" replace />;
  }

  const [destaque, ...demais] = recomendacoes ?? [];
  // só a primeira carga mostra skeleton; trocas de filtro mantêm o conteúdo anterior esmaecido
  const primeiraCarga = carregando && !recomendacoes;
  const totalAvaliacoes = perfil?.estatisticas.totalAvaliacoes ?? 0;

  return (
    <div>
      {/* hero com a recomendação nº 1 */}
      {primeiraCarga ? (
        <section className="min-h-[420px] animate-pulse bg-surface-container-low sm:min-h-[560px] lg:min-h-[640px] baixa:min-h-[300px]" aria-hidden />
      ) : destaque ? (
        <section
          className={`relative flex min-h-[420px] items-end overflow-hidden transition-opacity sm:min-h-[560px] lg:min-h-[640px] baixa:min-h-0 baixa:pt-10 ${carregando ? 'opacity-60' : ''}`}
        >
          <div className="absolute inset-0">
            <BebidaImagem bebida={destaque} className="brightness-[0.45]" />
            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-obsidian/80 to-transparent" />
          </div>
          <div className="relative z-10 mx-auto w-full max-w-container-max 2xl:max-w-[1560px] px-5 pb-10 sm:pb-16 md:px-10 xl:px-margin-desktop">
            <span className="eyebrow">Sua melhor combinação agora</span>
            <h1 className="mt-4 max-w-3xl hyphens-auto break-words font-display-lg text-[32px] leading-[1.1] sm:text-[40px] md:text-[64px]">
              Beba <span className="italic text-primary">{destaque.nome}</span>
              {destaque.locais[0] && (
                <>
                  {' '}
                  no <span className="italic">{destaque.locais[0].nome}</span>
                </>
              )}
            </h1>
            <p className="mt-3 max-w-2xl text-on-surface-variant sm:mt-4 sm:font-body-lg sm:text-body-lg">
              {destaque.descricao ?? subtituloBebida(destaque)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-6 sm:gap-3">
              <Compatibilidade score={destaque.score} />
              <span className="text-sm text-on-surface-variant">{destaque.motivo}</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-8 sm:gap-4">
              <Link to={`/bebidas/${destaque.id}`} className="btn-primary">
                <Icon name="local_bar" fill /> Ver detalhes
              </Link>
              {destaque.locais[0] && (
                <Link to={`/locais/${destaque.locais[0].id}`} className="btn-ghost">
                  <Icon name="near_me" /> Ir ao local
                </Link>
              )}
            </div>
          </div>
        </section>
      ) : (
        <header className="mx-auto max-w-container-max 2xl:max-w-[1560px] px-5 pb-4 pt-12 md:px-10 xl:px-margin-desktop">
          <span className="eyebrow">Recomendações</span>
          <h1 className="mt-3 font-display-lg text-headline-lg-mobile md:text-display-lg">
            Olá, {usuario?.nome.split(' ')[0]}
          </h1>
        </header>
      )}

      <div className="mx-auto max-w-container-max 2xl:max-w-[1560px] space-y-12 px-5 py-8 sm:space-y-16 sm:py-12 md:px-10 xl:px-margin-desktop">
        <section>
          <div className="mb-6 flex flex-col justify-between gap-4 md:mb-8 md:flex-row md:items-end md:gap-6">
            <div>
              <h2 className="font-display-lg text-headline-lg-mobile md:text-headline-lg">Feito para o seu paladar</h2>
              <p className="mt-2 flex items-start gap-2 text-sm text-on-surface-variant sm:text-body-md">
                <Icon name="info" className="mt-0.5 text-base text-primary" />
                {totalAvaliacoes > 0
                  ? `Baseado no seu onboarding e nas suas ${totalAvaliacoes} avaliações. Quanto mais você avalia, mais precisas ficam as sugestões.`
                  : 'Baseado nas respostas do seu onboarding. Avalie as bebidas que provar para refinar as sugestões.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
              {FILTROS.map((f) => (
                <button
                  key={f.valor}
                  aria-pressed={filtro === f.valor}
                  onClick={() => setFiltro(f.valor)}
                  className={`chip ${filtro === f.valor ? 'chip-active' : ''}`}
                >
                  {f.rotulo}
                </button>
              ))}
            </div>
          </div>

          {primeiraCarga ? (
            <GradeSkeleton rotulo="Calculando compatibilidade" />
          ) : erro ? (
            <ErroBox mensagem={erro.message} onTentar={recarregar} />
          ) : !recomendacoes || recomendacoes.length === 0 ? (
            <EstadoVazio
              icone="emoji_events"
              titulo="Você provou tudo por aqui!"
              texto="Não há bebidas que você ainda não avaliou neste filtro. Cadastre uma nova bebida ou explore outro tipo."
              acao={
                <Link to="/bebidas/nova" className="btn-primary">
                  <Icon name="add" /> Cadastrar bebida
                </Link>
              }
            />
          ) : demais.length === 0 ? (
            <p className="text-on-surface-variant">Sua recomendação principal está logo acima.</p>
          ) : (
            <div className={`grid gap-4 transition-opacity sm:grid-cols-2 sm:gap-6 xl:grid-cols-3 2xl:grid-cols-4 ${carregando ? 'pointer-events-none opacity-60' : ''}`}>
              {demais.map((r, i) => (
                <article
                  key={r.id}
                  className="glass-card glass-card-hover shine-border group flex overflow-hidden rounded-2xl sm:flex-col"
                >
                  <Link to={`/bebidas/${r.id}`} className="relative block w-28 shrink-0 overflow-hidden sm:h-48 sm:w-auto" tabIndex={-1} aria-hidden>
                    <BebidaImagem bebida={r} className="transition-transform duration-700 group-hover:scale-110" />
                    <div className="image-overlay absolute inset-0" />
                    <div className="absolute left-2 top-2 flex gap-2 sm:left-4 sm:top-4">
                      <TipoTag>#{i + 2}</TipoTag>
                      <span className="hidden sm:inline-flex">
                        <TipoTag>{r.tipo === 'vinho' ? 'Vinho' : 'Drink'}</TipoTag>
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 hidden sm:block">
                      <Compatibilidade score={r.score} />
                    </div>
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 p-4 sm:gap-3 sm:p-6">
                    <div className="self-start sm:hidden">
                      <Compatibilidade score={r.score} />
                    </div>
                    <div>
                      <Link to={`/bebidas/${r.id}`}>
                        <h3 className="font-headline-md text-lg leading-tight transition-colors group-hover:text-primary sm:text-headline-md">
                          {r.nome}
                        </h3>
                      </Link>
                      <p className="mt-1 font-label-sm text-[11px] uppercase tracking-wider text-outline sm:text-label-sm sm:tracking-widest">
                        {subtituloBebida(r)} · <Icon name="star" fill className="text-xs text-primary" /> {formatarNota(r.notaMedia)}
                      </p>
                    </div>
                    <p className="line-clamp-2 text-sm italic text-on-surface-variant sm:line-clamp-none">{r.motivo}.</p>
                    <div className="mt-auto border-t border-surface-variant/20 pt-3">
                      <OndeBeber locais={r.locais} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {locais && locais.length > 0 && (
          <section className="-mx-5 bg-surface-container-low px-5 py-10 sm:py-14 md:-mx-10 xl:-mx-margin-desktop md:px-10 xl:px-margin-desktop">
            <span className="eyebrow">Onde ir</span>
            <h2 className="mt-3 font-display-lg text-headline-lg-mobile md:text-headline-lg">Lugares que combinam com você</h2>
            <p className="mt-2 text-on-surface-variant">Estabelecimentos com mais bebidas compatíveis com o seu perfil.</p>
            <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
              {locais.map((l) => (
                <Link
                  key={l.id}
                  to={`/locais/${l.id}`}
                  className="glass-card glass-card-hover flex flex-col overflow-hidden rounded-2xl"
                >
                  <div className="relative h-32 sm:h-40">
                    <LocalImagem local={l} />
                    <span className="absolute right-3 top-3 rounded-full bg-obsidian/80 backdrop-blur">
                      <Compatibilidade score={l.scoreCompatibilidade} />
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 p-5 sm:gap-3 sm:p-6">
                    <div>
                      <TipoTag>{l.tipo ?? 'Local'}</TipoTag>
                      <h3 className="mt-3 font-headline-md text-headline-md">{l.nome}</h3>
                    </div>
                    {l.endereco && <p className="text-sm text-on-surface-variant">{l.endereco}</p>}
                    <p className="text-sm text-outline">
                      Para você: {l.bebidas.map((b) => b.bebida.nome).slice(0, 3).join(', ')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <Link to="/mapa" className="mt-6 inline-flex min-h-11 items-center gap-2 sm:mt-8 font-label-md text-label-md uppercase tracking-widest text-primary">
              Ver todos no mapa <Icon name="arrow_forward" />
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
