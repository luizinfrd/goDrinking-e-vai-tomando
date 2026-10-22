// popula o banco com o catálogo base de drinks, vinhos e locais (idempotente: pode rodar várias vezes)
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from '../src/lib/prisma';
import { preferenciaService } from '../src/services/preferenciaService';

type Sabor = { doce: number; seco: number; citrico: number; encorpado: number };

type BebidaSeed = {
  nome: string;
  descricao: string;
  sabor: Sabor;
} & (
  | { tipo: 'drink'; baseAlcoolica: string; ingredientes: string }
  | { tipo: 'vinho'; tipoVinho: string; uva: string; paisOrigem: string }
);

// fotos servidas pelo front (frontend/public/img), créditos em frontend/public/img/CREDITOS.md
const IMAGENS: Record<string, string> = {
  'Caipirinha': '/img/bebidas/caipirinha.jpg',
  'Negroni': '/img/bebidas/negroni.jpg',
  'Mojito': '/img/bebidas/mojito.jpg',
  'Old Fashioned': '/img/bebidas/old-fashioned.jpg',
  'Aperol Spritz': '/img/bebidas/aperol-spritz.jpg',
  'Margarita': '/img/bebidas/margarita.jpg',
  'Moscow Mule': '/img/bebidas/moscow-mule.jpg',
  'Espresso Martini': '/img/bebidas/espresso-martini.jpg',
  'Gin Tônica': '/img/bebidas/gin-tonica.jpg',
  'Piña Colada': '/img/bebidas/pina-colada.jpg',
  'Whiskey Sour': '/img/bebidas/whiskey-sour.jpg',
  'Cosmopolitan': '/img/bebidas/cosmopolitan.jpg',
  'Malbec Mendoza': '/img/bebidas/malbec-mendoza.jpg',
  'Cabernet Sauvignon Valle del Maipo': '/img/bebidas/cabernet-maipo.jpg',
  'Carménère Reserva': '/img/bebidas/carmenere.jpg',
  'Pinot Noir Bourgogne': '/img/bebidas/pinot-noir.jpg',
  'Merlot Serra Gaúcha': '/img/bebidas/merlot-serra-gaucha.jpg',
  'Tannat Canelones': '/img/bebidas/tannat.jpg',
  'Sauvignon Blanc Marlborough': '/img/bebidas/sauvignon-blanc.jpg',
  'Chardonnay Napa Valley': '/img/bebidas/chardonnay.jpg',
  'Riesling Mosel': '/img/bebidas/riesling.jpg',
  "Moscato d'Asti": '/img/bebidas/moscato.jpg',
  'Espumante Brut Vale dos Vinhedos': '/img/bebidas/espumante-brut.jpg',
  'Rosé Côtes de Provence': '/img/bebidas/rose-provence.jpg',
  'Âmbar Speakeasy': '/img/locais/ambar-speakeasy.jpg',
  'Rooftop Cambuí': '/img/locais/rooftop-cambui.jpg',
  'Adega Taquaral': '/img/locais/adega-taquaral.jpg',
  'Boteco do Barão': '/img/locais/boteco-do-barao.jpg',
  'Enoteca Centro': '/img/locais/enoteca-centro.jpg',
  'Largo do Rosário Bar': '/img/locais/largo-do-rosario-bar.jpg',
  'Varanda Guanabara': '/img/locais/varanda-guanabara.jpg',
  'Lagoa Lounge': '/img/locais/lagoa-lounge.jpg',
};

/*
 * critério dos atributos (0 a 1):
 * doce      → açúcar residual / xaropes / licores
 * seco      → ausência de açúcar, amargor, taninos e álcool marcante
 * citrico   → acidez e presença de frutas cítricas
 * encorpado → corpo, peso e intensidade na boca
 */
const DRINKS: BebidaSeed[] = [
  {
    nome: 'Caipirinha', tipo: 'drink', baseAlcoolica: 'Cachaça',
    ingredientes: 'Cachaça, limão-taiti, açúcar, gelo',
    descricao: 'O clássico brasileiro: limão macerado com açúcar e cachaça. Refrescante, ácido e levemente adocicado.',
    sabor: { doce: 0.6, seco: 0.1, citrico: 0.9, encorpado: 0.3 },
  },
  {
    nome: 'Negroni', tipo: 'drink', baseAlcoolica: 'Gin',
    ingredientes: 'Gin, vermute rosso, Campari, casca de laranja',
    descricao: 'Ícone italiano de partes iguais. Amargo, herbal e equilibrado, com final longo.',
    sabor: { doce: 0.4, seco: 0.6, citrico: 0.3, encorpado: 0.7 },
  },
  {
    nome: 'Mojito', tipo: 'drink', baseAlcoolica: 'Rum',
    ingredientes: 'Rum branco, hortelã, limão, açúcar, água com gás',
    descricao: 'Cubano e leve: hortelã fresca, limão e rum branco completados com soda.',
    sabor: { doce: 0.5, seco: 0.1, citrico: 0.8, encorpado: 0.2 },
  },
  {
    nome: 'Old Fashioned', tipo: 'drink', baseAlcoolica: 'Bourbon',
    ingredientes: 'Bourbon, açúcar demerara, angostura, casca de laranja',
    descricao: 'O avô dos coquetéis. Whiskey em destaque, adoçado e aromatizado com bitter.',
    sabor: { doce: 0.5, seco: 0.5, citrico: 0.1, encorpado: 0.9 },
  },
  {
    nome: 'Aperol Spritz', tipo: 'drink', baseAlcoolica: 'Aperol',
    ingredientes: 'Aperol, prosecco, água com gás, laranja',
    descricao: 'Aperitivo vêneto borbulhante, agridoce e de baixo teor alcoólico.',
    sabor: { doce: 0.6, seco: 0.3, citrico: 0.5, encorpado: 0.2 },
  },
  {
    nome: 'Margarita', tipo: 'drink', baseAlcoolica: 'Tequila',
    ingredientes: 'Tequila, licor de laranja, limão, sal na borda',
    descricao: 'Tequila, limão e licor de laranja com a borda salgada. Cítrica e vibrante.',
    sabor: { doce: 0.3, seco: 0.3, citrico: 0.9, encorpado: 0.3 },
  },
  {
    nome: 'Moscow Mule', tipo: 'drink', baseAlcoolica: 'Vodka',
    ingredientes: 'Vodka, limão, xarope de gengibre, espuma de gengibre',
    descricao: 'Servido na caneca de cobre: vodka, limão e gengibre picante.',
    sabor: { doce: 0.4, seco: 0.2, citrico: 0.7, encorpado: 0.3 },
  },
  {
    nome: 'Espresso Martini', tipo: 'drink', baseAlcoolica: 'Vodka',
    ingredientes: 'Vodka, café espresso, licor de café, xarope simples',
    descricao: 'Café e vodka batidos até formar espuma cremosa. Intenso e aveludado.',
    sabor: { doce: 0.6, seco: 0.3, citrico: 0.0, encorpado: 0.8 },
  },
  {
    nome: 'Gin Tônica', tipo: 'drink', baseAlcoolica: 'Gin',
    ingredientes: 'Gin, água tônica, limão ou especiarias',
    descricao: 'Botânico e amargo da tônica. Seco, leve e muito refrescante.',
    sabor: { doce: 0.2, seco: 0.6, citrico: 0.5, encorpado: 0.2 },
  },
  {
    nome: 'Piña Colada', tipo: 'drink', baseAlcoolica: 'Rum',
    ingredientes: 'Rum, creme de coco, suco de abacaxi',
    descricao: 'Tropical e cremosa: coco e abacaxi batidos com rum.',
    sabor: { doce: 0.9, seco: 0.0, citrico: 0.3, encorpado: 0.7 },
  },
  {
    nome: 'Whiskey Sour', tipo: 'drink', baseAlcoolica: 'Whisky',
    ingredientes: 'Whisky, limão-siciliano, xarope simples, clara de ovo',
    descricao: 'Equilíbrio entre o calor do whisky e a acidez do limão, com espuma sedosa.',
    sabor: { doce: 0.5, seco: 0.3, citrico: 0.8, encorpado: 0.5 },
  },
  {
    nome: 'Cosmopolitan', tipo: 'drink', baseAlcoolica: 'Vodka',
    ingredientes: 'Vodka cítrica, licor de laranja, cranberry, limão',
    descricao: 'Rosado e elegante: cranberry e limão sobre base de vodka.',
    sabor: { doce: 0.6, seco: 0.2, citrico: 0.7, encorpado: 0.3 },
  },
];

const VINHOS: BebidaSeed[] = [
  {
    nome: 'Malbec Mendoza', tipo: 'vinho', tipoVinho: 'tinto', uva: 'Malbec', paisOrigem: 'Argentina',
    descricao: 'Tinto de altitude com frutas negras maduras, violeta e taninos macios.',
    sabor: { doce: 0.3, seco: 0.7, citrico: 0.2, encorpado: 0.9 },
  },
  {
    nome: 'Cabernet Sauvignon Valle del Maipo', tipo: 'vinho', tipoVinho: 'tinto', uva: 'Cabernet Sauvignon', paisOrigem: 'Chile',
    descricao: 'Cassis, pimentão e notas de madeira. Estruturado e tânico.',
    sabor: { doce: 0.2, seco: 0.8, citrico: 0.2, encorpado: 0.9 },
  },
  {
    nome: 'Carménère Reserva', tipo: 'vinho', tipoVinho: 'tinto', uva: 'Carménère', paisOrigem: 'Chile',
    descricao: 'A uva símbolo do Chile: frutas vermelhas, especiarias e toque herbáceo.',
    sabor: { doce: 0.3, seco: 0.7, citrico: 0.2, encorpado: 0.7 },
  },
  {
    nome: 'Pinot Noir Bourgogne', tipo: 'vinho', tipoVinho: 'tinto', uva: 'Pinot Noir', paisOrigem: 'França',
    descricao: 'Delicado e aromático, com cereja, framboesa e acidez viva.',
    sabor: { doce: 0.2, seco: 0.7, citrico: 0.5, encorpado: 0.4 },
  },
  {
    nome: 'Merlot Serra Gaúcha', tipo: 'vinho', tipoVinho: 'tinto', uva: 'Merlot', paisOrigem: 'Brasil',
    descricao: 'Tinto brasileiro macio, de ameixa e chocolate, fácil de beber.',
    sabor: { doce: 0.3, seco: 0.6, citrico: 0.3, encorpado: 0.6 },
  },
  {
    nome: 'Tannat Canelones', tipo: 'vinho', tipoVinho: 'tinto', uva: 'Tannat', paisOrigem: 'Uruguai',
    descricao: 'Potente e tânico, com frutas escuras e final longo. Pede carnes.',
    sabor: { doce: 0.1, seco: 0.9, citrico: 0.2, encorpado: 1.0 },
  },
  {
    nome: 'Sauvignon Blanc Marlborough', tipo: 'vinho', tipoVinho: 'branco', uva: 'Sauvignon Blanc', paisOrigem: 'Nova Zelândia',
    descricao: 'Maracujá, limão e grama cortada. Muito fresco e mineral.',
    sabor: { doce: 0.1, seco: 0.8, citrico: 0.9, encorpado: 0.2 },
  },
  {
    nome: 'Chardonnay Napa Valley', tipo: 'vinho', tipoVinho: 'branco', uva: 'Chardonnay', paisOrigem: 'Estados Unidos',
    descricao: 'Branco amanteigado com passagem por carvalho, abacaxi e baunilha.',
    sabor: { doce: 0.3, seco: 0.6, citrico: 0.4, encorpado: 0.7 },
  },
  {
    nome: 'Riesling Mosel', tipo: 'vinho', tipoVinho: 'branco', uva: 'Riesling', paisOrigem: 'Alemanha',
    descricao: 'Leve doçura equilibrada por acidez cortante; pêssego e notas minerais.',
    sabor: { doce: 0.7, seco: 0.2, citrico: 0.8, encorpado: 0.3 },
  },
  {
    nome: "Moscato d'Asti", tipo: 'vinho', tipoVinho: 'espumante', uva: 'Moscato Bianco', paisOrigem: 'Itália',
    descricao: 'Frisante, doce e perfumado, com flores brancas e uva fresca.',
    sabor: { doce: 0.9, seco: 0.0, citrico: 0.5, encorpado: 0.1 },
  },
  {
    nome: 'Espumante Brut Vale dos Vinhedos', tipo: 'vinho', tipoVinho: 'espumante', uva: 'Chardonnay e Pinot Noir', paisOrigem: 'Brasil',
    descricao: 'Método tradicional, perlage fina, notas de pão tostado e maçã verde.',
    sabor: { doce: 0.2, seco: 0.8, citrico: 0.7, encorpado: 0.3 },
  },
  {
    nome: 'Rosé Côtes de Provence', tipo: 'vinho', tipoVinho: 'rosé', uva: 'Grenache e Cinsault', paisOrigem: 'França',
    descricao: 'Rosé pálido e seco, com morango, pêssego e frescor salino.',
    sabor: { doce: 0.3, seco: 0.6, citrico: 0.6, encorpado: 0.2 },
  },
];

// locais fictícios espalhados por bairros reais de Campinas/SP
const LOCAIS = [
  {
    nome: 'Âmbar Speakeasy', tipo: 'bar', endereco: 'Rua Coronel Quirino, Cambuí — Campinas/SP',
    latitude: -22.8946, longitude: -47.0496,
    descricao: 'Bar escondido com luz baixa e coquetelaria autoral à base de whiskey e gin.',
    bebidas: ['Negroni', 'Old Fashioned', 'Whiskey Sour', 'Espresso Martini', 'Gin Tônica', 'Malbec Mendoza'],
  },
  {
    nome: 'Rooftop Cambuí', tipo: 'bar', endereco: 'Av. Júlio de Mesquita, Cambuí — Campinas/SP',
    latitude: -22.8915, longitude: -47.0468,
    descricao: 'Terraço com vista para a cidade, drinks refrescantes e espumantes.',
    bebidas: ['Aperol Spritz', 'Gin Tônica', 'Mojito', 'Cosmopolitan', 'Espumante Brut Vale dos Vinhedos', 'Rosé Côtes de Provence', "Moscato d'Asti"],
  },
  {
    nome: 'Adega Taquaral', tipo: 'adega', endereco: 'Av. Heitor Penteado, Taquaral — Campinas/SP',
    latitude: -22.8735, longitude: -47.0573,
    descricao: 'Adega com degustação de rótulos sul-americanos e europeus.',
    bebidas: ['Malbec Mendoza', 'Cabernet Sauvignon Valle del Maipo', 'Carménère Reserva', 'Tannat Canelones', 'Merlot Serra Gaúcha', 'Pinot Noir Bourgogne', 'Chardonnay Napa Valley'],
  },
  {
    nome: 'Boteco do Barão', tipo: 'bar', endereco: 'Av. Albino J. B. de Oliveira, Barão Geraldo — Campinas/SP',
    latitude: -22.8188, longitude: -47.0716,
    descricao: 'Boteco universitário com caipirinhas generosas e clima descontraído.',
    bebidas: ['Caipirinha', 'Mojito', 'Moscow Mule', 'Margarita', 'Piña Colada'],
  },
  {
    nome: 'Enoteca Centro', tipo: 'restaurante', endereco: 'Rua Barão de Jaguara, Centro — Campinas/SP',
    latitude: -22.9058, longitude: -47.0606,
    descricao: 'Restaurante italiano com carta de vinhos premiada e harmonizações.',
    bebidas: ['Pinot Noir Bourgogne', 'Riesling Mosel', 'Sauvignon Blanc Marlborough', "Moscato d'Asti", 'Rosé Côtes de Provence', 'Negroni', 'Aperol Spritz'],
  },
  {
    nome: 'Largo do Rosário Bar', tipo: 'bar', endereco: 'Largo do Rosário, Centro — Campinas/SP',
    latitude: -22.9033, longitude: -47.0588,
    descricao: 'Clássicos bem executados no coração do centro histórico.',
    bebidas: ['Caipirinha', 'Old Fashioned', 'Margarita', 'Whiskey Sour', 'Cosmopolitan', 'Merlot Serra Gaúcha'],
  },
  {
    nome: 'Varanda Guanabara', tipo: 'restaurante', endereco: 'Rua Barreto Leme, Guanabara — Campinas/SP',
    latitude: -22.8987, longitude: -47.0708,
    descricao: 'Varanda arborizada, cozinha brasileira e vinhos nacionais.',
    bebidas: ['Merlot Serra Gaúcha', 'Espumante Brut Vale dos Vinhedos', 'Caipirinha', 'Chardonnay Napa Valley', 'Carménère Reserva'],
  },
  {
    nome: 'Lagoa Lounge', tipo: 'bar', endereco: 'Av. Dr. Heitor Penteado, Lagoa do Taquaral — Campinas/SP',
    latitude: -22.8762, longitude: -47.0521,
    descricao: 'Lounge à beira da lagoa com drinks tropicais ao pôr do sol.',
    bebidas: ['Piña Colada', 'Mojito', 'Aperol Spritz', 'Moscow Mule', 'Espresso Martini', 'Sauvignon Blanc Marlborough'],
  },
];

const DEMO = {
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
};

async function upsertBebida(b: BebidaSeed) {
  const dados = {
    nome: b.nome,
    tipo: b.tipo,
    descricao: b.descricao,
    imagemUrl: IMAGENS[b.nome] ?? null,
    atributoDoce: b.sabor.doce,
    atributoSeco: b.sabor.seco,
    atributoCitrico: b.sabor.citrico,
    atributoEncorpado: b.sabor.encorpado,
    ...(b.tipo === 'drink'
      ? { baseAlcoolica: b.baseAlcoolica, ingredientes: b.ingredientes }
      : { tipoVinho: b.tipoVinho, uva: b.uva, paisOrigem: b.paisOrigem }),
  };

  // a tabela não tem unique no nome, então a busca é feita antes
  const existente = await prisma.bebida.findFirst({ where: { nome: b.nome } });
  if (existente) {
    return prisma.bebida.update({ where: { id: existente.id }, data: dados });
  }
  return prisma.bebida.create({ data: dados });
}

async function main() {
  console.log('semeando bebidas...');
  const bebidasPorNome = new Map<string, string>();
  for (const b of [...DRINKS, ...VINHOS]) {
    const bebida = await upsertBebida(b);
    bebidasPorNome.set(bebida.nome, bebida.id);
  }

  console.log('semeando locais...');
  for (const { bebidas, ...camposLocal } of LOCAIS) {
    const dadosLocal = { ...camposLocal, imagemUrl: IMAGENS[camposLocal.nome] ?? null };
    const existente = await prisma.local.findFirst({ where: { nome: dadosLocal.nome } });
    const local = existente
      ? await prisma.local.update({ where: { id: existente.id }, data: dadosLocal })
      : await prisma.local.create({ data: dadosLocal });

    for (const nomeBebida of bebidas) {
      const bebidaId = bebidasPorNome.get(nomeBebida);
      if (!bebidaId) throw new Error(`bebida "${nomeBebida}" não existe no seed`);
      await prisma.bebidaLocal.upsert({
        where: { localId_bebidaId: { localId: local.id, bebidaId } },
        create: { localId: local.id, bebidaId },
        update: {},
      });
    }
  }

  console.log('criando usuário demo...');
  const senhaHash = await bcrypt.hash(DEMO.senha, 10);
  const demo = await prisma.user.upsert({
    where: { email: DEMO.email },
    create: { nome: DEMO.nome, email: DEMO.email, senha: senhaHash, preferences: { create: {} } },
    update: { nome: DEMO.nome, senha: senhaHash },
  });
  await preferenciaService.salvarOnboarding(demo.id, DEMO.onboarding);

  for (const a of DEMO.avaliacoes) {
    const bebidaId = bebidasPorNome.get(a.bebida)!;
    await prisma.avaliacao.upsert({
      where: { userId_bebidaId: { userId: demo.id, bebidaId } },
      create: { userId: demo.id, bebidaId, nota: a.nota, comentario: a.comentario },
      update: { nota: a.nota, comentario: a.comentario },
    });
    await preferenciaService.recalcularNotasMedias([bebidaId]);
  }
  await preferenciaService.recalcular(demo.id);

  console.log(
    `seed concluído: ${DRINKS.length} drinks, ${VINHOS.length} vinhos, ${LOCAIS.length} locais, usuário ${DEMO.email} / ${DEMO.senha}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
