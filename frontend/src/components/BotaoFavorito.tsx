// coração da lista "quero provar" (B3)
import { MouseEvent, useState } from 'react';
import { useFavoritos } from '../context/FavoritosContext';
import { Icon } from './ui';

export function BotaoFavorito({ bebidaId, className = '', comTexto = false }: { bebidaId: string; className?: string; comTexto?: boolean }) {
  const { ehFavorito, alternar } = useFavoritos();
  const [ocupado, setOcupado] = useState(false);
  const ativo = ehFavorito(bebidaId);

  async function clicar(e: MouseEvent) {
    // o botão fica sobre cards clicáveis: não deixa o clique navegar
    e.preventDefault();
    e.stopPropagation();
    if (ocupado) return;
    setOcupado(true);
    await alternar(bebidaId).catch(() => undefined);
    setOcupado(false);
  }

  const rotulo = ativo ? 'Remover de "Quero provar"' : 'Adicionar a "Quero provar"';
  if (comTexto) {
    return (
      <button type="button" onClick={clicar} aria-pressed={ativo} className={`btn-ghost ${className}`}>
        <Icon name="favorite" fill={ativo} className={ativo ? 'text-primary' : ''} /> {ativo ? 'Na sua lista' : 'Quero provar'}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={clicar}
      aria-pressed={ativo}
      aria-label={rotulo}
      title={rotulo}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-obsidian/70 backdrop-blur transition-transform hover:scale-110 ${
        ativo ? 'text-primary' : 'text-on-surface'
      } ${className}`}
    >
      <Icon name="favorite" fill={ativo} />
    </button>
  );
}
