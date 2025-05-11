import { Request, Response } from 'express';
import pool from '../boot/database/db_connect';
import logger from '../middleware/winston';
import statusCodes from '../constants/statusCodes';
import ratingModel from '../models/rating.model';

interface AuthRequest extends Request {
  user?: {
    email: string;
  };
}

const addRating = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  const { movieId } = req.params;
  const { rating } = req.body;

  const movie_id = parseInt(movieId);

  if (isNaN(movie_id) || rating === undefined) {
    return res.status(statusCodes.badRequest).json({ message: 'Missing parameters' });
  }

  try {
    const ratingObj = new ratingModel({
      email: req.user?.email,
      movie_id,
      rating,
    });

    await ratingObj.save();

    const ratings = await ratingModel.find({ movie_id });

    const averageRating =
      ratings.reduce((acc, item) => acc + item.rating, 0) / ratings.length;

    await pool.query('UPDATE movies SET rating = $1 WHERE movie_id = $2;', [
      averageRating,
      movie_id,
    ]);

    return res.status(statusCodes.success).json({ message: 'Rating added' });
  } catch (error: any) {
    logger.error(error.stack);
    return res
      .status(statusCodes.queryError)
      .json({ error: 'Exception occurred while adding rating' });
  }
};

export default {
  addRating,
};