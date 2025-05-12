import authController from '../../controllers/auth.controller';
import userModel from '../../models/userModel';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';

jest.mock('../../models/userModel');
jest.mock('bcrypt');

describe('authController.signup', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {
        username: 'mockuser',
        email: 'mock@example.com',
        password: 'secret123',
      },
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return 400 if required fields are missing', async () => {
    mockReq.body = {}; // Missing everything

    await authController.signup(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'missing information' });
  });

  it('should save user and return 200 on success', async () => {
    (bcrypt.hashSync as jest.Mock).mockReturnValue('hashed_pw');

    const mockSave = jest.fn().mockResolvedValue({
      _id: '123',
      username: 'mockuser',
      email: 'mock@example.com',
      password: 'hashed_pw',
    });

    (userModel as unknown as jest.Mock).mockImplementation(() => ({
      save: mockSave,
    }));

    await authController.signup(mockReq as Request, mockRes as Response);

    expect(bcrypt.hashSync).toHaveBeenCalledWith('secret123', 10);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      _id: '123',
      username: 'mockuser',
      email: 'mock@example.com',
      password: 'hashed_pw',
    });
  });

  it('should return 500 if save throws', async () => {
    (bcrypt.hashSync as jest.Mock).mockReturnValue('hashed_pw');

    (userModel as unknown as jest.Mock).mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(new Error('DB error')),
    }));

    await authController.signup(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'failed to save user',
      error: expect.any(Error),
    });
  });
});