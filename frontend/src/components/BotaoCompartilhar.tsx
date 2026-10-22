// compartilhar com a folha nativa do celular; no desktop copia o link (B10)
import { useEffect, useState } from 'react';
import { Icon } from './ui';

type Props = { titulo: string; texto: string; caminho: string; className?: string; compacto?: boolean };

export function BotaoCompartilhar({ titulo, texto, caminho, className = '', compacto = false }: Props) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const t = window.setTimeout(() => setCopiado(false), 2000);
    return () => window.clearTimeout(t);
  }, [copiado]);

  async function compartilhar() {
    const url = new URL(caminho, window.location.origin).toString();
    if (navigator.share) {
      // cancelar a folha de compartilhamento também cai no catch
      await navigator.share({ title: titulo, text: texto, url }).catch(() => undefined);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
    } catch {
      window.prompt('Copie o link:', url);
    }
  }

  const rotulo = copiado ? 'Link copiado!' : 'Compartilhar';
  if (compacto) {
    return (
      <button
        type="button"
        onClick={compartilhar}
        aria-label={rotulo}
        title={rotulo}
        className={`glass-panel flex h-11 w-11 items-center justify-center rounded-full ${copiado ? 'text-primary' : ''} ${className}`}
      >
        <Icon name={copiado ? 'check' : 'share'} />
      </button>
    );
  }
  return (
    <button type="button" onClick={compartilhar} className={`btn-ghost ${className}`}>
      <Icon name={copiado ? 'check' : 'share'} /> {rotulo}
    </button>
  );
}
