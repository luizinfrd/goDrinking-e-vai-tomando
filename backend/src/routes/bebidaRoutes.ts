import { Router } from 'express';
import { bebidaController } from '../controllers/bebidaController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// rotas públicas — qualquer um pode listar e ver detalhes
router.get('/', bebidaController.listar);
router.get('/:id', bebidaController.buscarPorId);

// rotas protegidas — exige autenticação
router.post('/', authMiddleware, bebidaController.criar);
router.put('/:id', authMiddleware, bebidaController.atualizar);
router.delete('/:id', authMiddleware, bebidaController.deletar);

export default router;