import notFound from '../../middleware/notFound';
import { Request, Response, NextFunction } from 'express';

describe('notFound Middleware', () => {
  it('should return 404 with a "Not Found" error message', () => {
    const mockReq = {} as Request;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const mockNext = jest.fn() as NextFunction;

    notFound(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        message: 'Not Found',
      },
    });
  });
});
