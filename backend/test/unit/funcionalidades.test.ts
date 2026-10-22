import { describe, expect, it } from 'vitest';
import {
  assertividade,
  contribuicoes,
  explicarColaborativo,
  ranquear,
  scoreHibrido,
  sinaisColaborativos,
  vetorEfetivoDaBebida,
  vizinhosMaisProximos,
} from '../../src/domain/recomendacao';
import { distanciaKm, proximidade, scoreComProximidade } from '../../src/domain/geo';
import { calcularConquistas } from '../../src/domain/conquistas';
import { avaliarAlgoritmo } from '../../src/domain/metricas';

const v = (doce: number, seco: number, citrico: number, encorpado: number) => ({ doce, seco, citrico, encorpado });

describe('contribuições por eixo', () => {
  it('somam ~100% e vêm em ordem decrescente', () => {
    const lista = contribuicoes(v(0.2, 0.8, 0.4, 0.6), v(0.1, 0.9, 0.2, 0.5));
    expect(lista.map((c) => c.dimensao)).toEqual(['seco', 'encorpado', 'citrico', 'doce']);
    expect(lista.reduce((s, c) => s + c.percentual, 0)).toBeGreaterThanOrEqual(99);
  });

  it('vetor nulo não tem contribuições', () => {
    expect(contribuicoes(v(0, 0, 0, 0), v(1, 1, 1, 1))).toEqual([]);
  });
});

describe('percepção', () => {
  const declarado = v(0.6, 0.1, 0.9, 0.3);

  it('sem respostas o vetor efetivo é o declarado', () => {
    expect(vetorEfetivoDaBebida(declarado, null)).toEqual(declarado);
  });

  it('peso do percebido = n / (n + 5)', () => {
    const efetivo = vetorEfetivoDaBebida(declarado, { total: 5, media: v(0.2, 0.1, 0.9, 0.3) });
    // metade declarado, metade percebido
    expect(efetivo.doce).toBeCloseTo(0.4);
    expect(efetivo.citrico).toBeCloseTo(0.9);
  });

  it('assertividade é 100% quando bate e cai com a diferença média', () => {
    expect(assertividade(declarado, declarado)).toBe(100);
    expect(assertividade(v(1, 1, 1, 1), v(0.6, 0.6, 0.6, 0.6))).toBe(60);
  });
});

describe('colaborativo', () => {
  it('escolhe os vizinhos por similaridade', () => {
    const vizinhos = vizinhosMaisProximos(v(1, 0, 0, 0), [
      { userId: 'parecido', vetor: v(0.9, 0.1, 0, 0) },
      { userId: 'oposto', vetor: v(0, 1, 0, 0) },
    ]);
    expect(vizinhos.map((x) => x.userId)).toEqual(['parecido']);
  });

  it('pondera a nota pela similaridade e normaliza para 0–1', () => {
    const sinais = sinaisColaborativos(
      [
        { userId: 'a', similaridade: 1 },
        { userId: 'b', similaridade: 0.5 },
      ],
      [
        { userId: 'a', bebidaId: 'x', nota: 5 },
        { userId: 'b', bebidaId: 'x', nota: 2 },
        { userId: 'fora', bebidaId: 'x', nota: 1 },
      ]
    );
    const sinal = sinais.get('x')!;
    expect(sinal.notaMedia).toBeCloseTo(4);
    expect(sinal.score).toBeCloseTo(0.75);
    expect(sinal.avaliadores).toBe(2);
    expect(explicarColaborativo(sinal)).toBe('Pessoas com paladar parecido com o seu deram 4,0');
  });

  it('híbrido = 0,8 conteúdo + 0,2 colaborativo; sem sinal fica o conteúdo', () => {
    expect(scoreHibrido(0.5)).toBe(0.5);
    expect(scoreHibrido(0.5, { score: 1, notaMedia: 5, avaliadores: 3 })).toBeCloseTo(0.6);
  });

  it('ranqueia pelo score e desempata pela nota média', () => {
    const ranking = ranquear(v(1, 0, 0, 0), [
      { id: 'a', notaMedia: 3, vetor: v(1, 0, 0, 0) },
      { id: 'b', notaMedia: 5, vetor: v(1, 0, 0, 0) },
      { id: 'c', notaMedia: 5, vetor: v(0, 1, 0, 0) },
    ]);
    expect(ranking.map((r) => r.id)).toEqual(['b', 'a', 'c']);
  });
});

describe('geo', () => {
  it('distância Campinas → São Paulo ≈ 84 km', () => {
    expect(distanciaKm(-22.9056, -47.0608, -23.5505, -46.6333)).toBeCloseTo(84, -1);
  });

  it('proximidade cai linearmente até a borda do raio', () => {
    expect(proximidade(0, 10)).toBe(1);
    expect(proximidade(5, 10)).toBe(0.5);
    expect(proximidade(20, 10)).toBe(0);
    expect(scoreComProximidade(1, 0)).toBeCloseTo(0.7);
  });
});

describe('conquistas', () => {
  const bebida = (id: string, extra: Partial<{ tipo: string; tipoVinho: string; paisOrigem: string; atributoCitrico: number }> = {}) => ({
    id,
    tipo: 'vinho',
    tipoVinho: 'tinto',
    paisOrigem: 'Chile',
    atributoCitrico: 0.2,
    ...extra,
  });

  it('calcula progresso e marca as conquistadas', () => {
    const conquistas = calcularConquistas(
      [
        { localId: 'l1', bebida: bebida('1', { paisOrigem: 'Chile' }) },
        { localId: 'l1', bebida: bebida('2', { paisOrigem: 'França' }) },
        { localId: null, bebida: bebida('3', { paisOrigem: 'Itália', atributoCitrico: 0.8 }) },
      ],
      2
    );
    const porId = Object.fromEntries(conquistas.map((c) => [c.id, c]));
    expect(porId['primeira-avaliacao'].conquistada).toBe(true);
    expect(porId['volta-ao-mundo'].conquistada).toBe(true);
    expect(porId['sommelier-de-tintos']).toMatchObject({ progresso: 3, meta: 5, conquistada: false });
    expect(porId['cacador-de-citricos']).toMatchObject({ progresso: 1, meta: 2 });
    expect(porId['explorador-de-bares'].progresso).toBe(1);
  });
});

describe('métricas leave-one-out', () => {
  it('acerta quando a bebida escondida é a mais parecida com o paladar', () => {
    const dados = {
      bebidas: [
        { id: 'seca1', notaMedia: 4, declarado: v(0, 1, 0, 0.5), percepcao: null },
        { id: 'seca2', notaMedia: 4, declarado: v(0, 0.9, 0, 0.6), percepcao: null },
        { id: 'seca3', notaMedia: 4, declarado: v(0.1, 0.9, 0, 0.4), percepcao: null },
        { id: 'doce', notaMedia: 4, declarado: v(1, 0, 0.2, 0), percepcao: null },
      ],
      usuarios: [
        {
          userId: 'u',
          base: v(0, 1, 0, 0.5),
          vetorAtual: v(0, 1, 0, 0.5),
          avaliacoes: [
            { bebidaId: 'seca1', nota: 5, percebido: null },
            { bebidaId: 'seca2', nota: 5, percebido: null },
            { bebidaId: 'seca3', nota: 5, percebido: null },
          ],
        },
      ],
    };
    const resultado = avaliarAlgoritmo(dados, 'conteudo', 1);
    expect(resultado.casos).toBe(3);
    expect(resultado.acertoNoTopK).toBe(1);
    expect(resultado.precisaoNoTopK).toBe(1);
  });
});
