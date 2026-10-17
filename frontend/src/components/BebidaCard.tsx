import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { BebidaResumo } from '../lib/types';
import { formatarNota, subtituloBebida } from '../lib/sabor';
import { BebidaImagem, Icon, TipoTag } from './ui';

type Props = {
  bebida: BebidaResumo & { uva?: string | null; _count?: { avaliacoes: number } };
  rodape?: ReactNode;
};

// card padrão de bebida (catálogo, local, recomendações)
export function BebidaCard({ bebida, rodape }: Props) {
  return (
    <Link
      to={`/bebidas/${bebida.id}`}
      className="glass-card glass-card-hover group flex flex-col overflow-hidden rounded-2xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <BebidaImagem bebida={bebida} className="transition-transform duration-700 group-hover:scale-110" />
        <div className="image-overlay absolute inset-0" />
        <div className="absolute left-4 top-4">
          <TipoTag>{bebida.tipo === 'vinho' ? 'Vinho' : 'Drink'}</TipoTag>
        </div>
        <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-obsidian/70 px-3 py-1 backdrop-blur">
          <Icon name="star" fill className="text-sm text-primary" />
          <span className="font-label-sm text-label-sm">{formatarNota(bebida.notaMedia)}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <h3 className="font-headline-md text-headline-md transition-colors group-hover:text-primary">{bebida.nome}</h3>
        <p className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
          {subtituloBebida({ uva: null, ...bebida })}
        </p>
        {rodape && <div className="mt-3">{rodape}</div>}
      </div>
    </Link>
  );
}
