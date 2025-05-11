import * as winston from 'winston';
import { StreamOptions } from 'morgan';

const logger = winston.createLogger({
  level: 'http',
  transports: [
    new winston.transports.File({
      filename: 'logs/app.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple()
      ),
    }),
  ],
});

// Explicit type for morgan stream
const stream: StreamOptions = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

logger.stream = stream as any;

export default logger;
