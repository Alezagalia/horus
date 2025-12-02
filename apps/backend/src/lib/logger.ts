/**
 * Structured Logger Configuration - Winston
 * Sprint 12 - US-115: Monitoring y Logging en Producción
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logLevel = process.env.LOG_LEVEL || 'info';

// Custom log format with JSON structure
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json()
);

// Console format for development (human-readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, metadata, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;

    if (Object.keys(metadata || {}).length > 0) {
      log += ` ${JSON.stringify(metadata)}`;
    }

    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

// Transport for errors (daily rotation)
const errorFileTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat,
});

// Transport for all logs (daily rotation)
const combinedFileTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

// Create Winston logger
export const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: {
    service: 'horus-backend',
    environment: process.env.NODE_ENV,
  },
  transports: [errorFileTransport, combinedFileTransport],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Helper functions for structured logging
export const logError = (message: string, error?: Error, metadata?: object) => {
  logger.error(message, {
    ...metadata,
    error: error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined,
  });
};

export const logWarn = (message: string, metadata?: object) => {
  logger.warn(message, metadata);
};

export const logInfo = (message: string, metadata?: object) => {
  logger.info(message, metadata);
};

export const logDebug = (message: string, metadata?: object) => {
  logger.debug(message, metadata);
};

export const logPerformance = (operation: string, duration: number, metadata?: object) => {
  logger.info(`Performance: ${operation}`, {
    ...metadata,
    duration_ms: duration,
    operation,
  });
};

export const logRequest = (
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
) => {
  logger.info('HTTP Request', {
    method,
    path,
    statusCode,
    duration_ms: duration,
    userId,
  });
};
