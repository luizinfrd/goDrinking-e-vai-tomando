import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import bebidaRoutes from './routes/bebidaRoutes';
import avaliacaoRoutes from './routes/avaliacaoRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/bebidas', bebidaRoutes);
app.use('/api/avaliacoes', avaliacaoRoutes);

app.get('/health', (req, res) => {
    res.json({status: 'ok', message: 'servidor rodando!'});
})

app.listen(PORT, () => {
    console.log(`servidor rodando na porta ${PORT}`)
});