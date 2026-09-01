import { Router } from 'express';
import { avaliacaoController } from '../controllers/avaliacaoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.get('/bebida/:id', avaliacaoController.listarPorBebida);

router.post('/', authMiddleware, avaliacaoController.criar);
router.get('/minhas', authMiddleware, avaliacaoController.listarPorUsuario);
router.delete('/:id', authMiddleware, avaliacaoController.deletar);

export default router;