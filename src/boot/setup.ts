import express from 'express';
import cors from 'cors';
import * as helmet from 'helmet';
import mongoose from 'mongoose';
import session from 'express-session';
import morgan from 'morgan';

import dotenv from 'dotenv';
dotenv.config();

import logger from '../middleware/winston';
import notFound from '../middleware/notFound';
import healthCheck from '../middleware/healthCheck';
import verifyToken from '../middleware/authentication';
import validator from '../middleware/validator';

import authRoutes from '../routes/auth.routes';
import messageRoutes from '../routes/messages.routes';
import usersRoutes from '../routes/users.routes';
import profileRoutes from '../routes/profile.routes';
import moviesRoutes from '../routes/movies.routes';
import ratingRoutes from '../routes/rating.routes';
import commentsRoutes from '../routes/comments.routes';

const PORT = parseInt(process.env.PORT || '8080', 10);
const app = express();

const connectToMongoDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/epita';
    console.log(`📡 Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    logger.info('✅ MongoDB Connected');
  } catch (error) {
    logger.error('❌ Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Register core middlewares
const registerCoreMiddleWare = (): void => {
  try {
    app.use(
      session({
        secret: '1234',
        resave: false,
        saveUninitialized: true,
        cookie: {
          secure: false,
          httpOnly: true,
        },
      })
    );

    app.use(
      morgan('combined', {
        stream: {
          write: (message: string) => logger.http(message.trim()),
        },
      })
    );

    app.use(express.json());
    app.use(cors());
    app.use(helmet.default());

    app.use(validator);
    app.use(healthCheck);

    app.use('/auth', authRoutes);
    app.use('/users', usersRoutes);
    app.use('/messages', verifyToken, messageRoutes);
    app.use('/profile', verifyToken, profileRoutes);
    app.use('/movies', verifyToken, moviesRoutes);
    app.use('/ratings', verifyToken, ratingRoutes);
    app.use('/comments', verifyToken, commentsRoutes);

    console.log('✅ Routes registered');

    app.use(notFound);
    logger.http('✅ Done registering all middlewares');
  } catch (err) {
    logger.error('❌ Error thrown while executing registerCoreMiddleWare', err);
    process.exit(1);
  }
};

// Handle unexpected errors
const handleError = (): void => {
  process.on('uncaughtException', (err: Error) => {
    logger.error(`💥 UNCAUGHT_EXCEPTION: ${JSON.stringify(err.stack)}`);
  });
};

// Start the Express app
const startApp = async (): Promise<void> => {
  console.log('🚀 Booting application...');
  try {
    await connectToMongoDB();
    registerCoreMiddleWare();
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🟢 Listening on http://0.0.0.0:${PORT}`);
    });    
    handleError();
  } catch (err) {
    logger.error(
      `startup :: Error while booting the application ${JSON.stringify(err, undefined, 2)}`
    );
    throw err;
  }
};

export { startApp };
