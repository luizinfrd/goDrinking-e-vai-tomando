// aprendizado do vetor de preferências (RF24), sem acesso a banco
import { arredondar, criarVetor, DIMENSOES, VETOR_ZERO, VetorSabor } from './sabor';

export type AvaliacaoParaVetor = { nota: number; vetor: VetorSabor };

/*
 * média ponderada entre o vetor do onboarding (peso 1) e cada avaliação,
 * onde o valor de cada avaliação = vetor da bebida × (nota / 5).
 * é exatamente a fórmula novo_score = (score_atual × n + valor) / (n + 1)
 * aplicada em sequência, mas recalculada do zero — assim editar ou
 * excluir uma avaliação também deixa o vetor correto.
 * sem onboarding (base null) o vetor base não entra na média.
 */
export function calcularVetorPreferencia(base: VetorSabor | null, avaliacoes: AvaliacaoParaVetor[]): VetorSabor {
  const soma = { ...(base ?? VETOR_ZERO) };
  for (const { nota, vetor } of avaliacoes) {
    const fator = nota / 5;
    for (const d of DIMENSOES) soma[d] += vetor[d] * fator;
  }
  const n = (base ? 1 : 0) + avaliacoes.length;
  const divisor = n === 0 ? 1 : n;
  return criarVetor((d) => arredondar(soma[d] / divisor));
}

// o que a avaliação ensina sobre o paladar: a percepção do próprio usuário, se ele informou; senão, o catálogo
export function vetorDaAvaliacao(declarado: VetorSabor, percebido: VetorSabor | null): VetorSabor {
  return percebido ?? declarado;
}
