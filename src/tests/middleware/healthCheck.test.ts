import { healthCheckHandler } from '../../middleware/healthCheck';
import { Request, Response } from 'express';

describe('healthCheckHandler', () => {
  it('should return status 200 with the correct message', () => {
    const mockReq = {} as Request;

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    healthCheckHandler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'All up and running !!',
    });
  });
});
