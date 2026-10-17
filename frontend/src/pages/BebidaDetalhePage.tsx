// detalhe da bebida: perfil sensorial, dados por tipo, onde encontrar e avaliações (RF09, RF13)
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AvaliacaoForm } from '../components/AvaliacaoForm';
import { BarraSabor, BebidaImagem, ErroBox, Estrelas, Icon, Spinner, TipoTag } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { api } from '../lib/api';
import { capitalizar, DIMENSOES, formatarData, formatarNota } from '../lib/sabor';
import type { Avaliacao, BebidaDetalhe } from '../lib/types';

function Info({ rotulo, valor, icone }: { rotulo: string; valor?: string | null; icone: string }) {
  if (!valor) return null;
  return (
    <div className="glass-card shine-border flex items-center gap-4 rounded-2xl p-4 sm:gap-5 sm:p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-container-highest/60">
        <Icon name={icone} className="text-2xl text-primary" />
      </div>
      <div className="min-w-0">
        <p className="font-label-sm text-label-sm uppercase tracking-widest text-outline">{rotulo}</p>
        <p className="font-headline-md text-headline-md">{valor}</p>
      </div>
    </div>
  );
}

export default function BebidaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, refreshMe } = useAuth();
  const [minha, setMinha] = useState<Avaliacao | null>(null);
  // evita mostrar o form vazio antes de saber se o usuário já avaliou (causaria 409 e pulo de layout)
  const [carregandoMinha, setCarregandoMinha] = useState(true);
  const [editando, setEditando] = useState(false);
  const [acabouDeAvaliar, setAcabouDeAvaliar] = useState(false);

  const { dados: bebida, setDados, carregando, erro, recarregar } = useFetch(
    (signal) => api<BebidaDetalhe>(`/bebidas/${id}`, { signal }),
    [id]
  );

  // descobre se o usuário já avaliou esta bebida (para editar em vez de criar)
  useEffect(() => {
    setMinha(null);
    setEditando(false);
    setAcabouDeAvaliar(false);
    setCarregandoMinha(true);
    api<Avaliacao[]>('/avaliacoes/minhas')
      .then((lista) => setMinha(lista.find((a) => a.bebidaId === id) ?? null))
      .catch(() => undefined)
      .finally(() => setCarregandoMinha(false));
  }, [id]);

  // atualiza nota média e lista sem recarregar a página
  async function aoSalvar(avaliacao: Avaliacao) {
    setMinha(avaliacao);
    setEditando(false);
    setAcabouDeAvaliar(true);
    try {
      setDados(await api<BebidaDetalhe>(`/bebidas/${id}`));
    } catch {
      // a avaliação já foi salva; só a nota média exibida fica desatualizada
    }
    refreshMe().catch(() => undefined);
  }

  // leva até o formulário (no mobile ele fica no fim da página)
  function irParaAvaliacao() {
    if (minha) setEditando(true);
    document.getElementById('avaliar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // aberto por link direto não há histórico no app: volta para o catálogo
  const voltar = () => (location.key === 'default' ? navigate('/bebidas') : navigate(-1));

  if (carregando && !bebida) return <Spinner />;
  if (erro || !bebida) {
    return (
      <div className="p-10">
        <ErroBox mensagem={erro?.message ?? 'Bebida não encontrada'} onTentar={recarregar} />
      </div>
    );
  }

  const vinho = bebida.tipo === 'vinho';
  const ingredientes = bebida.ingredientes?.split(',').map((i) => i.trim()).filter(Boolean) ?? [];
  const atributos = DIMENSOES.map((d) => ({ ...d, valor: bebida[d.atributo] as number }));
  const maior = Math.max(...atributos.map((a) => a.valor));

  return (
    <div>
      {/* hero */}
      <section className="relative flex min-h-[400px] items-end overflow-hidden pt-20 sm:min-h-[480px] lg:min-h-[560px] baixa:min-h-0">
        <div className="absolute inset-0">
          <BebidaImagem bebida={bebida} className="brightness-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/30 to-black/30" />
        </div>
        <button
          onClick={voltar}
          className="glass-panel absolute left-5 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-full md:left-margin-desktop"
          aria-label="Voltar"
        >
          <Icon name="arrow_back" />
        </button>
        <div className="relative z-10 mx-auto w-full max-w-container-max 2xl:max-w-[1560px] px-5 pb-10 sm:pb-14 md:px-10 xl:px-margin-desktop">
          <div className="mb-5 flex flex-wrap gap-2">
            <TipoTag>{vinho ? 'Vinho' : 'Drink'}</TipoTag>
            {vinho && bebida.tipoVinho && <TipoTag>{bebida.tipoVinho}</TipoTag>}
            {!vinho && bebida.baseAlcoolica && <TipoTag>{bebida.baseAlcoolica}</TipoTag>}
            {bebida.criadoUser && <TipoTag>Cadastrada pela comunidade</TipoTag>}
          </div>
          <h1 className="hyphens-auto break-words font-display-lg text-[36px] leading-[1.05] sm:text-[44px] md:text-[64px] xl:text-[84px]">{bebida.nome}</h1>
          {bebida.descricao && (
            <p className="mt-3 max-w-2xl text-on-surface-variant sm:mt-5 sm:font-body-lg sm:text-body-lg">{bebida.descricao}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 sm:mt-6">
            <div className="flex items-center gap-2">
              <Estrelas nota={bebida.notaMedia} tamanho="text-xl" />
              <span className="font-headline-md text-headline-md text-primary">{formatarNota(bebida.notaMedia)}</span>
            </div>
            <span className="text-sm text-on-surface-variant">
              {bebida._count.avaliacoes} {bebida._count.avaliacoes === 1 ? 'avaliação' : 'avaliações'}
            </span>
          </div>
          {usuario && !carregandoMinha && (
            <button onClick={irParaAvaliacao} className="btn-primary mt-6 sm:mt-8">
              <Icon name={minha ? 'edit' : 'star'} fill={!minha} /> {minha ? 'Editar minha avaliação' : 'Avaliar esta bebida'}
            </button>
          )}
        </div>
      </section>

      <div className="mx-auto grid max-w-container-max grid-cols-1 2xl:max-w-[1560px] gap-10 px-5 py-10 sm:gap-12 sm:py-14 md:px-10 xl:px-margin-desktop xl:grid-cols-12">
        {/* coluna principal */}
        <div className="space-y-10 sm:space-y-14 xl:col-span-7">
          <section>
            <div className="mb-4 flex items-center gap-3 sm:mb-6 sm:gap-4">
              <div className="h-px w-8 shrink-0 bg-primary sm:w-12" />
              <h2 className="font-display-lg text-headline-lg-mobile text-primary md:text-headline-lg">{vinho ? 'O rótulo' : 'Ingredientes'}</h2>
            </div>
            <div className="space-y-4">
              {vinho ? (
                <>
                  <Info rotulo="Uva" valor={bebida.uva} icone="nutrition" />
                  <Info rotulo="País de origem" valor={bebida.paisOrigem} icone="public" />
                  <Info rotulo="Estilo" valor={capitalizar(bebida.tipoVinho)} icone="wine_bar" />
                </>
              ) : (
                <>
                  <Info rotulo="Base alcoólica" valor={bebida.baseAlcoolica} icone="liquor" />
                  {ingredientes.length > 0 && (
                    <ul className="flex flex-wrap gap-2" aria-label="Ingredientes">
                      {ingredientes.map((ing) => (
                        <li key={ing} className="glass-card flex items-center gap-2 rounded-full px-4 py-2">
                          <Icon name="water_drop" className="text-lg text-primary" />
                          <span className="first-letter:uppercase">{ing}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center gap-3 sm:mb-6 sm:gap-4">
              <div className="h-px w-8 shrink-0 bg-primary sm:w-12" />
              <h2 className="font-display-lg text-headline-lg-mobile text-primary md:text-headline-lg">Onde encontrar</h2>
            </div>
            {bebida.locais.length === 0 ? (
              <p className="text-on-surface-variant">Nenhum local cadastrado serve esta bebida ainda.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {bebida.locais.map(({ local }) => (
                  <Link
                    key={local.id}
                    to={`/locais/${local.id}`}
                    className="glass-card glass-card-hover flex items-start gap-4 rounded-2xl p-5"
                  >
                    <Icon name="location_on" fill className="text-2xl text-primary" />
                    <div>
                      <p className="font-headline-md text-[20px]">{local.nome}</p>
                      <p className="text-sm text-on-surface-variant">{local.endereco}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* coluna lateral */}
        <aside className="space-y-10 xl:col-span-5">
          <div className="glass-card shine-border space-y-6 rounded-[32px] p-6 sm:p-8 xl:sticky xl:top-8">
            <div>
              <h2 className="font-display-lg text-headline-md">Arquitetura de sabor</h2>
              <p className="text-sm text-on-surface-variant">O perfil sensorial usado pelo algoritmo de recomendação</p>
            </div>
            {atributos.map((a) => (
              <BarraSabor key={a.chave} rotulo={a.rotulo} valor={a.valor} destaque={a.valor === maior && maior > 0} />
            ))}
          </div>

          <section id="avaliar" className="scroll-mt-20 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display-lg text-headline-lg-mobile md:text-headline-lg">Avaliações</h2>
              {minha && !editando && (
                <button onClick={() => setEditando(true)} className="text-sm text-primary hover:underline">
                  Editar a minha
                </button>
              )}
            </div>

            {usuario && !carregandoMinha && (!minha || editando) && (
              <AvaliacaoForm
                bebidaId={bebida.id}
                existente={editando ? minha : null}
                onSalvo={aoSalvar}
                onCancelar={editando ? () => setEditando(false) : undefined}
              />
            )}

            {acabouDeAvaliar && (
              <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-5" role="status">
                <p className="flex items-center gap-2 text-on-surface">
                  <Icon name="check_circle" fill className="text-primary" /> Avaliação salva! Seu perfil de paladar foi
                  atualizado.
                </p>
                <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                  Ver minhas novas recomendações <Icon name="arrow_forward" className="text-base" />
                </Link>
              </div>
            )}

            {bebida.avaliacoes.length === 0 ? (
              <p className="text-on-surface-variant">Ninguém avaliou ainda. Seja o primeiro!</p>
            ) : (
              bebida.avaliacoes.map((a) => (
                <article key={a.id} className="glass-card space-y-3 rounded-2xl p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-variant font-label-md text-primary">
                        {a.user?.nome?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="font-label-md text-label-md">
                          {a.user?.nome ?? 'Usuário'}
                          {a.userId === usuario?.id && <span className="ml-2 text-xs text-primary">(você)</span>}
                        </p>
                        <p className="text-xs text-outline">{formatarData(a.data)}</p>
                      </div>
                    </div>
                    <Estrelas nota={a.nota} tamanho="text-sm" />
                  </div>
                  {a.comentario && <p className="font-headline-md text-[17px] italic text-on-surface-variant">“{a.comentario}”</p>}
                </article>
              ))
            )}
            {bebida._count.avaliacoes > bebida.avaliacoes.length && (
              <p className="text-xs text-outline">Exibindo as {bebida.avaliacoes.length} avaliações mais recentes.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
