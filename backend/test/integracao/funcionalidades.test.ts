import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { app, auth, criarBebida, criarUsuario, limparBanco, tornarAdmin } from '../helpers';

beforeEach(limparBanco);
afterAll(() => prisma.$disconnect());

const percepcao = { doce: 0.2, seco: 0.6, citrico: 0.3, encorpado: 0.7 };

async function avaliar(token: string, bebidaId: string, extra: Record<string, unknown> = {}) {
  const { body } = await request(app).post('/api/avaliacoes').set(auth(token)).send({ bebidaId, nota: 4, ...extra }).expect(201);
  return body;
}

describe('percepção dos usuários (B1)', () => {
  it('só mostra assertividade com 3 respostas e afeta o vetor de quem informou', async () => {
    const autor = await criarUsuario();
    const bebida = await criarBebida(autor.token); // declarado doce 0.4, seco 0.6, cítrico 0.3, encorpado 0.7

    const usuarios = [autor, await criarUsuario(), await criarUsuario()];
    await avaliar(usuarios[0].token, bebida.id, { percepcao });
    await avaliar(usuarios[1].token, bebida.id, { percepcao });

    let { body } = await request(app).get(`/api/bebidas/${bebida.id}`).expect(200);
    expect(body.percepcao).toMatchObject({ total: 2, assertividade: null });
    expect(body.percepcao.media.doce).toBeCloseTo(0.2);

    await avaliar(usuarios[2].token, bebida.id); // sem percepção não conta
    ({ body } = await request(app).get(`/api/bebidas/${bebida.id}`).expect(200));
    expect(body.percepcao.total).toBe(2);

    await prisma.avaliacao.updateMany({ where: { userId: usuarios[2].id }, data: { percebidoDoce: 0.2, percebidoSeco: 0.6, percebidoCitrico: 0.3, percebidoEncorpado: 0.7 } });
    ({ body } = await request(app).get(`/api/bebidas/${bebida.id}`).expect(200));
    // diferença média: |0.4-0.2| / 4 = 0.05 → 95%
    expect(body.percepcao).toMatchObject({ total: 3, assertividade: 95 });

    // o vetor do autor usa a percepção dele (doce 0.2), não o declarado (0.4): 0.2 × 4/5
    const me = await request(app).get('/api/usuarios/me').set(auth(usuarios[0].token)).expect(200);
    expect(me.body.preferencias.doce).toBeCloseTo(0.16);

    const lista = await request(app).get('/api/bebidas').expect(200);
    expect(lista.body[0].percepcao).toEqual({ total: 3, assertividade: 95 });
  });

  it('percepção fora de 0..1 é rejeitada', async () => {
    const { token } = await criarUsuario();
    const bebida = await criarBebida(token);
    await request(app).post('/api/avaliacoes').set(auth(token)).send({ bebidaId: bebida.id, nota: 3, percepcao: { ...percepcao, doce: 2 } }).expect(400);
  });
});

describe('diário (B8)', () => {
  it('guarda local e foto; local inexistente é 404', async () => {
    const admin = await criarUsuario();
    await tornarAdmin(admin.id);
    const bebida = await criarBebida(admin.token);
    const local = await request(app).post('/api/locais').set(auth(admin.token)).send({ nome: 'Bar', faixaPreco: 2 }).expect(201);

    await request(app)
      .post('/api/avaliacoes')
      .set(auth(admin.token))
      .send({ bebidaId: bebida.id, nota: 5, localId: '00000000-0000-4000-8000-000000000000' })
      .expect(404);
    await avaliar(admin.token, bebida.id, { localId: local.body.id, fotoUrl: 'https://exemplo.com/foto.jpg' });

    const { body } = await request(app).get('/api/avaliacoes/minhas').query({ bebidaId: bebida.id }).set(auth(admin.token)).expect(200);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ fotoUrl: 'https://exemplo.com/foto.jpg', local: { id: local.body.id, nome: 'Bar' } });
  });
});

describe('papel de admin (B13)', () => {
  it('só admin mantém locais', async () => {
    const comum = await criarUsuario();
    await request(app).post('/api/locais').set(auth(comum.token)).send({ nome: 'Bar' }).expect(403);
    await tornarAdmin(comum.id);
    await request(app).post('/api/locais').set(auth(comum.token)).send({ nome: 'Bar' }).expect(201);
  });

  it('bebida da comunidade: autor e admin editam, outro usuário não', async () => {
    const autor = await criarUsuario();
    const outro = await criarUsuario();
    const admin = await criarUsuario();
    await tornarAdmin(admin.id);

    const bebida = await criarBebida(autor.token);
    await request(app).put(`/api/bebidas/${bebida.id}`).set(auth(outro.token)).send({ nome: 'Outro' }).expect(403);
    await request(app).put(`/api/bebidas/${bebida.id}`).set(auth(autor.token)).send({ nome: 'Do autor' }).expect(200);
    await request(app).put(`/api/bebidas/${bebida.id}`).set(auth(admin.token)).send({ nome: 'Do admin' }).expect(200);

    // bebida do catálogo (criada por admin) não é editável pelo usuário comum
    const doCatalogo = await criarBebida(admin.token, { nome: 'Catálogo' });
    const { body } = await request(app).get(`/api/bebidas/${doCatalogo.id}`).expect(200);
    expect(body.criadoUser).toBe(false);
    await request(app).delete(`/api/bebidas/${doCatalogo.id}`).set(auth(autor.token)).expect(403);
  });

  it('admin modera avaliações de terceiros e o vetor do autor é recalculado', async () => {
    const autor = await criarUsuario();
    const admin = await criarUsuario();
    await tornarAdmin(admin.id);
    const bebida = await criarBebida(autor.token);
    const avaliacao = await avaliar(autor.token, bebida.id);

    await request(app).put(`/api/avaliacoes/${avaliacao.id}`).set(auth(admin.token)).send({ nota: 1 }).expect(403);
    await request(app).delete(`/api/avaliacoes/${avaliacao.id}`).set(auth(admin.token)).expect(204);
    const me = await request(app).get('/api/usuarios/me').set(auth(autor.token)).expect(200);
    expect(me.body.preferencias).toEqual({ doce: 0, seco: 0, citrico: 0, encorpado: 0 });
  });

  it('métricas exigem admin e respondem os três modos', async () => {
    const comum = await criarUsuario();
    await request(app).get('/api/admin/metricas').set(auth(comum.token)).expect(403);
    await tornarAdmin(comum.id);
    const { body } = await request(app).get('/api/admin/metricas').query({ k: 3 }).set(auth(comum.token)).expect(200);
    expect(body.resultados.map((r: { modo: string }) => r.modo)).toEqual(['conteudo', 'percepcao', 'hibrido']);
    expect(body.k).toBe(3);
  });
});

describe('favoritos (B3)', () => {
  it('adiciona de forma idempotente, lista e remove', async () => {
    const { token } = await criarUsuario();
    const bebida = await criarBebida(token);
    await request(app).post(`/api/favoritos/${bebida.id}`).set(auth(token)).expect(201);
    await request(app).post(`/api/favoritos/${bebida.id}`).set(auth(token)).expect(201);
    let { body } = await request(app).get('/api/favoritos').set(auth(token)).expect(200);
    expect(body.map((b: { id: string }) => b.id)).toEqual([bebida.id]);

    await request(app).delete(`/api/favoritos/${bebida.id}`).set(auth(token)).expect(204);
    ({ body } = await request(app).get('/api/favoritos').set(auth(token)).expect(200));
    expect(body).toEqual([]);

    await request(app).post('/api/favoritos/00000000-0000-4000-8000-000000000000').set(auth(token)).expect(404);
  });
});

describe('recomendações (B2, B4, B6, B7, B12)', () => {
  it('traz contribuições por eixo, filtra por harmonização e ordena locais pela distância', async () => {
    const admin = await criarUsuario();
    await tornarAdmin(admin.id);
    await request(app).put('/api/usuarios/me/preferencias').set(auth(admin.token)).send({ doce: 0.1, seco: 0.9, citrico: 0.1, encorpado: 0.9 }).expect(200);

    const tinto = await criarBebida(admin.token, { nome: 'Tinto', tipo: 'vinho', baseAlcoolica: undefined, tipoVinho: 'tinto', harmonizaCom: ['carnes-vermelhas'] });
    await criarBebida(admin.token, { nome: 'Doce', harmonizaCom: ['sobremesas'], atributoDoce: 1, atributoSeco: 0 });

    let { body } = await request(app).get('/api/recomendacoes').query({ harmoniza: 'carnes-vermelhas' }).set(auth(admin.token)).expect(200);
    expect(body.map((b: { nome: string }) => b.nome)).toEqual(['Tinto']);
    expect(body[0].contribuicoes[0].dimensao).toMatch(/seco|encorpado/);
    expect(body[0].scoreColaborativo).toBeNull();

    // dois locais servindo a mesma bebida: o mais perto vence
    const perto = await request(app).post('/api/locais').set(auth(admin.token)).send({ nome: 'Perto', latitude: -22.9, longitude: -47.06, faixaPreco: 3 }).expect(201);
    const longe = await request(app).post('/api/locais').set(auth(admin.token)).send({ nome: 'Longe', latitude: -22.98, longitude: -47.15, faixaPreco: 1 }).expect(201);
    for (const local of [perto, longe]) {
      await request(app).post(`/api/locais/${local.body.id}/bebidas`).set(auth(admin.token)).send({ bebidaId: tinto.id }).expect(201);
    }

    ({ body } = await request(app).get('/api/recomendacoes/locais').query({ lat: -22.9, lng: -47.06 }).set(auth(admin.token)).expect(200));
    expect(body.map((l: { nome: string }) => l.nome)).toEqual(['Perto', 'Longe']);
    expect(body[0].distanciaKm).toBe(0);
    expect(body[1].distanciaKm).toBeGreaterThan(10);

    ({ body } = await request(app).get('/api/recomendacoes/locais').query({ faixaPrecoMax: 2 }).set(auth(admin.token)).expect(200));
    expect(body.map((l: { nome: string }) => l.nome)).toEqual(['Longe']);
  });

  it('vizinhos de paladar parecido aparecem no motivo', async () => {
    const eu = await criarUsuario();
    const vizinhos = [await criarUsuario(), await criarUsuario()];
    const gosto = { doce: 0.1, seco: 0.9, citrico: 0.1, encorpado: 0.9 };
    for (const u of [eu, ...vizinhos]) {
      await request(app).put('/api/usuarios/me/preferencias').set(auth(u.token)).send(gosto).expect(200);
    }
    const bebida = await criarBebida(eu.token);
    for (const u of vizinhos) await avaliar(u.token, bebida.id, { nota: 5 });

    const { body } = await request(app).get('/api/recomendacoes').set(auth(eu.token)).expect(200);
    expect(body[0].motivo).toBe('Pessoas com paladar parecido com o seu deram 5,0');
    expect(body[0].scoreColaborativo).toBe(1);
  });

  it('perfil traz conquistas e papel', async () => {
    const { token } = await criarUsuario();
    const { body } = await request(app).get('/api/usuarios/me').set(auth(token)).expect(200);
    expect(body.papel).toBe('usuario');
    expect(body.conquistas.find((c: { id: string }) => c.id === 'primeira-avaliacao').conquistada).toBe(false);
  });
});
