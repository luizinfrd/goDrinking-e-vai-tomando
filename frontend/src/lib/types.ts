// tipos espelhando as respostas da API

export type TipoBebida = 'drink' | 'vinho';

export type Sabor = {
  doce: number;
  seco: number;
  citrico: number;
  encorpado: number;
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
  _count?: { avaliacoes: number };
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

export type Avaliacao = {
  id: string;
  userId: string;
  bebidaId: string;
  nota: number;
  comentario: string | null;
  data: string;
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
};

export type LocalComBebidas = Local & { bebidas: BebidaResumo[] };

export type BebidaDetalhe = Bebida & {
  avaliacoes: Avaliacao[];
  locais: { local: Local }[];
  _count: { avaliacoes: number };
};

export type Recomendacao = Bebida & {
  score: number;
  motivo: string;
  locais: Pick<Local, 'id' | 'nome' | 'endereco' | 'tipo'>[];
};

export type Perfil = Usuario & {
  dataCriacao: string;
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
