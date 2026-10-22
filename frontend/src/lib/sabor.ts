// helpers de exibição dos atributos de sabor
import type { Avaliacao, Bebida, Harmonizacao, Sabor } from './types';

export const DIMENSOES: { chave: keyof Sabor; rotulo: string; atributo: keyof Bebida }[] = [
  { chave: 'doce', rotulo: 'Doce', atributo: 'atributoDoce' },
  { chave: 'seco', rotulo: 'Seco', atributo: 'atributoSeco' },
  { chave: 'citrico', rotulo: 'Cítrico', atributo: 'atributoCitrico' },
  { chave: 'encorpado', rotulo: 'Encorpado', atributo: 'atributoEncorpado' },
];

// adjetivos usados nas frases de evolução e contribuição
export const ADJETIVOS: Record<keyof Sabor, string> = {
  doce: 'doce',
  seco: 'seco',
  citrico: 'cítrico',
  encorpado: 'encorpado',
};

export const SUBSTANTIVOS: Record<keyof Sabor, string> = {
  doce: 'doçura',
  seco: 'secura',
  citrico: 'acidez',
  encorpado: 'corpo',
};

export const HARMONIZACOES: { valor: Harmonizacao; rotulo: string; icone: string }[] = [
  { valor: 'carnes-vermelhas', rotulo: 'Carnes vermelhas', icone: 'kebab_dining' },
  { valor: 'aves', rotulo: 'Aves', icone: 'egg_alt' },
  { valor: 'peixes-frutos-do-mar', rotulo: 'Peixes e frutos do mar', icone: 'set_meal' },
  { valor: 'massas', rotulo: 'Massas', icone: 'ramen_dining' },
  { valor: 'queijos', rotulo: 'Queijos', icone: 'bakery_dining' },
  { valor: 'sobremesas', rotulo: 'Sobremesas', icone: 'icecream' },
  { valor: 'petiscos', rotulo: 'Petiscos', icone: 'tapas' },
];

export const rotuloHarmonizacao = (valor: Harmonizacao) => HARMONIZACOES.find((h) => h.valor === valor)?.rotulo ?? valor;

// a percepção vem em quatro colunas; ou estão todas preenchidas, ou nenhuma
export function percepcaoDaAvaliacao(a: Avaliacao): Sabor | null {
  if (a.percebidoDoce === null || a.percebidoSeco === null || a.percebidoCitrico === null || a.percebidoEncorpado === null) {
    return null;
  }
  return { doce: a.percebidoDoce, seco: a.percebidoSeco, citrico: a.percebidoCitrico, encorpado: a.percebidoEncorpado };
}

export function formatarPreco(faixa: number | null) {
  return faixa ? '$'.repeat(faixa) : null;
}

export function formatarDistancia(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}

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

// frase de evolução do radar (B5): a dimensão que mais mudou desde o onboarding
export function evolucaoDoPaladar(base: Sabor, atual: Sabor): string {
  const [maior] = DIMENSOES.map((d) => ({ chave: d.chave, diferenca: atual[d.chave] - base[d.chave] })).sort(
    (a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca)
  );
  const pontos = Math.round(Math.abs(maior.diferenca) * 100);
  if (pontos < 5) return 'Seu paladar segue fiel ao que você respondeu no onboarding.';
  const sentido = maior.diferenca > 0 ? 'mais' : 'menos';
  return `Desde o onboarding, seu paladar ficou ${sentido} ${ADJETIVOS[maior.chave]} (${maior.diferenca > 0 ? '+' : '−'}${pontos} pontos de 100).`;
}
