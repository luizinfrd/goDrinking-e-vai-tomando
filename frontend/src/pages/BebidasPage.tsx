// catálogo de bebidas com busca em tempo real e filtro por tipo (RF07, RF08)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BebidaCard } from '../components/BebidaCard';
import { EstadoVazio, ErroBox, GradeSkeleton, Icon } from '../components/ui';
import { useDebounce, useFetch } from '../hooks/useFetch';
import { api } from '../lib/api';
import type { Bebida } from '../lib/types';

type Filtro = '' | 'drink' | 'vinho';

const FILTROS: { valor: Filtro; rotulo: string }[] = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'drink', rotulo: 'Drinks' },
  { valor: 'vinho', rotulo: 'Vinhos' },
];

export default function BebidasPage() {
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<Filtro>('');
  const termo = useDebounce(busca.trim(), 300);

  const { dados: bebidas, carregando, erro, recarregar } = useFetch(
    (signal) => api<Bebida[]>('/bebidas', { query: { nome: termo, tipo }, signal }),
    [termo, tipo]
  );

  return (
    <div className="mx-auto max-w-container-max px-5 py-12 md:px-10 xl:px-margin-desktop">
      <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <span className="eyebrow">Enciclopédia</span>
          <h1 className="mt-3 font-display-lg text-headline-lg-mobile md:text-display-lg">Catálogo de bebidas</h1>
          <p className="mt-4 font-body-lg text-body-lg text-on-surface-variant">
            Drinks clássicos e vinhos do mundo, com o perfil sensorial de cada um. Ordenados pela avaliação da comunidade.
          </p>
        </div>
        <Link to="/bebidas/nova" className="btn-ghost shrink-0">
          <Icon name="add" /> Cadastrar bebida
        </Link>
      </header>

      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <label className="relative flex w-full items-center md:max-w-md">
          <Icon name="search" className="absolute left-4 text-outline" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="input-busca text-body-md text-on-surface"
            aria-label="Buscar bebida por nome"
          />
        </label>
        <div className="flex items-center gap-2">
          <span className="mr-2 hidden font-label-sm text-label-sm uppercase tracking-widest text-outline md:inline">Tipo:</span>
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              onClick={() => setTipo(f.valor)}
              aria-pressed={tipo === f.valor}
              className={`chip ${tipo === f.valor ? 'chip-active' : ''}`}
            >
              {f.rotulo}
            </button>
          ))}
        </div>
      </div>

      {carregando && !bebidas ? (
        <GradeSkeleton rotulo="Carregando bebidas" />
      ) : erro ? (
        <ErroBox mensagem={erro.message} onTentar={recarregar} />
      ) : !bebidas || bebidas.length === 0 ? (
        <EstadoVazio
          icone="search_off"
          titulo="Nenhuma bebida encontrada"
          texto={termo ? `Não encontramos nada para "${termo}". Que tal cadastrá-la?` : 'O catálogo ainda está vazio.'}
          acao={
            <Link to="/bebidas/nova" className="btn-primary">
              <Icon name="add" /> Cadastrar bebida
            </Link>
          }
        />
      ) : (
        <>
          <p className="mb-6 font-label-sm text-label-sm uppercase tracking-widest text-outline">
            {bebidas.length} {bebidas.length === 1 ? 'bebida' : 'bebidas'}
          </p>
          <div className={`grid gap-6 sm:grid-cols-2 xl:grid-cols-3 ${carregando ? 'opacity-60' : ''}`}>
            {bebidas.map((b) => (
              <BebidaCard
                key={b.id}
                bebida={b}
                rodape={
                  <span className="text-xs text-outline">
                    {b._count?.avaliacoes ?? 0} {b._count?.avaliacoes === 1 ? 'avaliação' : 'avaliações'}
                  </span>
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
