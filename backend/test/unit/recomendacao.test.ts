import { describe, expect, it } from 'vitest';
import { explicar, similaridadeCosseno } from '../../src/domain/recomendacao';
import { calcularVetorPreferencia } from '../../src/domain/preferencia';

describe('similaridadeCosseno', () => {
  it('vale 1 para vetores na mesma direção', () => {
    expect(similaridadeCosseno([1, 2, 0, 1], [2, 4, 0, 2])).toBeCloseTo(1);
  });

  it('vale 0 para vetores ortogonais ou nulos', () => {
    expect(similaridadeCosseno([1, 0, 0, 0], [0, 1, 0, 0])).toBe(0);
    expect(similaridadeCosseno([0, 0, 0, 0], [0.5, 0.5, 0.5, 0.5])).toBe(0);
  });

  it('confere com o cálculo manual', () => {
    // (0.3·0.4 + 0.7·0.6 + 0.5·0.3 + 0.8·0.7) / (‖u‖‖b‖)
    const u = [0.3, 0.7, 0.5, 0.8];
    const b = [0.4, 0.6, 0.3, 0.7];
    const esperado = 1.25 / (Math.sqrt(1.47) * Math.sqrt(1.1));
    expect(similaridadeCosseno(u, b)).toBeCloseTo(esperado, 10);
  });
});

describe('explicar', () => {
  it('cita as duas dimensões de maior contribuição', () => {
    const texto = explicar({ doce: 0.1, seco: 0.9, citrico: 0.2, encorpado: 0.8 }, { doce: 0.1, seco: 0.6, citrico: 0.1, encorpado: 1 });
    expect(texto).toBe('Porque você gosta de bebidas encorpadas e secas');
  });

  it('usa a frase genérica quando nada contribui', () => {
    expect(explicar({ doce: 1, seco: 0, citrico: 0, encorpado: 0 }, { doce: 0, seco: 1, citrico: 0, encorpado: 0 })).toBe(
      'Uma sugestão para ampliar seu repertório'
    );
  });
});

describe('calcularVetorPreferencia', () => {
  const base = { doce: 0.3, seco: 0.7, citrico: 0.5, encorpado: 0.8 };
  const bebida = { doce: 0.4, seco: 0.6, citrico: 0.3, encorpado: 0.7 };

  it('sem avaliações é o próprio vetor base', () => {
    expect(calcularVetorPreferencia(base, [])).toEqual(base);
  });

  it('aplica novo = (atual × n + atributo × nota/5) / (n + 1)', () => {
    const vetor = calcularVetorPreferencia(base, [{ nota: 5, vetor: bebida }]);
    expect(vetor.doce).toBeCloseTo((0.3 + 0.4) / 2);
    expect(vetor.encorpado).toBeCloseTo((0.8 + 0.7) / 2);
  });

  it('sem onboarding usa só as avaliações', () => {
    const vetor = calcularVetorPreferencia(null, [{ nota: 4, vetor: bebida }]);
    expect(vetor.seco).toBeCloseTo(0.6 * 0.8);
  });

  it('sem nada devolve vetor nulo', () => {
    expect(calcularVetorPreferencia(null, [])).toEqual({ doce: 0, seco: 0, citrico: 0, encorpado: 0 });
  });
});
