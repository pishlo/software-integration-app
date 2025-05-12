import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import statusCodes from '../constants/statusCodes';
import logger from '../middleware/winston';
import pool from '../boot/database/db_connect';

// REGISTER USER
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, username, password, country, city, street, creation_date } = req.body;

  if (!email || !username || !password || !country) {
    res.status(statusCodes.badRequest).json({ message: 'Missing parameters' });
    return;
  }

  const client = await pool.connect();

  try {
    const result = await client.query('SELECT * FROM users WHERE email = $1;', [email]);

    if (result.rowCount) {
      res.status(statusCodes.userAlreadyExists).json({ message: 'User already has an account' });
      return;
    }

    await client.query('BEGIN');

    const addedUser = await client.query(
      `INSERT INTO users(email, username, password, creation_date)
       VALUES ($1, $2, crypt($3, gen_salt('bf')), $4);`,
      [email, username, password, creation_date]
    );

    logger.info('USER ADDED', addedUser.rowCount);

    const address = await client.query(
      `INSERT INTO addresses(email, country, street, city) VALUES ($1, $2, $3, $4);`,
      [email, country, street, city]
    );

    logger.info('ADDRESS ADDED', address.rowCount);

    await client.query('COMMIT');

    res.status(statusCodes.success).json({ message: 'User created' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    logger.error(error.stack);
    res.status(statusCodes.queryError).json({
      message: 'Exception occurred while registering',
    });
  } finally {
    client.release();
  }
};

// LOGIN USER
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(statusCodes.badRequest).json({ message: 'Missing parameters' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
      [email, password]
    );

    const user = result.rows[0];

    if (user) {
      req.session.user = { _id: user.id?.toString() || user.email };

      const token = jwt.sign(
        { user: { email: user.email } },
        process.env.JWT_SECRET_KEY as string,
        { expiresIn: '1h' }
      );

      res.status(statusCodes.success).json({ token, username: user.username });
    } else {
      res.status(statusCodes.notFound).json({ message: 'Incorrect email/password' });
    }
  } catch (error: any) {
    logger.error(error.stack);
    res.status(statusCodes.queryError).json({ error: 'Exception occurred while logging in' });
  }
};