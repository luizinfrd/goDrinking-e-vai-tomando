// histórico do usuário (RF05) com edição e exclusão (RF16, RF17)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AvaliacaoForm } from '../components/AvaliacaoForm';
import { BebidaImagem, EstadoVazio, ErroBox, Estrelas, Icon, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { api, mensagemDeErro } from '../lib/api';
import { formatarData } from '../lib/sabor';
import type { Avaliacao } from '../lib/types';

export default function MinhasAvaliacoesPage() {
  const { refreshMe } = useAuth();
  const [editando, setEditando] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState('');

  const { dados: avaliacoes, setDados, carregando, erro, recarregar } = useFetch(
    (signal) => api<Avaliacao[]>('/avaliacoes/minhas', { signal }),
    []
  );

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
    setDados((lista) => lista?.map((x) => (x.id === atualizada.id ? { ...x, ...atualizada, bebida: x.bebida } : x)) ?? null);
    setEditando(null);
    refreshMe().catch(() => undefined);
  }

  return (
    <div className="mx-auto max-w-container-max px-5 py-12 md:px-margin-desktop">
      <span className="eyebrow">Histórico</span>
      <h1 className="mt-3 font-display-lg text-headline-lg-mobile md:text-display-lg">Minhas avaliações</h1>
      <p className="mt-4 max-w-2xl text-on-surface-variant">
        Cada avaliação ajusta seu vetor de preferências. Editar ou excluir também recalcula suas recomendações.
      </p>

      {erroAcao && <p className="mt-6 text-sm text-error">{erroAcao}</p>}

      <div className="mt-10">
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
          <ul className="space-y-4">
            {avaliacoes.map((a) => (
              <li key={a.id} className="glass-card overflow-hidden rounded-2xl">
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
                  <Link to={`/bebidas/${a.bebidaId}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    {a.bebida && <BebidaImagem bebida={a.bebida} />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/bebidas/${a.bebidaId}`} className="font-headline-md text-headline-md hover:text-primary">
                      {a.bebida?.nome}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-outline">
                      <Estrelas nota={a.nota} tamanho="text-sm" />
                      <span>{formatarData(a.data)}</span>
                      <span className="uppercase tracking-widest">{a.bebida?.tipo}</span>
                    </div>
                    {a.comentario && <p className="mt-2 italic text-on-surface-variant">“{a.comentario}”</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditando(editando === a.id ? null : a.id)}
                      className="rounded-full p-2 text-on-surface-variant hover:bg-surface-variant/30 hover:text-primary"
                      aria-label="Editar avaliação"
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      onClick={() => excluir(a)}
                      className="rounded-full p-2 text-on-surface-variant hover:bg-surface-variant/30 hover:text-error"
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
        )}
      </div>
    </div>
  );
}
