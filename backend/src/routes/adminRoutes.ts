import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { exigirAdmin } from '../middlewares/adminMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware, exigirAdmin);

router.get('/metricas', adminController.metricas);

export default router;
