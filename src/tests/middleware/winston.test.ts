import logger from '../../middleware/winston';
import * as winston from 'winston';

describe('Winston Logger Utility', () => {
  it('should expose a valid stream.write function', () => {
    const stream = logger.stream as unknown as { write: (msg: string) => void };

    expect(stream).toBeDefined();
    expect(typeof stream.write).toBe('function');
  });

  it('should call logger.http when stream.write is invoked', () => {
    const httpSpy = jest.spyOn(logger, 'http').mockImplementation(() => undefined as any);
    const stream = logger.stream as unknown as { write: (msg: string) => void };

    stream.write('Test HTTP log\n');

    expect(httpSpy).toHaveBeenCalledWith('Test HTTP log');
    httpSpy.mockRestore();
  });

  it('should contain a console transport', () => {
    const hasConsole = logger.transports.some(
      (t) => t instanceof winston.transports.Console
    );
    expect(hasConsole).toBe(true);
  });

  it('should contain a file transport with the correct filename', () => {
    const fileTransport = logger.transports.find(
      (t) => t instanceof winston.transports.File
    ) as winston.transports.FileTransportInstance;

    expect(fileTransport).toBeDefined();
    expect(fileTransport.filename).toContain('app.log');
  });
});