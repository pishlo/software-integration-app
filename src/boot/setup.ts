const express = require('express');
const cors = require('cors'); 
import * as helmet from 'helmet';
import mongoose from 'mongoose';
const session = require('express-session'); 
const morgan = require('morgan'); 

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

const PORT = process.env.PORT || 8080;
const app = express();

// MongoDB connection
try {
  console.log('📡 Connecting to MongoDB...');
  mongoose.connect('mongodb://localhost:27017/epita');
  logger.info('✅ MongoDB Connected');

} catch (error) {
  logger.error('❌ Error connecting to MongoDB: ' + error);

}

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
    logger.error('❌ Error thrown while executing registerCoreMiddleWare',err);
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
const startApp = (): void => {
  console.log('🚀 Booting application...');
  try {
    registerCoreMiddleWare();
    app.listen(PORT, () => {
      logger.info(`🟢 Listening on http://127.0.0.1:${PORT}`);
    });
    handleError();
  } catch (err) {
    logger.error(`startup :: Error while booting the application ${JSON.stringify(err, undefined, 2)}`);
    throw err;
  }
};

export { startApp };