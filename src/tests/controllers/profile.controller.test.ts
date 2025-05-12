import { editPassword, logout } from '../../controllers/profile.controller';
import pool from '../../boot/database/db_connect';
import logger from '../../middleware/winston';
import { Request, Response } from 'express';

jest.mock('../../boot/database/db_connect');
jest.mock('../../middleware/winston');

describe('profileController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('editPassword', () => {
    it('should return 400 if old or new password is missing', async () => {
      mockReq = {
        body: { oldPassword: '' },
        user: { email: 'test@example.com' },
      } as unknown as Request;

      await editPassword(mockReq as any, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Missing parameters' });
    });

    it('should return 400 if new password equals old password', async () => {
      mockReq = {
        body: { oldPassword: 'pass123', newPassword: 'pass123' },
        user: { email: 'test@example.com' },
      } as unknown as Request;

      await editPassword(mockReq as any, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'New password cannot be equal to old password',
      });
    });

    it('should return 400 if old password is incorrect', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      mockReq = {
        body: { oldPassword: 'wrongpass', newPassword: 'newpass' },
        user: { email: 'test@example.com' },
      } as unknown as Request;

      await editPassword(mockReq as any, mockRes as Response);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
        ['test@example.com', 'wrongpass']
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Incorrect password' });
    });

    it('should update password if old one is correct', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{}] }) // valid old password
        .mockResolvedValueOnce({}); // update success

      mockReq = {
        body: { oldPassword: 'old', newPassword: 'new' },
        user: { email: 'test@example.com' },
      } as unknown as Request;

      await editPassword(mockReq as any, mockRes as Response);

      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(pool.query).toHaveBeenCalledWith(
        "UPDATE users SET password = crypt($1, gen_salt('bf')) WHERE email = $2;",
        ['new', 'test@example.com']
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Password updated' });
    });

    it('should handle DB error in SELECT', async () => {
      (pool.query as jest.Mock).mockRejectedValueOnce(new Error('fail'));

      mockReq = {
        body: { oldPassword: 'old', newPassword: 'new' },
        user: { email: 'test@example.com' },
      } as unknown as Request;

      await editPassword(mockReq as any, mockRes as Response);

      expect(logger.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Exception occurred while updating password',
      });
    });

    it('should handle DB error in UPDATE', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{}] }) // password match
        .mockRejectedValueOnce(new Error('update fail'));

      mockReq = {
        body: { oldPassword: 'old', newPassword: 'new' },
        user: { email: 'test@example.com' },
      } as unknown as Request;

      await editPassword(mockReq as any, mockRes as Response);

      expect(logger.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Exception occurred while updating password',
      });
    });
  });

  describe('logout', () => {
    it('should clear session and return 200', () => {
      const mockSession = { user: { _id: 'abc' } };

      mockReq = {
        session: mockSession,
      } as unknown as Request;

      logout(mockReq as any, mockRes as Response);

      expect(mockSession.user).toBeUndefined(); // ✅ now matches what logout modifies
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Disconnected' });
    });

    it('should return 200 if no user in session', () => {
      mockReq = {
        session: {} as any,
      } as unknown as Request;

      logout(mockReq as any, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Disconnected' });
    });
  });
});
