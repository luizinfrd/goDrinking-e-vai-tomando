import { Router } from 'express';
import { localController } from '../controllers/localController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// rotas públicas — mapa e detalhe do local
router.get('/', localController.listar);
router.get('/:id', localController.buscarPorId);

// rotas protegidas — exige autenticação
router.post('/', authMiddleware, localController.criar);
router.put('/:id', authMiddleware, localController.atualizar);
router.delete('/:id', authMiddleware, localController.deletar);
router.post('/:id/bebidas', authMiddleware, localController.associarBebida);
router.delete('/:id/bebidas/:bebidaId', authMiddleware, localController.desassociarBebida);

export default router;
