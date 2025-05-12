// src/tests/controllers/movies.controller.test.ts
import movieController from '../../controllers/movies.controller';
import { Request, Response } from 'express';
import pool from '../../boot/database/db_connect';
import logger from '../../middleware/winston';

jest.mock('../../boot/database/db_connect');
jest.mock('../../middleware/winston');

describe('movieController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('getMovies', () => {
    it('should return grouped movies if no category is specified', async () => {
      const mockRows = [
        { movie_id: 1, type: 'Action' },
        { movie_id: 2, type: 'Action' },
        { movie_id: 3, type: 'Drama' },
      ];

      (pool.query as jest.Mock).mockResolvedValue({ rows: mockRows });

      mockReq = { query: {} };

      await movieController.getMovies(mockReq as Request, mockRes as Response);

      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM movies GROUP BY type, movie_id;');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        movies: {
          Action: [
            { movie_id: 1, type: 'Action' },
            { movie_id: 2, type: 'Action' },
          ],
          Drama: [{ movie_id: 3, type: 'Drama' }],
        },
      });
    });

    it('should return filtered movies if category is provided', async () => {
      const mockRows = [{ movie_id: 1, type: 'Comedy' }];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockRows });

      mockReq = { query: { category: 'Comedy' } };

      await movieController.getMovies(mockReq as Request, mockRes as Response);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM movies WHERE type = $1 ORDER BY release_date DESC;',
        ['Comedy']
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ movies: mockRows });
    });

    it('should handle errors during movie fetch', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('DB fail'));

      mockReq = { query: {} };

      await movieController.getMovies(mockReq as Request, mockRes as Response);

      expect(logger.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Exception occured while fetching movies',
      });
    });
  });

  describe('getTopRatedMovies', () => {
    it('should return top 10 rated movies', async () => {
      const mockRows = [{ movie_id: 1, rating: 9.5 }];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockRows });

      await movieController.getTopRatedMovies({} as Request, mockRes as Response);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM movies ORDER BY rating DESC LIMIT 10;'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ movies: mockRows });
    });

    it('should handle DB errors when fetching top rated movies', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('fail'));

      await movieController.getTopRatedMovies({} as Request, mockRes as Response);

      expect(logger.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Exception occured while fetching top rated movies',
      });
    });
  });

  describe('getSeenMovies', () => {
    it('should return seen movies for a user', async () => {
      const mockRows = [{ movie_id: 5 }];
      (pool.query as jest.Mock).mockResolvedValue({ rows: mockRows });

      const req = {
        user: { email: 'test@example.com' },
      } as any;

      await movieController.getSeenMovies(req, mockRes as Response);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM seen_movies S JOIN movies M ON S.movie_id = M.movie_id WHERE email = $1;',
        ['test@example.com']
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ movies: mockRows });
    });

    it('should handle DB error in getSeenMovies', async () => {
      (pool.query as jest.Mock).mockRejectedValue(new Error('fail'));
      const req = {
        user: { email: 'fail@example.com' },
      } as any;

      await movieController.getSeenMovies(req, mockRes as Response);

      expect(logger.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Exception occured while fetching seen movies',
      });
    });
  });
});
