import { Request, Response } from 'express';
import pool from '../boot/database/db_connect';
import logger from '../middleware/winston';
import statusCodes from '../constants/statusCodes';

const getMovies = async (req: Request, res: Response): Promise<void> => {
  const { category } = req.query;

  if (typeof category === 'string' && category.trim()) {
    const result = await getMoviesByCategory(category);
    res.status(statusCodes.success).json({ movies: result });
    return;
  }

  try {
    const movies = await pool.query('SELECT * FROM movies GROUP BY type, movie_id;');

    const groupedMovies = movies.rows.reduce((acc: Record<string, any[]>, movie: any) => {
      const { type } = movie;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(movie);
      return acc;
    }, {});

    res.status(statusCodes.success).json({ movies: groupedMovies });
  } catch (error: any) {
    logger.error(error.stack);
    res.status(statusCodes.queryError).json({ error: 'Exception occured while fetching movies' });
  }
};

const getMoviesByCategory = async (category: string): Promise<any[]> => {
  try {
    const movies = await pool.query(
      'SELECT * FROM movies WHERE type = $1 ORDER BY release_date DESC;',
      [category]
    );
    return movies.rows;
  } catch (error: any) {
    logger.error(error.stack);
    return [];
  }
};

const getTopRatedMovies = async (_req: Request, res: Response): Promise<void> => {
  try {
    const movies = await pool.query('SELECT * FROM movies ORDER BY rating DESC LIMIT 10;');
    res.status(statusCodes.success).json({ movies: movies.rows });
  } catch (error: any) {
    logger.error(error.stack);
    res
      .status(statusCodes.queryError)
      .json({ error: 'Exception occured while fetching top rated movies' });
  }
};

interface AuthRequest extends Request {
  user?: { email: string };
}

const getSeenMovies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const movies = await pool.query(
      'SELECT * FROM seen_movies S JOIN movies M ON S.movie_id = M.movie_id WHERE email = $1;',
      [req.user?.email]
    );
    res.status(statusCodes.success).json({ movies: movies.rows });
  } catch (error: any) {
    logger.error(error.stack);
    res
      .status(statusCodes.queryError)
      .json({ error: 'Exception occured while fetching seen movies' });
  }
};

export default {
  getMovies,
  getTopRatedMovies,
  getSeenMovies,
};