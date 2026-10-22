// tipos espelhando as respostas da API

export type TipoBebida = 'drink' | 'vinho';

export type Sabor = {
  doce: number;
  seco: number;
  citrico: number;
  encorpado: number;
};

export type Harmonizacao =
  | 'carnes-vermelhas'
  | 'aves'
  | 'peixes-frutos-do-mar'
  | 'massas'
  | 'queijos'
  | 'sobremesas'
  | 'petiscos';

// percepção dos atributos segundo quem provou (média das avaliações que informaram)
export type ResumoPercepcao = {
  total: number;
  assertividade: number | null;
};

export type Percepcao = ResumoPercepcao & {
  media: Sabor | null;
  pesoNoAlgoritmo: number;
};

export type Bebida = {
  id: string;
  nome: string;
  tipo: TipoBebida;
  descricao: string | null;
  imagemUrl: string | null;
  atributoDoce: number;
  atributoSeco: number;
  atributoCitrico: number;
  atributoEncorpado: number;
  notaMedia: number;
  criadoUser: boolean;
  tipoVinho: string | null;
  uva: string | null;
  paisOrigem: string | null;
  ingredientes: string | null;
  baseAlcoolica: string | null;
  harmonizaCom: Harmonizacao[];
  criadoPorId: string | null;
  _count?: { avaliacoes: number };
  percepcao?: ResumoPercepcao;
};

export type BebidaResumo = Pick<
  Bebida,
  'id' | 'nome' | 'tipo' | 'notaMedia' | 'imagemUrl' | 'tipoVinho' | 'baseAlcoolica'
> & { descricao?: string | null };

export type Usuario = {
  id: string;
  nome: string;
  email: string;
};

export type LocalResumo = { id: string; nome: string };

export type Avaliacao = {
  id: string;
  userId: string;
  bebidaId: string;
  nota: number;
  comentario: string | null;
  data: string;
  percebidoDoce: number | null;
  percebidoSeco: number | null;
  percebidoCitrico: number | null;
  percebidoEncorpado: number | null;
  localId: string | null;
  fotoUrl: string | null;
  local?: LocalResumo | null;
  user?: { id: string; nome: string };
  bebida?: BebidaResumo;
};

export type Local = {
  id: string;
  nome: string;
  tipo: string | null;
  endereco: string | null;
  descricao: string | null;
  imagemUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  faixaPreco: number | null;
};

export type LocalComBebidas = Local & { bebidas: BebidaResumo[] };

export type BebidaDetalhe = Omit<Bebida, 'percepcao'> & {
  avaliacoes: Avaliacao[];
  locais: { local: Local }[];
  _count: { avaliacoes: number };
  percepcao: Percepcao;
};

export type Contribuicao = { dimensao: keyof Sabor; percentual: number };

export type Recomendacao = Bebida & {
  score: number;
  scoreConteudo: number;
  scoreColaborativo: number | null;
  motivo: string;
  contribuicoes: Contribuicao[];
  locais: Pick<Local, 'id' | 'nome' | 'endereco' | 'tipo'>[];
};

export type LocalRecomendado = Local & {
  scoreCompatibilidade: number;
  scoreSabor: number;
  favoritasNoLocal: number;
  distanciaKm: number | null;
  bebidas: { bebida: { id: string; nome: string; tipo: string } }[];
};

export type Conquista = {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  progresso: number;
  meta: number;
  conquistada: boolean;
};

export type Favorito = BebidaResumo & { favoritadoEm: string };

export type ResultadoMetricas = {
  modo: 'conteudo' | 'percepcao' | 'hibrido';
  k: number;
  casos: number;
  acertoNoTopK: number;
  precisaoNoTopK: number;
  cobertura: number;
};

export type Metricas = {
  k: number;
  totais: { bebidas: number; usuarios: number; avaliacoes: number };
  resultados: ResultadoMetricas[];
};

export type Perfil = Usuario & {
  dataCriacao: string;
  papel: 'usuario' | 'admin';
  conquistas: Conquista[];
  onboardingConcluido: boolean;
  preferencias: Sabor | null;
  preferenciasBase: Sabor | null;
  estatisticas: {
    totalAvaliacoes: number;
    mediaNotas: number;
    drinks: number;
    vinhos: number;
  };
};
