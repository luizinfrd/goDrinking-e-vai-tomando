// gráfico radar dos quatro eixos: paladar do onboarding × paladar atual (B5)
import { DIMENSOES } from '../lib/sabor';
import type { Sabor } from '../lib/types';

const CENTRO = 120;
const RAIO = 82;
const ANEIS = [0.25, 0.5, 0.75, 1];

// doce no topo e os demais no sentido horário
function ponto(indice: number, valor: number) {
  const angulo = (Math.PI * 2 * indice) / DIMENSOES.length - Math.PI / 2;
  return [CENTRO + Math.cos(angulo) * RAIO * valor, CENTRO + Math.sin(angulo) * RAIO * valor] as const;
}

const poligono = (sabor: Sabor) => DIMENSOES.map((d, i) => ponto(i, sabor[d.chave]).join(',')).join(' ');

export function RadarSabor({ atual, base }: { atual: Sabor; base?: Sabor | null }) {
  return (
    <figure className="mx-auto w-full max-w-[320px]">
      <svg viewBox="0 0 240 240" className="h-auto w-full overflow-visible" role="img" aria-label="Radar do seu paladar">
        {ANEIS.map((anel) => (
          <polygon
            key={anel}
            points={DIMENSOES.map((_, i) => ponto(i, anel).join(',')).join(' ')}
            className="fill-none stroke-surface-variant"
            strokeWidth={1}
          />
        ))}
        {DIMENSOES.map((d, i) => {
          const [x, y] = ponto(i, 1);
          const [lx, ly] = ponto(i, 1.22);
          return (
            <g key={d.chave}>
              <line x1={CENTRO} y1={CENTRO} x2={x} y2={y} className="stroke-surface-variant" strokeWidth={1} />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-on-surface-variant text-[11px] uppercase tracking-widest">
                {d.rotulo}
              </text>
            </g>
          );
        })}
        {base && (
          <polygon points={poligono(base)} className="fill-none stroke-outline" strokeWidth={1.5} strokeDasharray="4 4" />
        )}
        <polygon points={poligono(atual)} className="fill-primary/25 stroke-primary" strokeWidth={2} />
        {DIMENSOES.map((d, i) => {
          const [x, y] = ponto(i, atual[d.chave]);
          return <circle key={d.chave} cx={x} cy={y} r={3.5} className="fill-primary" />;
        })}
      </svg>
      {base && (
        <figcaption className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-on-surface-variant">
          <span className="flex items-center gap-2">
            <span className="h-0.5 w-5 bg-primary" /> Atual
          </span>
          <span className="flex items-center gap-2">
            <span className="w-5 border-t border-dashed border-outline" /> Onboarding
          </span>
        </figcaption>
      )}
    </figure>
  );
}
