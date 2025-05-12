import controller from '../../controllers/rating.controller';
import pool from '../../boot/database/db_connect';
import logger from '../../middleware/winston';
import ratingModel from '../../models/ratingModel';
import { Request, Response } from 'express';

jest.mock('../../boot/database/db_connect');
jest.mock('../../middleware/winston');
jest.mock('../../models/ratingModel');

describe('ratingController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('addRating', () => {
    it('should return 400 if movieId or rating is missing/invalid', async () => {
      mockReq = {
        params: { movieId: 'abc' },
        body: { rating: undefined },
        user: { email: 'test@example.com' },
      } as unknown as Request;

      await controller.addRating(mockReq as any, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    it('should save rating and update movie rating', async () => {
      const mockSave = jest.fn().mockResolvedValueOnce(undefined);
      const mockFind = jest
        .fn()
        .mockResolvedValueOnce([{ rating: 3 }, { rating: 5 }, { rating: 4 }]);

      (ratingModel as any).mockImplementation(() => ({ save: mockSave }));
      (ratingModel.find as jest.Mock).mockImplementation(mockFind);
      (pool.query as jest.Mock).mockResolvedValueOnce({});

      mockReq = {
        params: { movieId: '1' },
        body: { rating: 4 },
        user: { email: 'test@example.com' },
      } as unknown as Request;

      await controller.addRating(mockReq as any, mockRes as Response);

      expect(mockSave).toHaveBeenCalled();
      expect(ratingModel.find).toHaveBeenCalledWith({ movie_id: 1 });
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE movies SET rating = $1 WHERE movie_id = $2;',
        [4, 1]
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Rating added' });
    });

    it('should handle error during saving or querying', async () => {
      const mockSave = jest.fn().mockRejectedValueOnce(new Error('fail'));
      (ratingModel as any).mockImplementation(() => ({ save: mockSave }));

      mockReq = {
        params: { movieId: '2' },
        body: { rating: 5 },
        user: { email: 'fail@example.com' },
      } as unknown as Request;

      await controller.addRating(mockReq as any, mockRes as Response);

      expect(logger.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Exception occurred while adding rating',
      });
    });
  });
});
