import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Custom format for colorized console output in development
 */
const colorizedFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    // Add stack trace if present
    if (stack) {
      msg += `\n${stack}`;
    }

    return msg;
  })
);

/**
 * JSON format for production
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create daily rotate file transport configuration
 * @param {string} filename - Name of the log file
 * @param {string} level - Log level for this transport
 * @returns {DailyRotateFile} Configured transport
 */
const createRotateTransport = (filename, level = 'info') => {
  return new DailyRotateFile({
    filename: path.join(__dirname, '../../logs', `${filename}-%DATE%.log`),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
    level,
    format: jsonFormat,
    zippedArchive: true,
  });
};

/**
 * Main application logger
 * Logs all info+ messages to app.log, errors to error.log
 */
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: jsonFormat,
  transports: [
    // All logs (info+) to app.log
    createRotateTransport('app', 'info'),

    // Only errors to error.log
    createRotateTransport('error', 'error'),
  ],
  exceptionHandlers: [
    createRotateTransport('exceptions', 'error'),
  ],
  rejectionHandlers: [
    createRotateTransport('rejections', 'error'),
  ],
});

/**
 * Add console transport in development
 */
if (!isProduction) {
  logger.add(new winston.transports.Console({
    format: colorizedFormat,
  }));
}

/**
 * Specialized logger for WhatsApp message tracking
 * Logs to messages.log for audit trail
 */
const messageLogger = winston.createLogger({
  level: 'info',
  format: jsonFormat,
  transports: [
    createRotateTransport('messages', 'info'),
  ],
});

/**
 * Log a WhatsApp message event
 * @param {Object} data - Message data
 * @param {string} data.direction - 'ghl-to-wa' or 'wa-to-ghl'
 * @param {string} data.locationId - GHL location ID
 * @param {string} data.phone - Phone number
 * @param {string} data.messageType - 'text', 'audio', 'image', etc.
 * @param {string} data.status - 'sent', 'failed', 'received', etc.
 * @param {Object} [data.metadata] - Additional metadata
 */
export const logMessage = (data) => {
  messageLogger.info('WhatsApp message event', {
    timestamp: new Date().toISOString(),
    ...data,
  });
};

/**
 * Create a child logger with additional metadata
 * @param {Object} metadata - Default metadata for this logger instance
 * @returns {winston.Logger} Child logger
 */
export const createChildLogger = (metadata) => {
  return logger.child(metadata);
};

export default logger;
