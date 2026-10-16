// carrega o .env antes de qualquer outro import (as rotas leem process.env)
import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import bebidaRoutes from './routes/bebidaRoutes';
import avaliacaoRoutes from './routes/avaliacaoRoutes';
import recomendacaoRoutes from './routes/recomendacaoRoutes';
import localRoutes from './routes/localRoutes';
import usuarioRoutes from './routes/usuarioRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS_ORIGIN aceita uma lista separada por vírgula
const origensPermitidas = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

app.use(cors({ origin: origensPermitidas }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/bebidas', bebidaRoutes);
app.use('/api/avaliacoes', avaliacaoRoutes);
app.use('/api/recomendacoes', recomendacaoRoutes);
app.use('/api/locais', localRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.get('/health', (req, res) => {
    res.json({status: 'ok', message: 'servidor rodando!'});
})

// rota inexistente
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// erros não tratados (ex.: json inválido no body)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err?.type === 'entity.parse.failed') {
        res.status(400).json({ error: 'JSON inválido no corpo da requisição' });
        return;
    }
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
    console.log(`servidor rodando na porta ${PORT}`)
});
