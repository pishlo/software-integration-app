import { Router } from 'express';
import authServices from '../controllers/auth.controller';

const router: Router = Router();

router.post('/signup', authServices.signup);
router.post('/login', authServices.signin);
router.get('/me', authServices.getUser);
router.get('/logout', authServices.logout);

export default router;
