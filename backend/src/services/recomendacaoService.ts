import { ConflitoError, NaoEncontradoError } from '../errors/AppError';
import { explicar, similaridadeCosseno } from '../domain/recomendacao';
import { ehVetorNulo, paraLista, vetorDaBebida, vetorDePesos } from '../domain/sabor';
import { avaliacaoRepository } from '../repositories/avaliacaoRepository';
import { bebidaRepository } from '../repositories/bebidaRepository';
import { localRepository } from '../repositories/localRepository';
import { preferenciaRepository } from '../repositories/preferenciaRepository';

export const CODIGO_ONBOARDING_PENDENTE = 'ONBOARDING_PENDENTE';

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

export const recomendacaoService = {
  async recomendar(userId: string, filtros: { tipo?: string; limite?: number } = {}) {
    const limite = filtros.limite ?? 10;
    const [vetorUsuario, jaAvaliadas] = await Promise.all([
      vetorDoUsuario(userId),
      avaliacaoRepository.idsDeBebidasAvaliadas(userId),
    ]);

    const bebidas = await bebidaRepository.candidatasParaRecomendacao({ excluirIds: jaAvaliadas, tipo: filtros.tipo });

    const comScore = bebidas.map(({ locais, ...bebida }) => {
      const vetorBebida = vetorDaBebida(bebida);
      return {
        ...bebida,
        score: similaridadeCosseno(paraLista(vetorUsuario), paraLista(vetorBebida)),
        motivo: explicar(vetorUsuario, vetorBebida),
        locais: locais.map((bl) => bl.local),
      };
    });

    // ordena pelo score e retorna as top N (em empate, a melhor avaliada primeiro)
    return comScore
      .sort((a, b) => b.score - a.score || b.notaMedia - a.notaMedia)
      .slice(0, limite)
      .map((bebida) => ({ ...bebida, score: Math.round(bebida.score * 100) / 100 }));
  },

  async recomendarLocais(userId: string, filtros: { limite?: number } = {}) {
    const limite = filtros.limite ?? 5;
    // pega as top 20 bebidas recomendadas e procura os locais que as oferecem
    const recomendadas = await recomendacaoService.recomendar(userId, { limite: 20 });
    const scorePorBebida = new Map(recomendadas.map((b) => [b.id, b.score]));
    const locais = await localRepository.comAlgumaDasBebidas([...scorePorBebida.keys()]);

    return locais
      .map((local) => {
        const scores = local.bebidas.map((bl) => scorePorBebida.get(bl.bebidaId) ?? 0);
        const scoreLocal = scores.reduce((soma, s) => soma + s, 0) / scores.length;
        return { ...local, scoreCompatibilidade: Math.round(scoreLocal * 100) / 100 };
      })
      // ordena antes de cortar, para retornar os realmente mais compatíveis
      .sort((a, b) => b.scoreCompatibilidade - a.scoreCompatibilidade)
      .slice(0, limite);
  },
};
