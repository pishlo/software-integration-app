import { Request, Response } from 'express';
import pool from '../boot/database/db_connect';
import logger from '../middleware/winston';
import statusCodes from '../constants/statusCodes';

interface AuthRequest extends Request {
  user?: {
    email: string;
  };
}

export const editPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    res.status(statusCodes.badRequest).json({ message: 'Missing parameters' });
    return;
  }

  if (oldPassword === newPassword) {
    res
      .status(statusCodes.badRequest)
      .json({ message: 'New password cannot be equal to old password' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
      [req.user?.email, oldPassword]
    );

    if (result.rows.length > 0) {
      try {
        await pool.query(
          "UPDATE users SET password = crypt($1, gen_salt('bf')) WHERE email = $2;",
          [newPassword, req.user?.email]
        );
        res.status(statusCodes.success).json({ message: 'Password updated' });
      } catch (err2: any) {
        logger.error(err2.stack);
        res
          .status(statusCodes.queryError)
          .json({ error: 'Exception occurred while updating password' });
      }
    } else {
      res.status(statusCodes.badRequest).json({ message: 'Incorrect password' });
    }
  } catch (err: any) {
    logger.error(err.stack);
    res
      .status(statusCodes.queryError)
      .json({ error: 'Exception occurred while updating password' });
  }
};

export const logout = (req: AuthRequest, res: Response): void => {
  if (req.session?.user) {
    delete req.session.user;
  }
  res.status(200).json({ message: 'Disconnected' });
};