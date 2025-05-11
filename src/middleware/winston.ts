import * as winston from 'winston';
import { StreamOptions } from 'morgan';

const { combine, timestamp, printf, colorize } = winston.format;

const customFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
});

const logger = winston.createLogger({
  level: 'http', // ensures info + http + error + warn all appear
  format: combine(timestamp(), customFormat),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), customFormat),
    }),
    new winston.transports.File({
      filename: 'logs/app.log',
      format: combine(timestamp(), customFormat),
    }),
  ],
});

// For use with morgan
const stream: StreamOptions = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

logger.stream = stream as any;

export default logger;
