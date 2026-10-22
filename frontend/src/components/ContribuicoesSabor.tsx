// explicação por eixo da recomendação (B12): quanto cada dimensão pesou na compatibilidade
import { SUBSTANTIVOS } from '../lib/sabor';
import type { Contribuicao } from '../lib/types';

export function ContribuicoesSabor({ contribuicoes, className = '' }: { contribuicoes: Contribuicao[]; className?: string }) {
  const relevantes = contribuicoes.filter((c) => c.percentual >= 5).slice(0, 3);
  if (relevantes.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-x-5 gap-y-2 ${className}`} aria-label="O que mais pesou na compatibilidade">
      {relevantes.map((c) => (
        <li key={c.dimensao} className="min-w-[96px] flex-1 sm:flex-none">
          <div className="flex items-baseline justify-between gap-2 text-xs text-on-surface-variant">
            <span>{SUBSTANTIVOS[c.dimensao]}</span>
            <span className="font-bold text-primary">{c.percentual}%</span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-variant/60">
            <div className="h-full rounded-full bg-primary" style={{ width: `${c.percentual}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
