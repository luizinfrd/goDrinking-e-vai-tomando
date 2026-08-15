import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
    res.json({status: 'ok', message: 'servidor rodando!'});
})

app.listen(PORT, () => {
    console.log(`servidor rodando na porta ${PORT}`)
});