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
        <div className="absolute left-2 top-2 sm:left-4 sm:top-4">
          <TipoTag>{bebida.tipo === 'vinho' ? 'Vinho' : 'Drink'}</TipoTag>
        </div>
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-obsidian/70 px-2 py-0.5 backdrop-blur sm:bottom-4 sm:right-4 sm:px-3 sm:py-1">
          <Icon name="star" fill className="text-sm text-primary" />
          <span className="font-label-sm text-label-sm">{formatarNota(bebida.notaMedia)}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-5">
        <h3 className="font-headline-md text-[17px] leading-tight transition-colors group-hover:text-primary sm:text-headline-md">
          {bebida.nome}
        </h3>
        <p className="truncate font-label-sm text-[11px] uppercase tracking-wider text-on-surface-variant sm:text-label-sm sm:tracking-widest">
          {subtituloBebida({ uva: null, ...bebida })}
        </p>
        {rodape && <div className="mt-auto pt-2 sm:pt-3">{rodape}</div>}
      </div>
    </Link>
  );
}
