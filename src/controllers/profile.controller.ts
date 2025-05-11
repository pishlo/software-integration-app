import { Request, Response } from 'express';
import pool from '../boot/database/db_connect';
import logger from '../middleware/winston';
import statusCodes from '../constants/statusCodes';

interface AuthRequest extends Request {
  user?: {
    email: string;
  };
  session?: {
    user?: any;
  };
}

export const editPassword = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res
      .status(statusCodes.badRequest)
      .json({ message: 'Missing parameters' });
  }

  if (oldPassword === newPassword) {
    return res
      .status(statusCodes.badRequest)
      .json({ message: 'New password cannot be equal to old password' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
      [req.user?.email, oldPassword]
    );

    if (result.rows.length > 0) {
      try {
        await pool.query(
          'UPDATE users SET password = crypt($1, gen_salt(\'bf\')) WHERE email = $2;',
          [newPassword, req.user?.email]
        );
        return res
          .status(statusCodes.success)
          .json({ message: 'Password updated' });
      } catch (err2: any) {
        logger.error(err2.stack);
        return res
          .status(statusCodes.queryError)
          .json({ error: 'Exception occurred while updating password' });
      }
    } else {
      return res
        .status(statusCodes.badRequest)
        .json({ message: 'Incorrect password' });
    }
  } catch (err: any) {
    logger.error(err.stack);
    return res
      .status(statusCodes.queryError)
      .json({ error: 'Exception occurred while updating password' });
  }
};

export const logout = (req: AuthRequest, res: Response): Response => {
  if (req.session?.user) delete req.session.user;
  return res.status(200).json({ message: 'Disconnected' });
};