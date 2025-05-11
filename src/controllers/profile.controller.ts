import { Request, Response } from 'express';
import pool from '../boot/database/db_connect';
import logger from '../middleware/winston';
import * as statusCodes from '../constants/statusCodes';

export const editPassword = async (req: Request & { user?: any }, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(statusCodes.badRequest).json({ message: 'Missing parameters' });
  }

  if (oldPassword === newPassword) {
    return res.status(statusCodes.badRequest).json({ message: 'New password cannot be equal to old password' });
  }

  pool.query(
    'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
    [req.user.email, oldPassword],
    (err, rows) => {
      if (err) {
        logger.error(err.stack);
        return res.status(statusCodes.queryError).json({ error: 'Exception occurred while updating password' });
      }

      if (rows.rows[0]) {
        pool.query(
          "UPDATE users SET password = crypt($1, gen_salt('bf')) WHERE email = $2;",
          [newPassword, req.user.email],
          (err2) => {
            if (err2) {
              logger.error(err2.stack);
              return res.status(statusCodes.queryError).json({ error: 'Exception occurred while updating password' });
            }

            return res.status(statusCodes.success).json({ message: 'Password updated' });
          }
        );
      } else {
        return res.status(statusCodes.badRequest).json({ message: 'Incorrect password' });
      }
    }
  );
};

export const logout = (req: Request, res: Response) => {
  if (req.session.user) delete req.session.user;
  return res.status(200).json({ message: 'Disconnected' });
};
