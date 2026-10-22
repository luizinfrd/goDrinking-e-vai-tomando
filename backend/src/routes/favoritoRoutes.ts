import { Router } from 'express';
import { favoritoController } from '../controllers/favoritoController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// a lista "quero provar" é sempre do próprio usuário
router.use(authMiddleware);

router.get('/', favoritoController.listar);
router.post('/:bebidaId', favoritoController.adicionar);
router.delete('/:bebidaId', favoritoController.remover);

export default router;
