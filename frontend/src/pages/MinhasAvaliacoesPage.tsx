// diário de degustação (B8): histórico do usuário (RF05) em linha do tempo, com edição e exclusão (RF16, RF17)
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pagina } from '../components/Pagina';
import { AvaliacaoForm } from '../components/AvaliacaoForm';
import { BebidaImagem, EstadoVazio, ErroBox, Estrelas, Icon, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { api, mensagemDeErro } from '../lib/api';
import { formatarData } from '../lib/sabor';
import type { Avaliacao } from '../lib/types';

// agrupa por mês mantendo a ordem (a API já entrega da mais recente para a mais antiga)
function porMes(avaliacoes: Avaliacao[]) {
  const grupos: { mes: string; itens: Avaliacao[] }[] = [];
  for (const a of avaliacoes) {
    const mes = new Date(a.data).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const atual = grupos[grupos.length - 1];
    if (atual?.mes === mes) atual.itens.push(a);
    else grupos.push({ mes, itens: [a] });
  }
  return grupos;
}

export default function MinhasAvaliacoesPage() {
  const { refreshMe } = useAuth();
  const [editando, setEditando] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState('');

  const { dados: avaliacoes, setDados, carregando, erro, recarregar } = useFetch(
    (signal) => api<Avaliacao[]>('/avaliacoes/minhas', { signal }),
    []
  );

  const meses = useMemo(() => porMes(avaliacoes ?? []), [avaliacoes]);

  async function excluir(a: Avaliacao) {
    if (!window.confirm(`Excluir sua avaliação de ${a.bebida?.nome}? Seu perfil de paladar será recalculado.`)) return;
    setErroAcao('');
    try {
      await api(`/avaliacoes/${a.id}`, { method: 'DELETE' });
      setDados((lista) => lista?.filter((x) => x.id !== a.id) ?? null);
      refreshMe().catch(() => undefined);
    } catch (err) {
      setErroAcao(mensagemDeErro(err));
    }
  }

  function aoSalvar(atualizada: Avaliacao) {
    setDados((lista) => lista?.map((x) => (x.id === atualizada.id ? { ...x, ...atualizada, bebida: x.bebida, local: atualizada.local ?? x.local } : x)) ?? null);
    setEditando(null);
    refreshMe().catch(() => undefined);
  }

  return (
    <Pagina>
      <span className="eyebrow">Histórico</span>
      <h1 className="mt-3 font-display-lg text-headline-lg-mobile md:text-display-lg">Diário de degustação</h1>
      <p className="mt-3 max-w-2xl text-on-surface-variant md:mt-4">
        Tudo o que você provou, mês a mês, com onde bebeu e a foto do momento. Cada avaliação ajusta seu vetor de preferências;
        editar ou excluir também recalcula suas recomendações.
      </p>

      {erroAcao && <p className="mt-6 text-sm text-error">{erroAcao}</p>}

      <div className="mt-6 md:mt-10">
        {carregando ? (
          <Spinner />
        ) : erro ? (
          <ErroBox mensagem={erro.message} onTentar={recarregar} />
        ) : !avaliacoes || avaliacoes.length === 0 ? (
          <EstadoVazio
            icone="rate_review"
            titulo="Nenhuma avaliação ainda"
            texto="Prove uma das bebidas recomendadas e conte o que achou. Suas avaliações refinam as próximas sugestões."
            acao={
              <Link to="/" className="btn-primary">
                <Icon name="auto_awesome" /> Ver recomendações
              </Link>
            }
          />
        ) : (
          <div className="space-y-10">
            {meses.map(({ mes, itens }) => (
              <section key={mes} aria-label={mes}>
                <h2 className="mb-4 flex items-center gap-3 font-display-lg text-headline-md capitalize text-primary">
                  <Icon name="calendar_month" /> {mes}
                  <span className="font-body-md text-sm normal-case text-outline">
                    · {itens.length} {itens.length === 1 ? 'bebida' : 'bebidas'}
                  </span>
                </h2>
                <ul className="space-y-4 border-l border-primary/20 pl-4 sm:pl-6">
            {itens.map((a) => (
              <li key={a.id} className="glass-card overflow-hidden rounded-2xl">
                <div className="flex items-start gap-4 p-4 sm:items-center sm:gap-5 sm:p-5">
                  <Link to={`/bebidas/${a.bebidaId}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl sm:h-20 sm:w-20">
                    {a.bebida && <BebidaImagem bebida={a.bebida} />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/bebidas/${a.bebidaId}`} className="-my-3 block py-3 font-headline-md text-lg leading-tight hover:text-primary sm:text-headline-md">
                      {a.bebida?.nome}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-outline sm:text-sm">
                      <Estrelas nota={a.nota} tamanho="text-sm" />
                      <span>{formatarData(a.data)}</span>
                      <span className="uppercase tracking-widest">{a.bebida?.tipo}</span>
                    </div>
                    {a.comentario && <p className="mt-2 line-clamp-2 text-sm italic text-on-surface-variant sm:line-clamp-none sm:text-body-md">“{a.comentario}”</p>}
                    {(a.local || a.fotoUrl) && (
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
                        {a.local && (
                          <Link to={`/locais/${a.local.id}`} className="flex min-h-11 items-center gap-1 hover:text-primary">
                            <Icon name="location_on" className="text-base text-primary" /> {a.local.nome}
                          </Link>
                        )}
                        {a.fotoUrl && (
                          <a href={a.fotoUrl} target="_blank" rel="noreferrer" className="block h-14 w-14 overflow-hidden rounded-lg border border-surface-variant/30">
                            <img src={a.fotoUrl} alt={`Foto de ${a.bebida?.nome ?? 'bebida'}`} loading="lazy" className="h-full w-full object-cover" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="-my-1 -mr-2 flex shrink-0 flex-col sm:m-0 sm:flex-row sm:gap-2">
                    <button
                      onClick={() => setEditando(editando === a.id ? null : a.id)}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant/30 hover:text-primary"
                      aria-label="Editar avaliação"
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      onClick={() => excluir(a)}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant/30 hover:text-error"
                      aria-label="Excluir avaliação"
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                </div>
                {editando === a.id && (
                  <div className="border-t border-surface-variant/20 p-5">
                    <AvaliacaoForm bebidaId={a.bebidaId} existente={a} onSalvo={aoSalvar} onCancelar={() => setEditando(null)} />
                  </div>
                )}
              </li>
            ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </Pagina>
  );
}
