// mapa interativo dos locais (RF19) com Leaflet + OpenStreetMap
import L from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { ErroBox, Icon, LocalImagem, Spinner, TipoTag } from '../components/ui';
import { useFetch } from '../hooks/useFetch';
import { api } from '../lib/api';
import { capitalizar } from '../lib/sabor';
import type { LocalComBebidas } from '../lib/types';

// centro padrão: Campinas/SP
const CENTRO_PADRAO: [number, number] = [-22.9007, -47.0573];

const iconeLocal = (ativo: boolean) =>
  L.divIcon({
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -36],
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${ativo ? 40 : 32}px;height:${ativo ? 40 : 32}px;margin:${ativo ? 0 : 4}px;border-radius:9999px;background:${ativo ? '#ffb876' : 'rgba(14,14,15,0.85)'};border:1px solid ${ativo ? '#ffb876' : 'rgba(255,184,118,0.5)'};box-shadow:0 0 14px rgba(212,140,69,0.6);color:${ativo ? '#2d1600' : '#ffb876'}"><span class="material-symbols-outlined icon-fill" style="font-size:${ativo ? 22 : 18}px">local_bar</span></div>`,
  });

const iconeUsuario = L.divIcon({
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#ffb59d;border:3px solid #0A0A0B;box-shadow:0 0 0 6px rgba(255,181,157,0.25)"></div>',
});

// move o mapa quando o alvo muda (geolocalização ou clique na lista)
function Voar({ alvo, zoom }: { alvo: [number, number] | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (alvo) map.flyTo(alvo, zoom, { duration: 0.8 });
  }, [alvo, zoom, map]);
  return null;
}

export default function MapaPage() {
  const { dados: locais, carregando, erro, recarregar } = useFetch(
    (signal) => api<LocalComBebidas[]>('/locais', { signal }),
    []
  );
  const [tipo, setTipo] = useState('');
  const [busca, setBusca] = useState('');
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [posicaoUsuario, setPosicaoUsuario] = useState<[number, number] | null>(null);
  const [alvo, setAlvo] = useState<{ coords: [number, number]; zoom: number } | null>(null);
  const [avisoGeo, setAvisoGeo] = useState('');
  const marcadores = useRef<Record<string, L.Marker | null>>({});

  // centraliza na posição do usuário, se ele permitir
  useEffect(() => {
    if (!navigator.geolocation) {
      setAvisoGeo('Geolocalização indisponível; mostrando Campinas.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setPosicaoUsuario(coords);
        setAlvo({ coords, zoom: 13 });
      },
      () => setAvisoGeo('Localização não permitida; mostrando Campinas.'),
      { timeout: 8000 }
    );
  }, []);

  const tipos = useMemo(
    () => Array.from(new Set((locais ?? []).map((l) => l.tipo).filter(Boolean))) as string[],
    [locais]
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (locais ?? []).filter(
      (l) =>
        l.latitude !== null &&
        l.longitude !== null &&
        (!tipo || l.tipo === tipo) &&
        (!termo ||
          l.nome.toLowerCase().includes(termo) ||
          l.bebidas.some((b) => b.nome.toLowerCase().includes(termo)))
    );
  }, [locais, tipo, busca]);

  function focar(local: LocalComBebidas) {
    setSelecionado(local.id);
    setAlvo({ coords: [local.latitude!, local.longitude!], zoom: 15 });
    setTimeout(() => marcadores.current[local.id]?.openPopup(), 850);
  }

  if (carregando) return <Spinner texto="Carregando mapa..." />;
  if (erro) {
    return (
      <div className="p-10">
        <ErroBox mensagem={erro.message} onTentar={recarregar} />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:h-screen lg:flex-row">
      {/* no mobile a altura precisa ser fixa: flex-1 numa coluna sem altura definida zera o mapa */}
      <div className="relative h-[55vh] h-[55dvh] flex-none lg:h-full lg:flex-1">
        <MapContainer center={CENTRO_PADRAO} zoom={13} className="h-full w-full" zoomControl={false}>
          {/* tiles padrão do OSM escurecidos via css (.tiles-escuros) para seguir o tema */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="tiles-escuros"
          />
          <Voar alvo={alvo?.coords ?? null} zoom={alvo?.zoom ?? 13} />
          {posicaoUsuario && <Marker position={posicaoUsuario} icon={iconeUsuario} />}
          {filtrados.map((l) => (
            <Marker
              key={l.id}
              position={[l.latitude!, l.longitude!]}
              icon={iconeLocal(l.id === selecionado)}
              eventHandlers={{ click: () => setSelecionado(l.id) }}
              ref={(m) => {
                marcadores.current[l.id] = m;
              }}
            >
              <Popup>
                <div className="min-w-[200px] space-y-2">
                  <div className="h-24 overflow-hidden rounded-lg">
                    <LocalImagem local={l} />
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-[#d48c45]">{l.tipo ?? 'local'}</p>
                  <p className="font-headline-md text-lg leading-tight text-[#ffb876]">{l.nome}</p>
                  {l.bebidas.length > 0 && (
                    <p className="text-xs text-[#d7c3b3]">
                      {l.bebidas.slice(0, 5).map((b) => b.nome).join(' · ')}
                      {l.bebidas.length > 5 && ` +${l.bebidas.length - 5}`}
                    </p>
                  )}
                  <Link to={`/locais/${l.id}`} className="inline-block text-xs font-bold uppercase tracking-widest !text-[#ffb876]">
                    Ver bebidas do local →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* filtros flutuantes */}
        <div className="pointer-events-none absolute left-4 right-4 top-4 z-[500] flex flex-wrap items-center gap-2 md:left-6 md:top-6">
          <div className="glass-panel pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-primary">
            <Icon name="tune" /> <span className="font-label-sm text-label-sm uppercase tracking-widest">Ambiente</span>
          </div>
          {['', ...tipos].map((t) => (
            <button
              key={t || 'todos'}
              onClick={() => setTipo(t)}
              className={`pointer-events-auto rounded-full px-4 py-2 font-label-sm text-label-sm uppercase tracking-wider backdrop-blur-xl transition-all ${
                tipo === t ? 'bg-primary text-on-primary' : 'glass-panel text-on-surface-variant hover:text-primary'
              }`}
            >
              {t ? capitalizar(t) : 'Todos'}
            </button>
          ))}
        </div>

        {posicaoUsuario && (
          <button
            onClick={() => setAlvo({ coords: posicaoUsuario, zoom: 14 })}
            className="glass-panel absolute bottom-6 left-6 z-[500] flex h-12 w-12 items-center justify-center rounded-xl text-primary"
            aria-label="Centralizar na minha localização"
          >
            <Icon name="my_location" />
          </button>
        )}
      </div>

      {/* painel de resultados */}
      <aside className="flex w-full flex-col border-l border-surface-variant/10 bg-surface-container-lowest lg:h-full lg:w-[400px]">
        <div className="space-y-4 border-b border-surface-variant/10 p-6">
          <div>
            <h1 className="font-display-lg text-headline-md">Descubra</h1>
            <p className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
              {filtrados.length} {filtrados.length === 1 ? 'local' : 'locais'}
              {avisoGeo && ` · ${avisoGeo}`}
            </p>
          </div>
          <label className="relative flex items-center">
            <Icon name="search" className="absolute left-4 text-outline" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou bebida..."
              className="w-full rounded-full border border-surface-variant/30 bg-surface-container-low py-3 pl-12 pr-4 text-sm placeholder:text-outline focus:border-primary focus:outline-none focus:ring-0"
            />
          </label>
        </div>

        <ul className="flex-1 space-y-4 overflow-y-auto p-6">
          {filtrados.length === 0 && <li className="text-on-surface-variant">Nenhum local encontrado com esses filtros.</li>}
          {filtrados.map((l) => {
            const ativo = l.id === selecionado;
            return (
              <li key={l.id}>
                <button
                  onClick={() => focar(l)}
                  className={`w-full rounded-2xl border p-5 text-left transition-all ${
                    ativo
                      ? 'border-primary/40 bg-surface-container-high'
                      : 'border-transparent bg-surface-container-low hover:border-primary/20'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                      <LocalImagem local={l} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className={`font-headline-md text-[20px] leading-tight ${ativo ? 'text-primary' : ''}`}>{l.nome}</h2>
                        {l.tipo && <TipoTag>{l.tipo}</TipoTag>}
                      </div>
                      {l.descricao && <p className="mt-2 line-clamp-2 text-sm text-on-surface-variant">{l.descricao}</p>}
                      <p className="mt-3 flex items-center gap-1 text-xs text-outline">
                        <Icon name="local_bar" className="text-sm text-primary" /> {l.bebidas.length} bebidas
                      </p>
                    </div>
                  </div>
                </button>
                {ativo && (
                  <Link
                    to={`/locais/${l.id}`}
                    className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary/10 py-3 font-label-sm text-label-sm uppercase tracking-widest text-primary"
                  >
                    Ver bebidas do local <Icon name="arrow_forward" className="text-base" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
