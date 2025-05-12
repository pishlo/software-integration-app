import { Router, Request, Response } from 'express';

export const healthCheckHandler = (_req: Request, res: Response): void => {
  res.status(200).json({
    message: 'All up and running !!',
  });
};

const router = Router();
router.get('/api/health', healthCheckHandler);

export default router;
