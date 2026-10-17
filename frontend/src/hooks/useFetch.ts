// carrega dados da API com estados de loading/erro e permite recarregar
import { DependencyList, useCallback, useEffect, useState } from 'react';
import { ApiError, mensagemDeErro } from '../lib/api';

export function useFetch<T>(buscar: (signal: AbortSignal) => Promise<T>, deps: DependencyList) {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ApiError | Error | null>(null);
  const [versao, setVersao] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const buscarMemo = useCallback(buscar, deps);

  useEffect(() => {
    const controle = new AbortController();
    setCarregando(true);
    setErro(null);
    buscarMemo(controle.signal)
      .then((resultado) => setDados(resultado))
      .catch((e) => {
        if (e?.name !== 'AbortError') setErro(e instanceof Error ? e : new Error(mensagemDeErro(e)));
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false);
      });
    return () => controle.abort();
  }, [buscarMemo, versao]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  return { dados, setDados, carregando, erro, recarregar };
}

// atrasa a atualização de um valor (busca em tempo real com debounce)
export function useDebounce<T>(valor: T, atraso = 300) {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), atraso);
    return () => clearTimeout(t);
  }, [valor, atraso]);
  return atrasado;
}
