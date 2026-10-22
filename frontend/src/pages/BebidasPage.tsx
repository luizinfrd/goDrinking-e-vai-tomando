// catálogo de bebidas com busca em tempo real e filtro por tipo (RF07, RF08)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BebidaCard } from '../components/BebidaCard';
import { Pagina } from '../components/Pagina';
import { EstadoVazio, ErroBox, GradeSkeleton, Icon } from '../components/ui';
import { useDebounce, useFetch } from '../hooks/useFetch';
import { api } from '../lib/api';
import { filtrosDeTipo, FiltroTipo } from '../lib/filtros';
import type { Bebida } from '../lib/types';

const FILTROS = filtrosDeTipo('Todas');

export default function BebidasPage() {
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<FiltroTipo>('');
  const termo = useDebounce(busca.trim(), 300);

  const { dados: bebidas, carregando, erro, recarregar } = useFetch(
    (signal) => api<Bebida[]>('/bebidas', { query: { nome: termo, tipo }, signal }),
    [termo, tipo]
  );

  return (
    <Pagina>
      <header className="mb-6 flex flex-col justify-between gap-5 md:mb-10 md:flex-row md:items-end md:gap-6">
        <div className="max-w-2xl">
          <span className="eyebrow">Enciclopédia</span>
          <h1 className="mt-3 font-display-lg text-headline-lg-mobile md:text-display-lg">Catálogo de bebidas</h1>
          <p className="mt-3 text-on-surface-variant md:mt-4 md:font-body-lg md:text-body-lg">
            Drinks clássicos e vinhos do mundo, com o perfil sensorial de cada um. Ordenados pela avaliação da comunidade.
          </p>
        </div>
        <Link to="/bebidas/nova" className="btn-ghost shrink-0 self-start md:self-auto">
          <Icon name="add" /> Cadastrar bebida
        </Link>
      </header>

      <div className="mb-6 flex flex-col gap-3 md:mb-10 md:flex-row md:items-center md:justify-between md:gap-4">
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
        <div className="flex flex-wrap items-center gap-2">
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
          <p className="mb-4 font-label-sm md:mb-6 text-label-sm uppercase tracking-widest text-outline">
            {bebidas.length} {bebidas.length === 1 ? 'bebida' : 'bebidas'}
          </p>
          <div className={`grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-3 2xl:grid-cols-4 ${carregando ? 'opacity-60' : ''}`}>
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
    </Pagina>
  );
}
