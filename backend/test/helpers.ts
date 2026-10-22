import request from 'supertest';
import { criarApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

export const app = criarApp();

export async function limparBanco() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE users, bebidas, locais CASCADE');
}

let contador = 0;

// cadastra, faz login e devolve o token
export async function criarUsuario(nome = 'Teste') {
  contador += 1;
  const email = `usuario${contador}-${Date.now()}@teste.com`;
  await request(app).post('/api/auth/register').send({ nome, email, senha: 'senha12345' }).expect(201);
  const { body } = await request(app).post('/api/auth/login').send({ email, senha: 'senha12345' }).expect(200);
  return { token: body.token as string, id: body.user.id as string, email };
}

export async function criarBebida(token: string, dados: Record<string, unknown> = {}) {
  const { body } = await request(app)
    .post('/api/bebidas')
    .set('Authorization', `Bearer ${token}`)
    .send({
      nome: 'Negroni',
      tipo: 'drink',
      baseAlcoolica: 'Gin',
      atributoDoce: 0.4,
      atributoSeco: 0.6,
      atributoCitrico: 0.3,
      atributoEncorpado: 0.7,
      ...dados,
    })
    .expect(201);
  return body as { id: string };
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function tornarAdmin(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { papel: 'admin' } });
}
