import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { metricasSchema } from '../schemas/recomendacao';
import { adminService } from '../services/adminService';

export const adminController = {
  async metricas(req: AuthRequest, res: Response) {
    const { k } = metricasSchema.parse(req.query);
    res.status(200).json(await adminService.metricas(k));
  },
};
