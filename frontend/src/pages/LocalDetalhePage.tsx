// detalhe do local com as bebidas disponíveis
import { Link, useParams } from 'react-router-dom';
import { Pagina } from '../components/Pagina';
import { BebidaCard } from '../components/BebidaCard';
import { BotaoCompartilhar } from '../components/BotaoCompartilhar';
import { EstadoVazio, ErroBox, Icon, LocalImagem, Spinner, TipoTag } from '../components/ui';
import { useFetch } from '../hooks/useFetch';
import { api } from '../lib/api';
import { formatarPreco } from '../lib/sabor';
import type { LocalComBebidas } from '../lib/types';

export default function LocalDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { dados: local, carregando, erro, recarregar } = useFetch(
    (signal) => api<LocalComBebidas>(`/locais/${id}`, { signal }),
    [id]
  );

  if (carregando) return <Spinner />;
  if (erro || !local) {
    return (
      <div className="p-10">
        <ErroBox mensagem={erro?.message ?? 'Local não encontrado'} onTentar={recarregar} />
      </div>
    );
  }

  const linkMapa =
    local.latitude !== null && local.longitude !== null
      ? `https://www.openstreetmap.org/?mlat=${local.latitude}&mlon=${local.longitude}#map=17/${local.latitude}/${local.longitude}`
      : null;

  return (
    <Pagina>
      <Link to="/mapa" className="mb-3 inline-flex min-h-11 items-center gap-2 md:mb-6 text-on-surface-variant hover:text-primary">
        <Icon name="arrow_back" /> Mapa
      </Link>

      <header className="glass-panel ambient-glow relative overflow-hidden rounded-3xl p-6 sm:p-8 md:p-12">
        <div className="absolute inset-0">
          <LocalImagem local={local} className="brightness-[0.4]" />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-transparent" />
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />
        <div className="relative pt-16 md:pt-32">
          <div className="flex flex-wrap gap-2">
            {local.tipo && <TipoTag>{local.tipo}</TipoTag>}
            {local.faixaPreco && <TipoTag>{formatarPreco(local.faixaPreco)}</TipoTag>}
          </div>
          <h1 className="mt-4 font-display-lg text-headline-lg-mobile md:text-display-lg">{local.nome}</h1>
          {local.descricao && <p className="mt-3 max-w-2xl text-on-surface-variant md:mt-4 md:font-body-lg md:text-body-lg">{local.descricao}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-on-surface-variant">
            {local.endereco && (
              <span className="flex items-center gap-2">
                <Icon name="location_on" className="text-primary" /> {local.endereco}
              </span>
            )}
            {linkMapa && (
              <a href={linkMapa} target="_blank" rel="noreferrer" className="flex min-h-11 items-center gap-2 text-primary hover:underline">
                <Icon name="near_me" /> Como chegar
              </a>
            )}
            <BotaoCompartilhar titulo={local.nome} texto={`${local.nome} no goDrinking`} caminho={`/locais/${local.id}`} />
          </div>
        </div>
      </header>

      <section className="mt-10 md:mt-14">
        <h2 className="font-display-lg text-headline-lg-mobile md:text-headline-lg">Bebidas disponíveis</h2>
        <p className="mt-2 text-on-surface-variant">Ordenadas pela avaliação média da comunidade.</p>
        <div className="mt-6 md:mt-8">
          {local.bebidas.length === 0 ? (
            <EstadoVazio icone="no_drinks" titulo="Nenhuma bebida cadastrada" texto="Este local ainda não tem bebidas associadas." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-3 2xl:grid-cols-4">
              {local.bebidas.map((b) => (
                <BebidaCard key={b.id} bebida={b} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Pagina>
  );
}
