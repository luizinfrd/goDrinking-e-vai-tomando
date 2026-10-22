import { Router } from 'express';
import { localController } from '../controllers/localController';
import { exigirAdmin } from '../middlewares/adminMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// rotas públicas — mapa e detalhe do local
router.get('/', localController.listar);
router.get('/:id', localController.buscarPorId);

// manutenção dos locais — só administradores
router.post('/', authMiddleware, exigirAdmin, localController.criar);
router.put('/:id', authMiddleware, exigirAdmin, localController.atualizar);
router.delete('/:id', authMiddleware, exigirAdmin, localController.deletar);
router.post('/:id/bebidas', authMiddleware, exigirAdmin, localController.associarBebida);
router.delete('/:id/bebidas/:bebidaId', authMiddleware, exigirAdmin, localController.desassociarBebida);

export default router;
