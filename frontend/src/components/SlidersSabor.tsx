// quatro sliders de 0 a 10 (gravados de 0 a 1), usados no cadastro de bebida e na percepção da avaliação
import { DIMENSOES } from '../lib/sabor';
import type { Sabor } from '../lib/types';

type Props = { valor: Sabor; onChange: (valor: Sabor) => void; referencia?: Sabor; prefixoId?: string };

export function SlidersSabor({ valor, onChange, referencia, prefixoId = 'sabor' }: Props) {
  return (
    <div className="space-y-5">
      {DIMENSOES.map((d) => (
        <div key={d.chave}>
          <label htmlFor={`${prefixoId}-${d.chave}`} className="mb-1 flex justify-between gap-3 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
            <span>{d.rotulo}</span>
            <span>
              {referencia && <span className="mr-2 normal-case tracking-normal text-outline">catálogo {Math.round(referencia[d.chave] * 10)}</span>}
              <span className="text-primary">{Math.round(valor[d.chave] * 10)}</span>
            </span>
          </label>
          <input
            id={`${prefixoId}-${d.chave}`}
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={valor[d.chave]}
            onChange={(e) => onChange({ ...valor, [d.chave]: Number(e.target.value) })}
            className="h-11 w-full cursor-pointer accent-primary"
          />
        </div>
      ))}
    </div>
  );
}
