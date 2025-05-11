import winston from 'winston';


const options = {
  file: {
    level: 'info',
    filename: `./logs/app.log`,
    handleException: true,
    maxSize: 5242880, // ~5MB
    maxFiles: 5,
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  },
  console: {
    level: 'debug',
    handleException: true,
    format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
  },
};

const logger = winston.createLogger({
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console),
  ],
  exitOnError: false,
});

logger.stream = {
  write: (message: string) => {
    logger.info(message);
  },
};

export default logger;
