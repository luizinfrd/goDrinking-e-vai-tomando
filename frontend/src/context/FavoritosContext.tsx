// lista "quero provar" carregada uma vez e compartilhada por cards, detalhe e Meu Bar
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import type { Favorito } from '../lib/types';

type FavoritosValue = {
  favoritos: Favorito[];
  ehFavorito: (bebidaId: string) => boolean;
  alternar: (bebidaId: string) => Promise<void>;
};

const FavoritosContext = createContext<FavoritosValue | null>(null);

export function FavoritosProvider({ children }: { children: ReactNode }) {
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);

  useEffect(() => {
    const controle = new AbortController();
    api<Favorito[]>('/favoritos', { signal: controle.signal })
      .then(setFavoritos)
      .catch(() => undefined);
    return () => controle.abort();
  }, []);

  const ids = useMemo(() => new Set(favoritos.map((f) => f.id)), [favoritos]);
  const ehFavorito = useCallback((bebidaId: string) => ids.has(bebidaId), [ids]);

  // atualização otimista: o coração responde na hora e volta atrás se a API falhar
  const alternar = useCallback(
    async (bebidaId: string) => {
      const anterior = favoritos;
      if (ids.has(bebidaId)) {
        setFavoritos((lista) => lista.filter((f) => f.id !== bebidaId));
        await api(`/favoritos/${bebidaId}`, { method: 'DELETE' }).catch((e) => {
          setFavoritos(anterior);
          throw e;
        });
      } else {
        const novo = await api<Favorito>(`/favoritos/${bebidaId}`, { method: 'POST' });
        setFavoritos((lista) => [novo, ...lista.filter((f) => f.id !== bebidaId)]);
      }
    },
    [favoritos, ids]
  );

  const valor = useMemo(() => ({ favoritos, ehFavorito, alternar }), [favoritos, ehFavorito, alternar]);
  return <FavoritosContext.Provider value={valor}>{children}</FavoritosContext.Provider>;
}

export function useFavoritos() {
  const contexto = useContext(FavoritosContext);
  if (!contexto) throw new Error('useFavoritos deve ser usado dentro de <FavoritosProvider>');
  return contexto;
}
