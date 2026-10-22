import { ConflitoError, NaoEncontradoError } from '../errors/AppError';
import { distanciaKm, proximidade, scoreComProximidade } from '../domain/geo';
import {
  contribuicoes,
  explicar,
  explicarColaborativo,
  ranquear,
  sinaisColaborativos,
  vetorEfetivoDaBebida,
  vizinhosMaisProximos,
} from '../domain/recomendacao';
import { ehVetorNulo, vetorDaBebida, vetorDePesos } from '../domain/sabor';
import { avaliacaoRepository } from '../repositories/avaliacaoRepository';
import { bebidaRepository } from '../repositories/bebidaRepository';
import { favoritoRepository } from '../repositories/favoritoRepository';
import { localRepository } from '../repositories/localRepository';
import { preferenciaRepository } from '../repositories/preferenciaRepository';

export const CODIGO_ONBOARDING_PENDENTE = 'ONBOARDING_PENDENTE';

const RAIO_PADRAO_KM = 10;
// cada bebida favoritada que o local serve soma um pouco, até um teto
const BONUS_POR_FAVORITO = 0.05;
const BONUS_MAXIMO_FAVORITOS = 0.15;

const duasCasas = (v: number) => Math.round(v * 100) / 100;

async function vetorDoUsuario(userId: string) {
  const preferencia = await preferenciaRepository.buscar(userId);
  if (!preferencia) {
    throw new NaoEncontradoError('Preferências do usuário não encontradas');
  }

  const vetor = vetorDePesos(preferencia);
  // cold start: sem onboarding e sem avaliações não há como recomendar
  if (!preferencia.onboardingConcluido && ehVetorNulo(vetor)) {
    throw new ConflitoError('Conclua o onboarding de paladar para receber recomendações', CODIGO_ONBOARDING_PENDENTE);
  }
  return vetor;
}

type FiltrosRecomendacao = { tipo?: string; harmoniza?: string; limite?: number };
type FiltrosLocais = { limite?: number; posicao?: { lat: number; lng: number }; raioKm?: number; faixaPrecoMax?: number };

export const recomendacaoService = {
  /*
   * 1. vetor do usuário × vetor efetivo de cada bebida não avaliada (declarado + percepção dos usuários)
   * 2. similaridade cosseno = score de conteúdo
   * 3. 20% do score vem das notas dos 10 usuários de paladar mais parecido (quando avaliaram a bebida)
   */
  async recomendar(userId: string, filtros: FiltrosRecomendacao = {}) {
    const limite = filtros.limite ?? 10;
    const [vetorUsuario, jaAvaliadas, outros] = await Promise.all([
      vetorDoUsuario(userId),
      avaliacaoRepository.idsDeBebidasAvaliadas(userId),
      preferenciaRepository.listarVetoresExceto(userId),
    ]);

    const vizinhos = vizinhosMaisProximos(
      vetorUsuario,
      outros.map((o) => ({ userId: o.userId, vetor: vetorDePesos(o) }))
    );
    const [bebidas, percepcoes, notasDosVizinhos] = await Promise.all([
      bebidaRepository.candidatasParaRecomendacao({ excluirIds: jaAvaliadas, tipo: filtros.tipo, harmoniza: filtros.harmoniza }),
      avaliacaoRepository.percepcoesPorBebida(),
      avaliacaoRepository.notasDosUsuarios(vizinhos.map((v) => v.userId)),
    ]);
    const sinais = sinaisColaborativos(vizinhos, notasDosVizinhos);

    const porId = new Map(bebidas.map((b) => [b.id, b]));
    const vetores = new Map(bebidas.map((b) => [b.id, vetorEfetivoDaBebida(vetorDaBebida(b), percepcoes.get(b.id))]));
    const ranking = ranquear(
      vetorUsuario,
      bebidas.map((b) => ({ id: b.id, notaMedia: b.notaMedia, vetor: vetores.get(b.id)! })),
      sinais
    ).slice(0, limite);

    return ranking.map((r) => {
      const { locais, ...bebida } = porId.get(r.id)!;
      const vetor = vetores.get(r.id)!;
      return {
        ...bebida,
        score: duasCasas(r.score),
        scoreConteudo: duasCasas(r.scoreConteudo),
        scoreColaborativo: r.sinal ? duasCasas(r.sinal.score) : null,
        motivo: explicarColaborativo(r.sinal) ?? explicar(vetorUsuario, vetor),
        contribuicoes: contribuicoes(vetorUsuario, vetor),
        locais: locais.map((bl) => bl.local),
      };
    });
  },

  // locais que servem as bebidas mais recomendadas; com posição, a proximidade pesa 30% (B4)
  async recomendarLocais(userId: string, filtros: FiltrosLocais = {}) {
    const limite = filtros.limite ?? 5;
    const [recomendadas, favoritos] = await Promise.all([
      recomendacaoService.recomendar(userId, { limite: 20 }),
      favoritoRepository.idsDasBebidas(userId),
    ]);
    const scorePorBebida = new Map(recomendadas.map((b) => [b.id, b.score]));
    const favoritas = new Set(favoritos);
    const locais = await localRepository.comAlgumaDasBebidas([...new Set([...scorePorBebida.keys(), ...favoritos])], {
      faixaPrecoMax: filtros.faixaPrecoMax,
    });

    return locais
      .map((local) => {
        const scores = local.bebidas.map((bl) => scorePorBebida.get(bl.bebidaId)).filter((s) => s !== undefined);
        const media = scores.length ? scores.reduce((soma, s) => soma + s, 0) / scores.length : 0;
        const totalFavoritas = local.bebidas.filter((bl) => favoritas.has(bl.bebidaId)).length;
        const scoreSabor = Math.min(1, media + Math.min(BONUS_MAXIMO_FAVORITOS, totalFavoritas * BONUS_POR_FAVORITO));

        const { posicao } = filtros;
        const distancia =
          posicao && local.latitude !== null && local.longitude !== null
            ? distanciaKm(posicao.lat, posicao.lng, local.latitude, local.longitude)
            : null;
        const score = posicao
          ? scoreComProximidade(scoreSabor, distancia === null ? 0 : proximidade(distancia, filtros.raioKm ?? RAIO_PADRAO_KM))
          : scoreSabor;

        return {
          ...local,
          // só as recomendadas aparecem como motivo; as favoritas entram no bônus
          bebidas: local.bebidas.filter((bl) => scorePorBebida.has(bl.bebidaId) || favoritas.has(bl.bebidaId)),
          scoreCompatibilidade: duasCasas(score),
          scoreSabor: duasCasas(scoreSabor),
          favoritasNoLocal: totalFavoritas,
          distanciaKm: distancia === null ? null : Math.round(distancia * 10) / 10,
        };
      })
      // ordena antes de cortar, para retornar os realmente mais compatíveis
      .sort((a, b) => b.scoreCompatibilidade - a.scoreCompatibilidade)
      .slice(0, limite);
  },
};
