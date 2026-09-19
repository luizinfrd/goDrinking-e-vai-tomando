import { Router } from 'express';
import { recomendacaoController } from '../controllers/recomendacaoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// todas as rotas de recomendação exigem autenticação
// não faz sentido recomendar sem saber quem é o usuário
router.get('/', authMiddleware, recomendacaoController.recomendar);
router.get('/locais', authMiddleware, recomendacaoController.recomendarLocais);

export default router;