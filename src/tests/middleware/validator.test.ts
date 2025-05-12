import validator from '../../middleware/validator';
import { Request, Response, NextFunction } from 'express';
import logger from '../../middleware/winston';
import statusCodes from '../../constants/statusCodes';

jest.mock('../../middleware/winston');

describe('validator Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: NextFunction;

  beforeEach(() => {
    mockReq = { body: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFn = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should remove creation_date and set today\'s date in req.body', () => {
    mockReq.body = {
      creation_date: '2022-01-01',
      name: 'Test',
    };

    validator(mockReq as Request, mockRes as Response, nextFn);

    expect(mockReq.body.creation_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(mockReq.body.name).toBe('Test');
    expect(nextFn).toHaveBeenCalled();
  });

  it('should convert empty string values to null', () => {
    mockReq.body = {
      name: '',
      description: '',
    };

    validator(mockReq as Request, mockRes as Response, nextFn);

    expect(mockReq.body.name).toBeNull();
    expect(mockReq.body.description).toBeNull();
    expect(mockReq.body.creation_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(nextFn).toHaveBeenCalled();
  });

  it('should catch error and return 400 with "Bad request"', () => {
    const originalEntries = Object.entries;
  
    // Force Object.entries() to throw
    jest.spyOn(Object, 'entries').mockImplementation(() => {
      throw new Error('Test error');
    });
  
    (logger.error as jest.Mock).mockImplementation(() => {});
  
    const mockReq = { body: { name: 'valid' } } as Request;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
  
    const mockNext = jest.fn();
  
    validator(mockReq, mockRes, mockNext);
  
    expect(logger.error).toHaveBeenCalledWith(expect.any(Error));
    expect(mockRes.status).toHaveBeenCalledWith(statusCodes.badRequest);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Bad request' });
    expect(mockNext).not.toHaveBeenCalled();
  
    // Restore original implementation
    Object.entries = originalEntries;
  });  
});