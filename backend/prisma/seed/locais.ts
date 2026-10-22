// locais do seed (o cardápio de cada um é ilustrativo)
import { LocalSeed } from './tipos';

// fictícios, em ruas reais de Campinas/SP (lote original do MVP)
const FICTICIOS: LocalSeed[] = [
  {
    nome: 'Âmbar Speakeasy', tipo: 'bar', endereco: 'Rua Coronel Quirino, Cambuí — Campinas/SP',
    latitude: -22.8946, longitude: -47.0496,
    faixaPreco: 3,
    imagem: '/img/locais/ambar-speakeasy.jpg',
    descricao: 'Bar escondido com luz baixa e coquetelaria autoral à base de whiskey e gin.',
    bebidas: ['Negroni', 'Old Fashioned', 'Whiskey Sour', 'Espresso Martini', 'Gin Tônica', 'Malbec Mendoza'],
  },
  {
    nome: 'Rooftop Cambuí', tipo: 'bar', endereco: 'Av. Júlio de Mesquita, Cambuí — Campinas/SP',
    latitude: -22.8915, longitude: -47.0468,
    faixaPreco: 4,
    imagem: '/img/locais/rooftop-cambui.jpg',
    descricao: 'Terraço com vista para a cidade, drinks refrescantes e espumantes.',
    bebidas: ['Aperol Spritz', 'Gin Tônica', 'Mojito', 'Cosmopolitan', 'Espumante Brut Vale dos Vinhedos', 'Rosé Côtes de Provence', "Moscato d'Asti"],
  },
  {
    nome: 'Adega Taquaral', tipo: 'adega', endereco: 'Av. Heitor Penteado, Taquaral — Campinas/SP',
    latitude: -22.8735, longitude: -47.0573,
    faixaPreco: 3,
    imagem: '/img/locais/adega-taquaral.jpg',
    descricao: 'Adega com degustação de rótulos sul-americanos e europeus.',
    bebidas: ['Malbec Mendoza', 'Cabernet Sauvignon Valle del Maipo', 'Carménère Reserva', 'Tannat Canelones', 'Merlot Serra Gaúcha', 'Pinot Noir Bourgogne', 'Chardonnay Napa Valley'],
  },
  {
    nome: 'Boteco do Barão', tipo: 'bar', endereco: 'Av. Albino J. B. de Oliveira, Barão Geraldo — Campinas/SP',
    latitude: -22.8188, longitude: -47.0716,
    faixaPreco: 1,
    imagem: '/img/locais/boteco-do-barao.jpg',
    descricao: 'Boteco universitário com caipirinhas generosas e clima descontraído.',
    bebidas: ['Caipirinha', 'Mojito', 'Moscow Mule', 'Margarita', 'Piña Colada'],
  },
  {
    nome: 'Enoteca Centro', tipo: 'restaurante', endereco: 'Rua Barão de Jaguara, Centro — Campinas/SP',
    latitude: -22.9058, longitude: -47.0606,
    faixaPreco: 4,
    imagem: '/img/locais/enoteca-centro.jpg',
    descricao: 'Restaurante italiano com carta de vinhos premiada e harmonizações.',
    bebidas: ['Pinot Noir Bourgogne', 'Riesling Mosel', 'Sauvignon Blanc Marlborough', "Moscato d'Asti", 'Rosé Côtes de Provence', 'Negroni', 'Aperol Spritz'],
  },
  {
    nome: 'Largo do Rosário Bar', tipo: 'bar', endereco: 'Largo do Rosário, Centro — Campinas/SP',
    latitude: -22.9033, longitude: -47.0588,
    faixaPreco: 2,
    imagem: '/img/locais/largo-do-rosario-bar.jpg',
    descricao: 'Clássicos bem executados no coração do centro histórico.',
    bebidas: ['Caipirinha', 'Old Fashioned', 'Margarita', 'Whiskey Sour', 'Cosmopolitan', 'Merlot Serra Gaúcha'],
  },
  {
    nome: 'Varanda Guanabara', tipo: 'restaurante', endereco: 'Rua Barreto Leme, Guanabara — Campinas/SP',
    latitude: -22.8987, longitude: -47.0708,
    faixaPreco: 3,
    imagem: '/img/locais/varanda-guanabara.jpg',
    descricao: 'Varanda arborizada, cozinha brasileira e vinhos nacionais.',
    bebidas: ['Merlot Serra Gaúcha', 'Espumante Brut Vale dos Vinhedos', 'Caipirinha', 'Chardonnay Napa Valley', 'Carménère Reserva'],
  },
  {
    nome: 'Lagoa Lounge', tipo: 'bar', endereco: 'Av. Dr. Heitor Penteado, Lagoa do Taquaral — Campinas/SP',
    latitude: -22.8762, longitude: -47.0521,
    faixaPreco: 3,
    imagem: '/img/locais/lagoa-lounge.jpg',
    descricao: 'Lounge à beira da lagoa com drinks tropicais ao pôr do sol.',
    bebidas: ['Piña Colada', 'Mojito', 'Aperol Spritz', 'Moscow Mule', 'Espresso Martini', 'Sauvignon Blanc Marlborough'],
  },
];

// estabelecimentos reais de Campinas/SP, conferidos em funcionamento em 2026-10 (fontes no README).
// as fotos são de bancos livres, genéricas: não são do próprio estabelecimento
const REAIS: LocalSeed[] = [
  {
    nome: 'Banana Café Bar', tipo: 'bar', endereco: 'Rua General Osório, 2090 — Cambuí, Campinas/SP',
    latitude: -22.9006912, longitude: -47.0506174,
    faixaPreco: 3,
    imagem: '/img/locais/banana-cafe-bar.jpg',
    descricao: 'Gastrobar no Cambuí com drinks autorais e cozinha criativa, com pátio ao ar livre.',
    bebidas: ['Margarita', 'Paloma', 'Negroni', 'Mai Tai', 'Whiskey Sour', 'Espresso Martini', 'Tom Collins', 'Penicillin', 'Gin Tônica'],
  },
  {
    nome: 'Memória Bar', tipo: 'bar', endereco: 'Rua Quirino do Amaral Campos, 21 — Cambuí, Campinas/SP',
    latitude: -22.8906996, longitude: -47.0470286,
    faixaPreco: 3,
    imagem: '/img/locais/memoria-bar.jpg',
    descricao: 'Bar de coquetelaria no Cambuí, com carta de drinks autorais.',
    bebidas: ['Gin Tônica', 'Penicillin', 'Espresso Martini', 'Aperol Spritz', 'Whiskey Sour', 'Mai Tai', 'Tom Collins', 'Margarita', 'Paloma'],
  },
  {
    nome: 'SeoRosa Cambuí', tipo: 'bar', endereco: 'Rua Doutor Emílio Ribas, 567 — Cambuí, Campinas/SP',
    latitude: -22.8995526, longitude: -47.0501781,
    faixaPreco: 3,
    imagem: '/img/locais/seorosa-cambui.jpg',
    descricao: 'Bar e restaurante no Cambuí, aberto desde 2000, com carta de drinks autorais, cervejas e vinhos.',
    bebidas: ['Fitzgerald', 'Whiskey Sour', 'Paloma', 'Gin Tônica', 'Boulevardier', 'Espresso Martini', 'Aperol Spritz', 'Tom Collins', 'Margarita'],
  },
  {
    nome: "Grainne's Irish Pub", tipo: 'bar', endereco: 'Rua Padre Almeida, 170 — Cambuí, Campinas/SP',
    latitude: -22.8995126, longitude: -47.0491839,
    faixaPreco: 2,
    imagem: '/img/locais/grainnes-irish-pub.jpg',
    descricao: 'Pub de estilo irlandês no Cambuí, com chope, carta de drinks e música ao vivo.',
    bebidas: ['Tom Collins', 'Gin Tônica', 'Aperol Spritz', 'Clericot', 'Tannat Canelones', 'Pinot Noir Bourgogne', 'Malbec Mendoza', 'Porto Tawny'],
  },
  {
    nome: 'Bar Santa Genebra', tipo: 'bar', endereco: 'Rua Ângelo Vicentim, 736 — Barão Geraldo, Campinas/SP',
    latitude: -22.8310166, longitude: -47.0819766,
    faixaPreco: 1,
    imagem: '/img/locais/bar-santa-genebra.jpg',
    descricao: 'Boteco tradicional de Barão Geraldo, com cerveja gelada e porções de comida brasileira.',
    bebidas: ['Mojito', 'Caipiroska de Frutas Vermelhas', 'Rabo de Galo', 'Batida de Coco', 'Clericot', 'Moscow Mule'],
  },
  {
    nome: 'Bar Candreva Barão Geraldo', tipo: 'bar', endereco: 'Avenida Albino José Barbosa de Oliveira, 1240 — Barão Geraldo, Campinas/SP',
    latitude: -22.8272589, longitude: -47.0791188,
    faixaPreco: 2,
    imagem: '/img/locais/bar-candreva-barao-geraldo.jpg',
    descricao: 'Unidade em Barão Geraldo da rede de bares Candreva, com chope, petiscos e buffet de grelhados.',
    bebidas: ['Clericot', 'Caipirinha', 'Moscow Mule', 'Rabo de Galo', 'Mojito', 'Batida de Coco'],
  },
  {
    nome: 'Buteco Seu Rufino', tipo: 'bar', endereco: 'Rua Padre Almeida, 167 — Cambuí, Campinas/SP',
    latitude: -22.89955, longitude: -47.04925, // aproximada: posição na rua, sem o número exato no OpenStreetMap
    faixaPreco: 2,
    imagem: '/img/locais/buteco-seu-rufino.jpg',
    descricao: 'Unidade no Cambuí do Buteco Seu Rufino, com comida de boteco, chope e caipirinhas autorais.',
    bebidas: ['Gin Tônica', 'Moscow Mule', 'Caipiroska de Frutas Vermelhas', 'Bloody Mary', 'Caipirinha', 'Clericot'],
  },
  {
    nome: 'Giovannetti Rosário', tipo: 'bar', endereco: 'Rua General Osório, 1059 — Centro, Campinas/SP',
    latitude: -22.9037832, longitude: -47.0596805,
    faixaPreco: 2,
    imagem: '/img/locais/giovannetti-rosario.jpg',
    descricao: 'Bar tradicional no Centro, fundado em 1937, onde surgiu o sanduíche Boquinha de Anjo.',
    bebidas: ['Rabo de Galo', 'Moscow Mule', 'Caipirinha', 'Batida de Coco', 'Clericot', 'Gin Tônica'],
  },
  {
    nome: 'Dom Brejas', tipo: 'bar', endereco: 'Avenida Barão de Itapura, 2947 — Taquaral, Campinas/SP',
    latitude: -22.8809711, longitude: -47.0555428,
    faixaPreco: 2,
    imagem: '/img/locais/dom-brejas.jpg',
    descricao: 'Cervejaria e choperia no Taquaral, com chope, drinks e petiscos.',
    bebidas: ['Moscow Mule', 'Mojito', 'Gin Tônica', 'Clericot', 'Merlot Serra Gaúcha', 'Syrah Vale do São Francisco', 'Rosé Côtes de Provence', 'Espumante Brut Vale dos Vinhedos'],
  },
  {
    nome: 'Entre Taças Restaurante e Wine Bar', tipo: 'adega', endereco: 'Rua Doutor Emílio Ribas, 1151 — Cambuí, Campinas/SP',
    latitude: -22.89431, longitude: -47.05095, // aproximada: posição na rua, sem o número exato no OpenStreetMap
    faixaPreco: 3,
    imagem: '/img/locais/entre-tacas.jpg',
    descricao: 'Wine bar e restaurante no Cambuí, com carta de vinhos de vários países e drinks.',
    bebidas: ['Malbec Mendoza', 'Riesling Mosel', 'Cabernet Sauvignon Valle del Maipo', 'Prosecco', 'Sauvignon Blanc Marlborough', 'Chardonnay Napa Valley', 'Porto Tawny', 'Merlot Serra Gaúcha', 'Rosé Côtes de Provence'],
  },
  {
    nome: 'Olivetto Restaurante e Enoteca', tipo: 'restaurante', endereco: 'Avenida Coronel Silva Telles, 843 — Cambuí, Campinas/SP',
    latitude: -22.89383, longitude: -47.0494, // aproximada: posição na rua, sem o número exato no OpenStreetMap
    faixaPreco: 4,
    imagem: '/img/locais/olivetto.jpg',
    descricao: 'Restaurante e enoteca no Cambuí, com carta de vinhos de mais de mil rótulos e sommeliers.',
    bebidas: ['Vinho Verde Alvarinho', 'Prosecco', 'Douro Tinto', 'Riesling Mosel', "Moscato d'Asti", 'Malbec Mendoza', 'Porto Tawny', 'Pinot Noir Bourgogne', 'Cabernet Sauvignon Valle del Maipo'],
  },
  {
    nome: 'Ramalho Experience', tipo: 'restaurante', endereco: 'Avenida Lafayete Arruda Camargo, 38 — Parque São Quirino, Campinas/SP',
    latitude: -22.8598, longitude: -47.0368, // aproximada: posição na rua, sem o número exato no OpenStreetMap
    faixaPreco: 3,
    imagem: '/img/locais/ramalho-experience.jpg',
    descricao: 'Wine bar e churrascaria do grupo Ramalho, com carta de vinhos assinada por sommelier e vinho em taça.',
    bebidas: ['Rioja Crianza', 'Cabernet Sauvignon Valle del Maipo', 'Prosecco', 'Syrah Vale do São Francisco', 'Malbec Mendoza', 'Chianti Classico', 'Vinho Verde Alvarinho', 'Tannat Canelones', 'Riesling Mosel'],
  },
];

export const LOCAIS: LocalSeed[] = [...FICTICIOS, ...REAIS];
