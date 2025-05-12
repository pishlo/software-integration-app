import { Request, Response, NextFunction } from 'express';
import verifyToken from '../../middleware/authentication';
import * as jwt from 'jsonwebtoken';
import logger from '../../middleware/winston';
import statusCodes from '../../constants/statusCodes';

jest.mock('jsonwebtoken');
jest.mock('../../middleware/winston');

describe('verifyToken Middleware Unit Tests', () => {
  let mockReq: Partial<Request> & { user?: any };
  let mockRes: Partial<Response>;
  let nextFn: NextFunction;

  beforeEach(() => {
    mockReq = {
      header: jest.fn(),
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFn = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return 401 if Authorization header is missing', () => {
    (mockReq.header as jest.Mock).mockReturnValue(undefined);

    verifyToken(mockReq as any, mockRes as any, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(statusCodes.unauthorized);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('should verify token and call next() if token is valid', () => {
    const mockToken = 'Bearer valid.token.here';
    const decodedUser = { user: { id: '123' } };

    process.env.JWT_SECRET_KEY = 'test_secret';

    (mockReq.header as jest.Mock).mockReturnValue(mockToken);
    (jwt.verify as jest.Mock).mockReturnValue(decodedUser);

    verifyToken(mockReq as any, mockRes as any, nextFn);

    expect(jwt.verify).toHaveBeenCalledWith('valid.token.here', expect.any(String));
    expect(mockReq.user).toEqual(decodedUser.user);
    expect(nextFn).toHaveBeenCalled();
  });

  it('should return 401 and log error if token is invalid', () => {
    const mockToken = 'Bearer invalid.token';
    const mockError = new Error('Invalid token');

    (mockReq.header as jest.Mock).mockReturnValue(mockToken);
    (jwt.verify as jest.Mock).mockImplementation(() => { throw mockError; });

    verifyToken(mockReq as any, mockRes as any, nextFn);

    expect(logger.error).toHaveBeenCalledWith(mockError);
    expect(mockRes.status).toHaveBeenCalledWith(statusCodes.unauthorized);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(nextFn).not.toHaveBeenCalled();
  });
});