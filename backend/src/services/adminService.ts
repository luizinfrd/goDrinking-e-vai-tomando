// métricas offline do algoritmo para o painel admin (B11)
import { avaliarAlgoritmo, DadosParaMetricas, ModoAlgoritmo } from '../domain/metricas';
import { vetorBase, vetorDaBebida, vetorDePesos, vetorPercebido } from '../domain/sabor';
import { avaliacaoRepository } from '../repositories/avaliacaoRepository';
import { bebidaRepository } from '../repositories/bebidaRepository';
import { preferenciaRepository } from '../repositories/preferenciaRepository';

const MODOS: ModoAlgoritmo[] = ['conteudo', 'percepcao', 'hibrido'];

export const adminService = {
  async metricas(k = 5) {
    const [bebidas, percepcoes, preferencias, avaliacoes] = await Promise.all([
      bebidaRepository.listarVetores(),
      avaliacaoRepository.percepcoesPorBebida(),
      preferenciaRepository.listarTodas(),
      avaliacaoRepository.listarTodasParaMetricas(),
    ]);

    const dados: DadosParaMetricas = {
      bebidas: bebidas.map((b) => ({
        id: b.id,
        notaMedia: b.notaMedia,
        declarado: vetorDaBebida(b),
        percepcao: percepcoes.get(b.id) ?? null,
      })),
      usuarios: preferencias.map((p) => ({
        userId: p.userId,
        base: p.onboardingConcluido ? vetorBase(p) : null,
        vetorAtual: vetorDePesos(p),
        avaliacoes: avaliacoes
          .filter((a) => a.userId === p.userId)
          .map((a) => ({ bebidaId: a.bebidaId, nota: a.nota, percebido: vetorPercebido(a) })),
      })),
    };

    return {
      k,
      totais: { bebidas: bebidas.length, usuarios: preferencias.length, avaliacoes: avaliacoes.length },
      resultados: MODOS.map((modo) => avaliarAlgoritmo(dados, modo, k)),
    };
  },
};
