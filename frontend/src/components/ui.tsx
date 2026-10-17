// componentes visuais pequenos reutilizados pelas páginas
import { ReactNode, useState } from 'react';
import type { Bebida, BebidaResumo, Local } from '../lib/types';

export function Icon({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) {
  return (
    <span aria-hidden className={`material-symbols-outlined ${fill ? 'icon-fill' : ''} ${className}`}>
      {name}
    </span>
  );
}

export function Spinner({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-on-surface-variant" role="status">
      <Icon name="progress_activity" className="animate-spin text-4xl text-primary" />
      <span className="font-label-sm text-label-sm uppercase tracking-widest">{texto}</span>
    </div>
  );
}

export function ErroBox({ mensagem, onTentar }: { mensagem: string; onTentar?: () => void }) {
  return (
    <div className="glass-card flex flex-col items-center gap-4 rounded-2xl p-10 text-center" role="alert">
      <Icon name="error" className="text-4xl text-error" />
      <p className="max-w-md text-on-surface-variant">{mensagem}</p>
      {onTentar && (
        <button className="btn-ghost" onClick={onTentar}>
          <Icon name="refresh" /> Tentar novamente
        </button>
      )}
    </div>
  );
}

export function EstadoVazio({
  icone,
  titulo,
  texto,
  acao,
}: {
  icone: string;
  titulo: string;
  texto: string;
  acao?: ReactNode;
}) {
  return (
    <div className="glass-card flex flex-col items-center gap-4 rounded-2xl px-8 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Icon name={icone} className="text-3xl text-primary" />
      </div>
      <h3 className="font-headline-md text-headline-md">{titulo}</h3>
      <p className="max-w-md text-on-surface-variant">{texto}</p>
      {acao}
    </div>
  );
}

// imagem da bebida com fallback em gradiente + ícone quando não há foto
export function BebidaImagem({
  bebida,
  className = '',
}: {
  bebida: Pick<Bebida, 'nome' | 'tipo' | 'imagemUrl'> | BebidaResumo;
  className?: string;
}) {
  const [falhou, setFalhou] = useState(false);
  const vinho = bebida.tipo === 'vinho';

  if (bebida.imagemUrl && !falhou) {
    return (
      <img
        src={bebida.imagemUrl}
        alt={bebida.nome}
        loading="lazy"
        decoding="async"
        onError={() => setFalhou(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className} ${
        vinho
          ? 'bg-[radial-gradient(circle_at_30%_20%,#6b1f2a_0%,#2a0d12_55%,#0e0e0f_100%)]'
          : 'bg-[radial-gradient(circle_at_30%_20%,#8b500a_0%,#3a2108_55%,#0e0e0f_100%)]'
      }`}
      role="img"
      aria-label={bebida.nome}
    >
      <Icon
        name={vinho ? 'wine_bar' : 'local_bar'}
        className={`text-[96px] opacity-40 ${vinho ? 'text-[#ffb4c0]' : 'text-primary'}`}
      />
    </div>
  );
}

// foto do local com fallback em gradiente + ícone do tipo de estabelecimento
const ICONE_LOCAL: Record<string, string> = { bar: 'local_bar', restaurante: 'restaurant', adega: 'wine_bar' };

export function LocalImagem({
  local,
  className = '',
}: {
  local: Pick<Local, 'nome' | 'tipo' | 'imagemUrl'>;
  className?: string;
}) {
  const [falhou, setFalhou] = useState(false);

  if (local.imagemUrl && !falhou) {
    return (
      <img
        src={local.imagemUrl}
        alt={local.nome}
        loading="lazy"
        decoding="async"
        onError={() => setFalhou(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#8b500a_0%,#3a2108_55%,#0e0e0f_100%)] ${className}`}
      role="img"
      aria-label={local.nome}
    >
      <Icon name={ICONE_LOCAL[local.tipo ?? ''] ?? 'storefront'} className="text-[64px] text-primary opacity-40" />
    </div>
  );
}

export function Estrelas({
  nota,
  tamanho = 'text-base',
  onChange,
}: {
  nota: number;
  tamanho?: string;
  onChange?: (nota: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const exibida = hover || nota;

  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const cheia = exibida >= n - 0.25;
        const estrela = (
          <Icon name="star" fill={cheia} className={`${tamanho} ${cheia ? 'text-primary' : 'text-surface-variant'}`} />
        );
        if (!onChange) return <span key={n}>{estrela}</span>;
        return (
          <button
            key={n}
            type="button"
            aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="transition-transform hover:scale-125"
          >
            {estrela}
          </button>
        );
      })}
    </div>
  );
}

export function BarraSabor({ rotulo, valor, destaque = false }: { rotulo: string; valor: number; destaque?: boolean }) {
  const pct = Math.round(valor * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between">
        <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">{rotulo}</span>
        <span className="font-headline-md text-headline-md text-primary">{String(Math.round(valor * 10)).padStart(2, '0')}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-surface-variant">
        <div
          className={`h-full rounded-full transition-all duration-700 ${destaque ? 'bg-primary shadow-[0_0_10px_#ffb876]' : 'bg-primary/60'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function TipoTag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-primary/20 bg-obsidian/60 px-3 py-1 font-label-sm text-[10px] uppercase tracking-widest text-primary backdrop-blur-md">
      {children}
    </span>
  );
}
