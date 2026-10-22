// usuários do seed: demo, admin e uma comunidade fictícia que dá vida à percepção, ao colaborativo e às métricas
import { VetorSabor } from '../../src/domain/sabor';
import { BebidaSeed } from './tipos';

export const DEMO = {
  nome: 'Usuário Demo',
  email: 'demo@godrinking.com',
  senha: 'demo12345',
  onboarding: { doce: 0.3, seco: 0.7, citrico: 0.5, encorpado: 0.8 },
  avaliacoes: [
    { bebida: 'Negroni', nota: 5, comentario: 'Amargor na medida certa, meu favorito.' },
    { bebida: 'Malbec Mendoza', nota: 4, comentario: 'Encorpado e macio, ótimo com carne.' },
    { bebida: 'Piña Colada', nota: 2, comentario: 'Doce demais para o meu gosto.' },
    { bebida: 'Sauvignon Blanc Marlborough', nota: 4, comentario: null },
  ],
  favoritos: ['Tannat Canelones', 'Boulevardier', 'Douro Tinto'],
};

export const ADMIN = {
  nome: 'Administração goDrinking',
  email: 'admin@godrinking.com',
  senha: 'admin12345',
  onboarding: { doce: 0.5, seco: 0.5, citrico: 0.5, encorpado: 0.5 },
};

// comunidade fictícia: e-mails no domínio demo.godrinking, senha igual à do demo
export const DOMINIO_COMUNIDADE = 'demo.godrinking';

const NOMES = [
  'Ana Ribeiro', 'Bruno Carvalho', 'Carla Mendes', 'Diego Santos', 'Elisa Moraes',
  'Fábio Lima', 'Gabriela Rocha', 'Henrique Alves', 'Isabela Costa', 'João Pereira',
  'Larissa Nunes', 'Marcelo Dias', 'Natália Freitas', 'Otávio Prado', 'Paula Teixeira',
];

// perfis de paladar típicos; cada usuário parte de um e recebe uma variação
const ARQUETIPOS: VetorSabor[] = [
  { doce: 0.2, seco: 0.8, citrico: 0.2, encorpado: 0.9 }, // tintos potentes
  { doce: 0.4, seco: 0.3, citrico: 0.9, encorpado: 0.2 }, // cítricos refrescantes
  { doce: 0.9, seco: 0.1, citrico: 0.4, encorpado: 0.4 }, // formiguinha
  { doce: 0.3, seco: 0.7, citrico: 0.3, encorpado: 0.7 }, // clássicos amargos
  { doce: 0.3, seco: 0.6, citrico: 0.7, encorpado: 0.2 }, // leves e frescos
];

/*
 * bebidas cuja percepção da comunidade foge do catálogo de propósito,
 * para a assertividade e o vetor efetivo terem algo a mostrar na demo
 */
const DESVIOS_DE_PERCEPCAO: Record<string, Partial<VetorSabor>> = {
  Cosmopolitan: { doce: 0.25, citrico: -0.25 },
  'Chardonnay Napa Valley': { encorpado: -0.3, doce: 0.1 },
  'Moscow Mule': { citrico: -0.3, doce: 0.2 },
  'Aperol Spritz': { seco: 0.2, doce: -0.2 },
};

const COMENTARIOS: Record<number, string[]> = {
  1: ['Não desceu.', 'Não combinou comigo.'],
  2: ['Esperava mais.', 'Ok, mas não pediria de novo.'],
  3: ['Correto, sem surpresas.', 'Bom para acompanhar petiscos.'],
  4: ['Muito bom, pediria de novo.', 'Equilibrado e bem feito.'],
  5: ['Perfeito!', 'Um dos melhores que já provei.', 'Virou meu preferido.'],
};

// gerador pseudoaleatório com semente (mulberry32): o seed gera sempre os mesmos dados
function aleatorio(semente: number) {
  return () => {
    semente = (semente + 0x6d2b79f5) | 0;
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const limitar = (v: number) => Math.min(1, Math.max(0, Math.round(v * 10) / 10));

function cosseno(a: VetorSabor, b: VetorSabor) {
  const chaves = ['doce', 'seco', 'citrico', 'encorpado'] as const;
  const produto = chaves.reduce((s, k) => s + a[k] * b[k], 0);
  const normaA = Math.sqrt(chaves.reduce((s, k) => s + a[k] ** 2, 0));
  const normaB = Math.sqrt(chaves.reduce((s, k) => s + b[k] ** 2, 0));
  return normaA && normaB ? produto / (normaA * normaB) : 0;
}

export type AvaliacaoGerada = {
  bebida: string;
  nota: number;
  comentario: string | null;
  percepcao: VetorSabor | null;
  // um dos locais que servem a bebida, quando houver
  local: string | null;
  diasAtras: number;
};

export type UsuarioGerado = {
  nome: string;
  email: string;
  onboarding: VetorSabor;
  avaliacoes: AvaliacaoGerada[];
};

// toda bebida termina com pelo menos isto de avaliações com percepção (o gráfico aparece a partir de 3)
export const PERCEPCOES_POR_BEBIDA = 6;

function avaliar(
  b: BebidaSeed,
  onboarding: VetorSabor,
  locaisPorBebida: Map<string, string[]>,
  rnd: () => number,
  { sempreComPercepcao = false } = {}
): AvaliacaoGerada {
  const ruido = (amplitude: number) => (rnd() * 2 - 1) * amplitude;
  const compatibilidade = cosseno(onboarding, b.sabor);
  const nota = Math.min(5, Math.max(1, Math.round(1 + (4 * (compatibilidade - 0.6)) / 0.4 + ruido(0.8))));
  const desvio = DESVIOS_DE_PERCEPCAO[b.nome] ?? {};
  const percepcao =
    sempreComPercepcao || rnd() < 0.75
      ? {
          doce: limitar(b.sabor.doce + (desvio.doce ?? 0) + ruido(0.1)),
          seco: limitar(b.sabor.seco + (desvio.seco ?? 0) + ruido(0.1)),
          citrico: limitar(b.sabor.citrico + (desvio.citrico ?? 0) + ruido(0.1)),
          encorpado: limitar(b.sabor.encorpado + (desvio.encorpado ?? 0) + ruido(0.1)),
        }
      : null;
  const locais = locaisPorBebida.get(b.nome) ?? [];
  const local = locais.length && rnd() < 0.6 ? locais[Math.floor(rnd() * locais.length)] : null;
  const opcoes = COMENTARIOS[nota];
  const comentario = rnd() < 0.5 ? opcoes[Math.floor(rnd() * opcoes.length)] : null;
  return { bebida: b.nome, nota, comentario, percepcao, local, diasAtras: Math.floor(rnd() * 180) };
}

/*
 * completa as bebidas com poucas percepções: quem ainda não avaliou e tem o paladar mais
 * compatível prova a bebida. gerador separado, para não mudar as avaliações já geradas
 */
function completarPercepcoes(comunidade: UsuarioGerado[], bebidas: BebidaSeed[], locaisPorBebida: Map<string, string[]>) {
  const rnd = aleatorio(20261023);
  for (const b of bebidas) {
    const avaliaram = comunidade.filter((u) => u.avaliacoes.some((a) => a.bebida === b.nome));
    const comPercepcao = avaliaram.filter((u) => u.avaliacoes.some((a) => a.bebida === b.nome && a.percepcao)).length;
    const faltam = PERCEPCOES_POR_BEBIDA - comPercepcao;
    if (faltam <= 0) continue;
    comunidade
      .filter((u) => !avaliaram.includes(u))
      .sort((x, y) => cosseno(y.onboarding, b.sabor) - cosseno(x.onboarding, b.sabor))
      .slice(0, faltam)
      .forEach((u) => u.avaliacoes.push(avaliar(b, u.onboarding, locaisPorBebida, rnd, { sempreComPercepcao: true })));
  }
}

export function gerarComunidade(bebidas: BebidaSeed[], locaisPorBebida: Map<string, string[]>): UsuarioGerado[] {
  const rnd = aleatorio(20261022);
  const ruido = (amplitude: number) => (rnd() * 2 - 1) * amplitude;

  const comunidade = NOMES.map((nome, i) => {
    const arquetipo = ARQUETIPOS[i % ARQUETIPOS.length];
    const onboarding = {
      doce: limitar(arquetipo.doce + ruido(0.1)),
      seco: limitar(arquetipo.seco + ruido(0.1)),
      citrico: limitar(arquetipo.citrico + ruido(0.1)),
      encorpado: limitar(arquetipo.encorpado + ruido(0.1)),
    };

    // as pessoas provam mais o que combina com elas, mas também arriscam
    const quantidade = 6 + Math.floor(rnd() * 7);
    const escolhidas = bebidas
      .map((b) => ({ b, peso: cosseno(onboarding, b.sabor) + rnd() * 0.6 }))
      .sort((x, y) => y.peso - x.peso)
      .slice(0, quantidade)
      .map((x) => x.b);

    const avaliacoes = escolhidas.map((b) => avaliar(b, onboarding, locaisPorBebida, rnd));

    const email = `${nome
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '.')}@${DOMINIO_COMUNIDADE}`;

    return { nome, email, onboarding, avaliacoes };
  });

  completarPercepcoes(comunidade, bebidas, locaisPorBebida);
  return comunidade;
}
