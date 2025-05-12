import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import statusCodes from '../constants/statusCodes';
import logger from './winston';

interface AuthenticatedRequest extends Request {
  user?: any;
}

const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = req.header('Authorization');

  if (!token) {
    res.status(statusCodes.unauthorized).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET_KEY as string) as any;
    req.user = decoded.user;

    console.log('TOKEN USER:', req.user);
    next();
  } catch (error: any) {
    logger.error(error);
    res.status(statusCodes.unauthorized).json({ error: 'Invalid token' });
  }
};

export default verifyToken;
