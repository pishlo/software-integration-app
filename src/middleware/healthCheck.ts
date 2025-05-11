import { Router } from 'express';

const router = Router();

router.get('/api/health', (_req, res) => {
  res.status(200).json({
    message: 'All up and running !!',
  });
});

export default router;
