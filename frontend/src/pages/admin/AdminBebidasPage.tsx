// manutenção do catálogo de bebidas (B13): editar e excluir, incluindo sugestões da comunidade
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pagina } from '../../components/Pagina';
import { ErroBox, Icon, Spinner, TipoTag } from '../../components/ui';
import { useDebounce, useFetch } from '../../hooks/useFetch';
import { api, mensagemDeErro } from '../../lib/api';
import { formatarNota, subtituloBebida } from '../../lib/sabor';
import type { Bebida } from '../../lib/types';

export default function AdminBebidasPage() {
  const [busca, setBusca] = useState('');
  const [soComunidade, setSoComunidade] = useState(false);
  const [erroAcao, setErroAcao] = useState('');
  const termo = useDebounce(busca.trim(), 300);
  const { dados: bebidas, setDados, carregando, erro, recarregar } = useFetch(
    (signal) => api<Bebida[]>('/bebidas', { query: { nome: termo }, signal }),
    [termo]
  );

  async function excluir(b: Bebida) {
    if (!window.confirm(`Excluir "${b.nome}"? As avaliações dela também serão apagadas.`)) return;
    setErroAcao('');
    try {
      await api(`/bebidas/${b.id}`, { method: 'DELETE' });
      setDados((lista) => lista?.filter((x) => x.id !== b.id) ?? null);
    } catch (e) {
      setErroAcao(mensagemDeErro(e));
    }
  }

  const visiveis = (bebidas ?? []).filter((b) => !soComunidade || b.criadoUser);

  return (
    <Pagina>
      <span className="eyebrow">Administração</span>
      <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg">Bebidas</h1>
        <Link to="/bebidas/nova" className="btn-primary self-start">
          <Icon name="add" /> Nova bebida
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative flex w-full items-center md:max-w-md">
          <Icon name="search" className="absolute left-4 text-outline" />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome..." className="input-busca" aria-label="Buscar bebida" />
        </label>
        <button onClick={() => setSoComunidade((v) => !v)} aria-pressed={soComunidade} className={`chip ${soComunidade ? 'chip-active' : ''}`}>
          Só sugestões da comunidade
        </button>
      </div>

      {erroAcao && <p className="mt-4 text-sm text-error" role="alert">{erroAcao}</p>}

      <div className="mt-6">
        {carregando && !bebidas ? (
          <Spinner />
        ) : erro ? (
          <ErroBox mensagem={erro.message} onTentar={recarregar} />
        ) : (
          <ul className="divide-y divide-surface-variant/20 rounded-2xl border border-surface-variant/20">
            {visiveis.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <Link to={`/bebidas/${b.id}`} className="font-headline-md text-lg hover:text-primary">
                    {b.nome}
                  </Link>
                  <p className="text-xs uppercase tracking-widest text-outline">
                    {subtituloBebida(b)} · ★ {formatarNota(b.notaMedia)} · {b._count?.avaliacoes ?? 0} aval.
                    {b.percepcao?.assertividade != null && ` · ${b.percepcao.assertividade}% fiel`}
                  </p>
                </div>
                {b.criadoUser && <TipoTag>Comunidade</TipoTag>}
                <Link to={`/bebidas/${b.id}/editar`} className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:text-primary" aria-label={`Editar ${b.nome}`}>
                  <Icon name="edit" />
                </Link>
                <button onClick={() => excluir(b)} className="flex h-11 w-11 items-center justify-center rounded-full text-on-surface-variant hover:text-error" aria-label={`Excluir ${b.nome}`}>
                  <Icon name="delete" />
                </button>
              </li>
            ))}
            {visiveis.length === 0 && <li className="p-6 text-on-surface-variant">Nenhuma bebida encontrada.</li>}
          </ul>
        )}
      </div>
    </Pagina>
  );
}
