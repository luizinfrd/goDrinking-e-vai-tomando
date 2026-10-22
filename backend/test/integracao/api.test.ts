import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { app, auth, criarBebida, criarUsuario, limparBanco } from '../helpers';

beforeEach(limparBanco);
afterAll(() => prisma.$disconnect());

describe('infra', () => {
  it('health confere o banco', async () => {
    await request(app).get('/health').expect(200, { status: 'ok', message: 'servidor rodando!' });
  });

  it('rota inexistente devolve 404 padronizado', async () => {
    const { body } = await request(app).get('/api/nada').expect(404);
    expect(body).toEqual({ error: 'Rota não encontrada' });
  });

  it('json inválido devolve 400', async () => {
    await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{x').expect(400);
  });
});

describe('auth', () => {
  it('registros simultâneos com o mesmo e-mail: um 201 e um 409', async () => {
    const dados = { nome: 'Ana', email: 'ana@teste.com', senha: 'senha12345' };
    const respostas = await Promise.all([
      request(app).post('/api/auth/register').send(dados),
      request(app).post('/api/auth/register').send(dados),
    ]);
    expect(respostas.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(respostas.find((r) => r.status === 409)?.body.error).toBe('Email já cadastrado');
  });

  it('validação devolve a mensagem e os detalhes por campo', async () => {
    const { body } = await request(app).post('/api/auth/register').send({ nome: 'Ana', email: 'x', senha: '123' }).expect(400);
    expect(body.error).toBe('Formato de e-mail inválido');
    expect(body.detalhes).toMatchObject({ email: 'Formato de e-mail inválido', senha: 'A senha deve ter no mínimo 8 caracteres' });
  });

  it('credenciais inválidas devolvem 401', async () => {
    const { body } = await request(app).post('/api/auth/login').send({ email: 'nao@existe.com', senha: 'qualquer1' }).expect(401);
    expect(body.error).toBe('Credenciais inválidas');
  });

  it('token ausente ou inválido devolve 401', async () => {
    await request(app).get('/api/usuarios/me').expect(401);
    await request(app).get('/api/usuarios/me').set(auth('lixo')).expect(401);
  });
});

describe('bebidas', () => {
  it('campo de outro tipo ou número fora de 0..1 viram 400, não 500', async () => {
    const { token } = await criarUsuario();
    await request(app).post('/api/bebidas').set(auth(token)).send({ nome: 'X', tipo: 'drink', baseAlcoolica: 'Gin', atributoDoce: 2 }).expect(400);
    await request(app).post('/api/bebidas').set(auth(token)).send({ nome: 'X', tipo: 'vinho' }).expect(400);
    await request(app).post('/api/bebidas').set(auth(token)).send({ nome: { a: 1 }, tipo: 'drink', baseAlcoolica: 'Gin' }).expect(400);

    const bebida = await criarBebida(token);
    await request(app).put(`/api/bebidas/${bebida.id}`).set(auth(token)).send({ tipoVinho: 'tinto' }).expect(400);
    await request(app).put(`/api/bebidas/${bebida.id}`).set(auth(token)).send({ tipo: 'vinho' }).expect(400);
    await request(app).put(`/api/bebidas/${bebida.id}`).set(auth(token)).send({ nome: '' }).expect(400);
  });

  it('id inexistente devolve 404', async () => {
    const { token } = await criarUsuario();
    const inexistente = '00000000-0000-4000-8000-000000000000';
    await request(app).get(`/api/bebidas/${inexistente}`).expect(404);
    await request(app).delete(`/api/bebidas/${inexistente}`).set(auth(token)).expect(404);
    await request(app).get(`/api/avaliacoes/bebida/${inexistente}`).expect(404);
  });

  it('mudar os atributos de uma bebida recalcula o vetor de quem avaliou', async () => {
    const usuario = await criarUsuario();
    const bebida = await criarBebida(usuario.token);
    await request(app).post('/api/avaliacoes').set(auth(usuario.token)).send({ bebidaId: bebida.id, nota: 5 }).expect(201);

    await request(app).put(`/api/bebidas/${bebida.id}`).set(auth(usuario.token)).send({ atributoDoce: 1 }).expect(200);
    const { body } = await request(app).get('/api/usuarios/me').set(auth(usuario.token)).expect(200);
    expect(body.preferencias.doce).toBe(1);
  });

  it('excluir uma bebida recalcula o vetor de quem avaliou', async () => {
    const usuario = await criarUsuario();
    const bebida = await criarBebida(usuario.token);
    await request(app).post('/api/avaliacoes').set(auth(usuario.token)).send({ bebidaId: bebida.id, nota: 5 }).expect(201);

    await request(app).delete(`/api/bebidas/${bebida.id}`).set(auth(usuario.token)).expect(204);
    const { body } = await request(app).get('/api/usuarios/me').set(auth(usuario.token)).expect(200);
    expect(body.preferencias).toEqual({ doce: 0, seco: 0, citrico: 0, encorpado: 0 });
  });
});

describe('avaliações', () => {
  it('avaliar duas vezes em paralelo: um 201 e um 409', async () => {
    const { token } = await criarUsuario();
    const bebida = await criarBebida(token);
    const respostas = await Promise.all([
      request(app).post('/api/avaliacoes').set(auth(token)).send({ bebidaId: bebida.id, nota: 4 }),
      request(app).post('/api/avaliacoes').set(auth(token)).send({ bebidaId: bebida.id, nota: 3 }),
    ]);
    expect(respostas.map((r) => r.status).sort()).toEqual([201, 409]);
  });

  it('bebida inexistente devolve 404 e nota média é recalculada', async () => {
    const a = await criarUsuario();
    const b = await criarUsuario();
    await request(app)
      .post('/api/avaliacoes')
      .set(auth(a.token))
      .send({ bebidaId: '00000000-0000-4000-8000-000000000000', nota: 4 })
      .expect(404);

    const bebida = await criarBebida(a.token);
    await request(app).post('/api/avaliacoes').set(auth(a.token)).send({ bebidaId: bebida.id, nota: 5 }).expect(201);
    await request(app).post('/api/avaliacoes').set(auth(b.token)).send({ bebidaId: bebida.id, nota: 2 }).expect(201);
    const { body } = await request(app).get(`/api/bebidas/${bebida.id}`).expect(200);
    expect(body.notaMedia).toBe(3.5);
  });

  it('só o autor edita a avaliação', async () => {
    const a = await criarUsuario();
    const b = await criarUsuario();
    const bebida = await criarBebida(a.token);
    const { body } = await request(app).post('/api/avaliacoes').set(auth(a.token)).send({ bebidaId: bebida.id, nota: 5 }).expect(201);
    await request(app).put(`/api/avaliacoes/${body.id}`).set(auth(b.token)).send({ nota: 1 }).expect(403);
  });
});

describe('recomendações e conta', () => {
  it('cold start pede onboarding; onboarding concluído libera mesmo com vetor zerado', async () => {
    const { token } = await criarUsuario();
    await criarBebida(token);
    const { body } = await request(app).get('/api/recomendacoes').set(auth(token)).expect(409);
    expect(body.code).toBe('ONBOARDING_PENDENTE');

    await request(app).put('/api/usuarios/me/preferencias').set(auth(token)).send({ doce: 0, seco: 0, citrico: 0, encorpado: 0 }).expect(200);
    await request(app).get('/api/recomendacoes').set(auth(token)).expect(200);
  });

  it('excluir a conta recalcula as notas médias e invalida o token', async () => {
    const a = await criarUsuario();
    const b = await criarUsuario();
    const bebida = await criarBebida(a.token);
    await request(app).post('/api/avaliacoes').set(auth(a.token)).send({ bebidaId: bebida.id, nota: 5 }).expect(201);
    await request(app).post('/api/avaliacoes').set(auth(b.token)).send({ bebidaId: bebida.id, nota: 1 }).expect(201);

    await request(app).delete('/api/usuarios/me').set(auth(b.token)).expect(204);
    const { body } = await request(app).get(`/api/bebidas/${bebida.id}`).expect(200);
    expect(body.notaMedia).toBe(5);

    // token de conta excluída: escrever exige novo login
    await request(app).post('/api/avaliacoes').set(auth(b.token)).send({ bebidaId: bebida.id, nota: 3 }).expect(401);
  });
});
