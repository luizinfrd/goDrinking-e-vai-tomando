/*
 * avaliação offline do algoritmo (material do TCC), por leave-one-out:
 * para cada avaliação "aprovada" (nota >= 4) de um usuário com pelo menos 3 avaliações,
 * esconde a avaliação, recalcula o vetor do usuário sem ela e verifica se a bebida
 * escondida aparece entre as k primeiras recomendações.
 * - acerto@k (recall@k): fração dos casos em que a escondida apareceu no top-k
 * - precisão@k: acertos / k (só existe uma bebida relevante escondida por caso)
 * - cobertura: fração do catálogo que apareceu em algum top-k
 */
import { calcularVetorPreferencia, vetorDaAvaliacao } from './preferencia';
import {
  Candidata,
  NotaDeUsuario,
  Percepcao,
  ranquear,
  sinaisColaborativos,
  vetorEfetivoDaBebida,
  vizinhosMaisProximos,
} from './recomendacao';
import { VetorSabor } from './sabor';

export type ModoAlgoritmo = 'conteudo' | 'percepcao' | 'hibrido';

export type DadosParaMetricas = {
  bebidas: { id: string; notaMedia: number; declarado: VetorSabor; percepcao: Percepcao | null }[];
  usuarios: {
    userId: string;
    base: VetorSabor | null;
    vetorAtual: VetorSabor;
    avaliacoes: { bebidaId: string; nota: number; percebido: VetorSabor | null }[];
  }[];
};

export type ResultadoMetricas = {
  modo: ModoAlgoritmo;
  k: number;
  casos: number;
  acertoNoTopK: number;
  precisaoNoTopK: number;
  cobertura: number;
};

export const NOTA_APROVADA = 4;
export const MINIMO_AVALIACOES = 3;

export function avaliarAlgoritmo(dados: DadosParaMetricas, modo: ModoAlgoritmo, k: number): ResultadoMetricas {
  const declarado = new Map(dados.bebidas.map((b) => [b.id, b.declarado]));
  const candidatasBase: Candidata[] = dados.bebidas.map((b) => ({
    id: b.id,
    notaMedia: b.notaMedia,
    vetor: modo === 'conteudo' ? b.declarado : vetorEfetivoDaBebida(b.declarado, b.percepcao),
  }));
  const todasAsNotas: NotaDeUsuario[] = dados.usuarios.flatMap((u) =>
    u.avaliacoes.map((a) => ({ userId: u.userId, bebidaId: a.bebidaId, nota: a.nota }))
  );

  let casos = 0;
  let acertos = 0;
  const recomendadas = new Set<string>();

  for (const usuario of dados.usuarios) {
    if (usuario.avaliacoes.length < MINIMO_AVALIACOES) continue;

    for (const escondida of usuario.avaliacoes.filter((a) => a.nota >= NOTA_APROVADA)) {
      const restantes = usuario.avaliacoes.filter((a) => a !== escondida);
      const vetor = calcularVetorPreferencia(
        usuario.base,
        restantes.map((a) => ({ nota: a.nota, vetor: vetorDaAvaliacao(declarado.get(a.bebidaId)!, a.percebido) }))
      );
      const jaAvaliadas = new Set(restantes.map((a) => a.bebidaId));
      const candidatas = candidatasBase.filter((c) => !jaAvaliadas.has(c.id));

      let sinais;
      if (modo === 'hibrido') {
        const outros = dados.usuarios
          .filter((u) => u.userId !== usuario.userId)
          .map((u) => ({ userId: u.userId, vetor: u.vetorAtual }));
        sinais = sinaisColaborativos(vizinhosMaisProximos(vetor, outros), todasAsNotas);
      }

      const topK = ranquear(vetor, candidatas, sinais).slice(0, k);
      topK.forEach((r) => recomendadas.add(r.id));
      casos += 1;
      if (topK.some((r) => r.id === escondida.bebidaId)) acertos += 1;
    }
  }

  const arredondar = (v: number) => Math.round(v * 1000) / 1000;
  return {
    modo,
    k,
    casos,
    acertoNoTopK: casos ? arredondar(acertos / casos) : 0,
    precisaoNoTopK: casos ? arredondar(acertos / (casos * k)) : 0,
    cobertura: dados.bebidas.length ? arredondar(recomendadas.size / dados.bebidas.length) : 0,
  };
}
