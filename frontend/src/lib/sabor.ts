// helpers de exibição dos atributos de sabor
import type { Bebida, Sabor } from './types';

export const DIMENSOES: { chave: keyof Sabor; rotulo: string; atributo: keyof Bebida }[] = [
  { chave: 'doce', rotulo: 'Doce', atributo: 'atributoDoce' },
  { chave: 'seco', rotulo: 'Seco', atributo: 'atributoSeco' },
  { chave: 'citrico', rotulo: 'Cítrico', atributo: 'atributoCitrico' },
  { chave: 'encorpado', rotulo: 'Encorpado', atributo: 'atributoEncorpado' },
];

export function saborDaBebida(bebida: Bebida): Sabor {
  return {
    doce: bebida.atributoDoce,
    seco: bebida.atributoSeco,
    citrico: bebida.atributoCitrico,
    encorpado: bebida.atributoEncorpado,
  };
}

// subtítulo curto: "Tinto · Malbec" ou "Base: Gin"
export function subtituloBebida(bebida: Pick<Bebida, 'tipo' | 'tipoVinho' | 'uva' | 'baseAlcoolica'>) {
  if (bebida.tipo === 'vinho') {
    return [capitalizar(bebida.tipoVinho), bebida.uva].filter(Boolean).join(' · ');
  }
  return bebida.baseAlcoolica ? `Base: ${bebida.baseAlcoolica}` : 'Drink';
}

export function capitalizar(texto?: string | null) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatarNota(nota: number) {
  return nota > 0 ? nota.toFixed(1).replace('.', ',') : '—';
}

export function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}
