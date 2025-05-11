import { Request, Response, NextFunction } from 'express';
import logger from './winston';
import statusCodes from '../constants/statusCodes';

const validator = (req: Request, res: Response, next: NextFunction): void => {
  // Strip any incoming creation_date
  if ('creation_date' in req.body) {
    delete req.body.creation_date;
  }

  // Set today's date in YYYY-MM-DD format
  const creationDate = new Date().toISOString().slice(0, 10);
  req.body.creation_date = creationDate;

  try {
    for (const [key, value] of Object.entries(req.body)) {
      if (value === '') {
        req.body[key] = null;
      }
    }

    next();
  } catch (error: any) {
    logger.error(error);
    res.status(statusCodes.badRequest).json({ error: 'Bad request' });
  }
};

export default validator;