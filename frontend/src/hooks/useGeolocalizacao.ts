// posição do usuário para mapa e locais próximos
import { useCallback, useEffect, useState } from 'react';

type Estado = { posicao: [number, number] | null; aviso: string; pedindo: boolean };

// automatico: pede a posição ao montar; senão só usa se a permissão já foi dada (não abre o pop-up do navegador sozinho)
export function useGeolocalizacao({ automatico = false }: { automatico?: boolean } = {}) {
  const [estado, setEstado] = useState<Estado>({ posicao: null, aviso: '', pedindo: false });

  const pedir = useCallback(() => {
    if (!navigator.geolocation) {
      setEstado((e) => ({ ...e, aviso: 'Geolocalização indisponível neste navegador.' }));
      return;
    }
    setEstado((e) => ({ ...e, pedindo: true }));
    navigator.geolocation.getCurrentPosition(
      (pos) => setEstado({ posicao: [pos.coords.latitude, pos.coords.longitude], aviso: '', pedindo: false }),
      () => setEstado((e) => ({ ...e, aviso: 'Localização não permitida.', pedindo: false })),
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  useEffect(() => {
    if (automatico) {
      pedir();
      return;
    }
    let ativo = true;
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((status) => {
        if (ativo && status.state === 'granted') pedir();
      })
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [automatico, pedir]);

  return { ...estado, pedir };
}
