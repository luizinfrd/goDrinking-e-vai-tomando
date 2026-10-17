import { Router } from 'express';
import { usuarioController } from '../controllers/usuarioController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// todas as rotas de usuário agem sobre o próprio usuário autenticado
router.use(authMiddleware);

router.get('/me', usuarioController.me);
router.put('/me', usuarioController.atualizar);
router.put('/me/preferencias', usuarioController.salvarPreferencias);
router.delete('/me', usuarioController.excluir);

export default router;
