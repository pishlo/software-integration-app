import { register, login } from '../../controllers/users.controller';
import pool from '../../boot/database/db_connect';
import logger from '../../middleware/winston';
import * as jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

jest.mock('../../boot/database/db_connect');
jest.mock('../../middleware/winston');
jest.mock('jsonwebtoken');

describe('usersController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockClient: any;

  beforeEach(() => {
    process.env.JWT_SECRET_KEY = 'test_secret';

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should return 400 if required fields are missing', async () => {
      mockReq = {
        body: { email: '', username: '', password: '', country: '' },
      } as Request;

      await register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    it('should return 409 if user already exists', async () => {
      mockReq = {
        body: {
          email: 'test@example.com',
          username: 'tester',
          password: 'pass123',
          country: 'Bulgaria',
        },
      } as Request;

      mockClient.query.mockResolvedValueOnce({ rowCount: 1 });

      await register(mockReq as Request, mockRes as Response);

      expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1;', [
        'test@example.com',
      ]);
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User already has an account' });
    });

    it('should insert user and address, then return success', async () => {
      mockReq = {
        body: {
          email: 'test@example.com',
          username: 'tester',
          password: 'pass123',
          country: 'Bulgaria',
          city: 'Sofia',
          street: 'Main',
          creation_date: '2025-05-12',
        },
      } as Request;

      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0 }) // SELECT
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 }) // INSERT user
        .mockResolvedValueOnce({ rowCount: 1 }) // INSERT address
        .mockResolvedValueOnce({}); // COMMIT

      await register(mockReq as Request, mockRes as Response);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith(
        `INSERT INTO users(email, username, password, creation_date)
       VALUES ($1, $2, crypt($3, gen_salt('bf')), $4);`,
        ['test@example.com', 'tester', 'pass123', '2025-05-12']
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        `INSERT INTO addresses(email, country, street, city) VALUES ($1, $2, $3, $4);`,
        ['test@example.com', 'Bulgaria', 'Main', 'Sofia']
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User created' });
    });

    it('should handle DB error and rollback', async () => {
      mockReq = {
        body: {
          email: 'error@example.com',
          username: 'fail',
          password: '123',
          country: 'Nowhere',
        },
      } as Request;

      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0 }) // SELECT
        .mockImplementationOnce(() => {
          throw new Error('insert error');
        });

      await register(mockReq as Request, mockRes as Response);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(logger.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Exception occurred while registering',
      });
    });
  });

  describe('login', () => {
    it('should return 400 if email or password is missing', async () => {
      mockReq = {
        body: { email: '', password: '' },
      } as Request;

      await login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    it('should return 404 if user not found', async () => {
      mockReq = {
        body: { email: 'notfound@example.com', password: 'wrongpass' },
        session: {},
      } as Request;

      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Incorrect email/password' });
    });

    it('should return token and username if login is successful', async () => {
      mockReq = {
        body: { email: 'test@example.com', password: 'pass123' },
        session: {},
      } as Request;

      (pool.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ email: 'test@example.com', username: 'tester', id: 1 }],
      });

      (jwt.sign as jest.Mock).mockImplementation((_payload, secret, _options) => {
        if (!secret) throw new Error('Missing secret');
        return 'mocked_token';
      });

      await login(mockReq as Request, mockRes as Response);

      expect(mockReq.session?.user).toEqual({ _id: '1' });
      expect(jwt.sign).toHaveBeenCalledWith(
        { user: { email: 'test@example.com' } },
        'test_secret',
        { expiresIn: '1h' }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        token: 'mocked_token',
        username: 'tester',
      });
    });

    it('should handle DB error in login', async () => {
      mockReq = {
        body: { email: 'error@example.com', password: 'pass' },
      } as Request;

      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('DB fail'));

      await login(mockReq as Request, mockRes as Response);

      expect(logger.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Exception occurred while logging in',
      });
    });
  });
});
