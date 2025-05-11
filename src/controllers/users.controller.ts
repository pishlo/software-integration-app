import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import statusCodes from '../constants/statusCodes';
import logger from '../middleware/winston';
import pool from '../boot/database/db_connect';

interface SessionRequest extends Request {
  session: {
    user?: {
      email: string;
    };
  };
}

const register = async (req: Request, res: Response): Promise<Response | void> => {
  const { email, username, password, country, city, street, creation_date } = req.body;

  if (!email || !username || !password || !country) {
    return res.status(statusCodes.badRequest).json({ message: 'Missing parameters' });
  }

  const client = await pool.connect();

  try {
    const result = await client.query('SELECT * FROM users WHERE email = $1;', [email]);

    if (result.rowCount) {
      return res
        .status(statusCodes.userAlreadyExists)
        .json({ message: 'User already has an account' });
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
    return res.status(statusCodes.success).json({ message: 'User created' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    logger.error(error.stack);
    return res.status(statusCodes.queryError).json({
      message: 'Exception occurred while registering',
    });
  } finally {
    client.release();
  }
};

const login = async (req: SessionRequest, res: Response): Promise<Response | void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(statusCodes.badRequest).json({ message: 'Missing parameters' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password);',
      [email, password]
    );

    const user = result.rows[0];

    if (user) {
      req.session.user = { email: user.email };

      const token = jwt.sign(
        { user: { email: user.email } },
        process.env.JWT_SECRET_KEY as string,
        { expiresIn: '1h' }
      );

      return res.status(statusCodes.success).json({ token, username: user.username });
    } else {
      return res.status(statusCodes.notFound).json({ message: 'Incorrect email/password' });
    }
  } catch (error: any) {
    logger.error(error.stack);
    return res
      .status(statusCodes.queryError)
      .json({ error: 'Exception occurred while logging in' });
  }
};

export default {
  register,
  login,
};