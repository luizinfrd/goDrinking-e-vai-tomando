// monta a aplicação express sem subir o servidor (os testes usam direto com supertest)
import express from 'express';
import cors from 'cors';
import { origensPermitidas } from './config/env';
import { prisma } from './lib/prisma';
import { rotaNaoEncontrada, tratarErros } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import bebidaRoutes from './routes/bebidaRoutes';
import avaliacaoRoutes from './routes/avaliacaoRoutes';
import recomendacaoRoutes from './routes/recomendacaoRoutes';
import localRoutes from './routes/localRoutes';
import usuarioRoutes from './routes/usuarioRoutes';
import favoritoRoutes from './routes/favoritoRoutes';
import adminRoutes from './routes/adminRoutes';

export function criarApp() {
  const app = express();

  app.use(cors({ origin: origensPermitidas }));
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/bebidas', bebidaRoutes);
  app.use('/api/avaliacoes', avaliacaoRoutes);
  app.use('/api/recomendacoes', recomendacaoRoutes);
  app.use('/api/locais', localRoutes);
  app.use('/api/usuarios', usuarioRoutes);
  app.use('/api/favoritos', favoritoRoutes);
  app.use('/api/admin', adminRoutes);

  // confere também o banco: a API sem banco não está saudável
  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', message: 'servidor rodando!' });
    } catch {
      res.status(503).json({ status: 'erro', message: 'banco de dados indisponível' });
    }
  });

  app.use(rotaNaoEncontrada);
  app.use(tratarErros);

  return app;
}
