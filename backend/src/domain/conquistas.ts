// conquistas calculadas a partir do histórico de avaliações (sem tabela própria)
export type AvaliacaoParaConquista = {
  localId: string | null;
  bebida: { tipo: string; tipoVinho: string | null; paisOrigem: string | null; atributoCitrico: number; id: string };
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

// bebidas com acidez marcante entram na conquista dos cítricos
export const LIMIAR_CITRICO = 0.7;

export function calcularConquistas(avaliacoes: AvaliacaoParaConquista[], totalCitricasNoCatalogo: number): Conquista[] {
  const vinhos = avaliacoes.filter((a) => a.bebida.tipo === 'vinho');
  const contar = <T>(itens: T[]) => new Set(itens).size;

  const definicoes: Omit<Conquista, 'conquistada'>[] = [
    {
      id: 'primeira-avaliacao',
      titulo: 'Primeiro brinde',
      descricao: 'Avaliou a primeira bebida',
      icone: 'celebration',
      progresso: avaliacoes.length,
      meta: 1,
    },
    {
      id: 'sommelier-de-tintos',
      titulo: 'Sommelier de tintos',
      descricao: 'Avaliou 5 vinhos tintos',
      icone: 'wine_bar',
      progresso: vinhos.filter((a) => a.bebida.tipoVinho?.toLowerCase() === 'tinto').length,
      meta: 5,
    },
    {
      id: 'volta-ao-mundo',
      titulo: 'Volta ao mundo',
      descricao: 'Provou vinhos de 3 países',
      icone: 'public',
      progresso: contar(vinhos.map((a) => a.bebida.paisOrigem).filter(Boolean)),
      meta: 3,
    },
    {
      id: 'mestre-da-coquetelaria',
      titulo: 'Mestre da coquetelaria',
      descricao: 'Avaliou 10 drinks',
      icone: 'local_bar',
      progresso: avaliacoes.filter((a) => a.bebida.tipo === 'drink').length,
      meta: 10,
    },
    {
      id: 'cacador-de-citricos',
      titulo: 'Caçador de cítricos',
      descricao: 'Provou todas as bebidas cítricas do catálogo',
      icone: 'nutrition',
      progresso: contar(avaliacoes.filter((a) => a.bebida.atributoCitrico >= LIMIAR_CITRICO).map((a) => a.bebida.id)),
      meta: Math.max(totalCitricasNoCatalogo, 1),
    },
    {
      id: 'explorador-de-bares',
      titulo: 'Explorador de bares',
      descricao: 'Registrou degustações em 10 locais diferentes',
      icone: 'distance',
      progresso: contar(avaliacoes.map((a) => a.localId).filter(Boolean)),
      meta: 10,
    },
  ];

  return definicoes.map((c) => ({ ...c, progresso: Math.min(c.progresso, c.meta), conquistada: c.progresso >= c.meta }));
}
