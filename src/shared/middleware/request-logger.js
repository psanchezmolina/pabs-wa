import morgan from 'morgan';
import logger from '../../config/logger.js';

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Custom token to add timestamp in ISO format
 */
morgan.token('timestamp', () => {
  return new Date().toISOString();
});

/**
 * Custom token to get response time in ms
 */
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '';
  }
  const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
    (res._startAt[1] - req._startAt[1]) * 1e-6;
  return ms.toFixed(3);
});

/**
 * Winston stream adapter
 * Writes Morgan logs to Winston logger
 */
const winstonStream = {
  write: (message) => {
    // Remove trailing newline
    const logMessage = message.trim();

    // Parse combined format and extract status code
    const statusMatch = logMessage.match(/\s(\d{3})\s/);
    const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 0;

    // Log with appropriate level based on status code
    if (statusCode >= 500) {
      logger.error(logMessage);
    } else if (statusCode >= 400) {
      logger.warn(logMessage);
    } else {
      logger.info(logMessage);
    }
  },
};

/**
 * Custom format for production (JSON format for Winston)
 * Includes all relevant request information
 */
const productionFormat = (tokens, req, res) => {
  const log = {
    timestamp: tokens.timestamp(req, res),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: parseInt(tokens.status(req, res), 10),
    responseTime: `${tokens['response-time-ms'](req, res)}ms`,
    contentLength: tokens.res(req, res, 'content-length') || '0',
    userAgent: tokens['user-agent'](req, res),
    ip: tokens['remote-addr'](req, res),
    httpVersion: tokens['http-version'](req, res),
  };

  return JSON.stringify(log);
};

/**
 * Skip logging for certain routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} True if should skip logging
 */
const skipRoutes = (req, res) => {
  // Skip health check endpoint
  if (req.path === '/health') {
    return true;
  }

  // Skip successful requests in production (optional)
  // Uncomment to only log errors in production
  // if (process.env.NODE_ENV === 'production' && res.statusCode < 400) {
  //   return true;
  // }

  return false;
};

/**
 * Request logger middleware
 *
 * Development: Colorized 'dev' format to console
 * Production: JSON format to Winston (app.log, error.log)
 *
 * @type {Function} Express middleware
 *
 * @example
 * import requestLogger from './middleware/request-logger.js';
 *
 * app.use(requestLogger);
 */
let requestLogger;

if (isDevelopment) {
  // Development: colorized dev format to console
  requestLogger = morgan('dev', {
    skip: skipRoutes,
  });

  logger.info('Request logger initialized', {
    mode: 'development',
    format: 'dev',
    destination: 'console',
  });
} else {
  // Production: JSON format to Winston
  requestLogger = morgan(productionFormat, {
    stream: winstonStream,
    skip: skipRoutes,
  });

  logger.info('Request logger initialized', {
    mode: 'production',
    format: 'json',
    destination: 'winston',
  });
}

/**
 * Alternative: Combined format (Apache style) for production
 * Uncomment to use instead of JSON format
 */
// if (!isDevelopment) {
//   requestLogger = morgan('combined', {
//     stream: winstonStream,
//     skip: skipRoutes,
//   });
// }

/**
 * Get Morgan instance with custom configuration
 * @param {string} format - Morgan format string
 * @param {Object} options - Morgan options
 * @returns {Function} Morgan middleware
 *
 * @example
 * // Custom format for specific routes
 * const apiLogger = getMorganLogger('tiny', { skip: (req) => !req.path.startsWith('/api') });
 * app.use('/api', apiLogger);
 */
export const getMorganLogger = (format, options = {}) => {
  const defaultOptions = {
    stream: isDevelopment ? undefined : winstonStream,
    ...options,
  };

  return morgan(format, defaultOptions);
};

/**
 * Create a custom Morgan logger with Winston stream
 * Useful for specific routes or modules
 *
 * @param {Function|string} format - Morgan format or custom function
 * @param {Object} options - Additional options
 * @returns {Function} Morgan middleware
 *
 * @example
 * const webhookLogger = createCustomLogger((tokens, req, res) => {
 *   return JSON.stringify({
 *     type: 'webhook',
 *     method: tokens.method(req, res),
 *     path: tokens.url(req, res),
 *     status: tokens.status(req, res)
 *   });
 * });
 *
 * app.use('/webhook', webhookLogger);
 */
export const createCustomLogger = (format, options = {}) => {
  return morgan(format, {
    stream: winstonStream,
    ...options,
  });
};

/**
 * Predefined logger configurations
 */
export const loggerPresets = {
  /**
   * Minimal logging (method, url, status, response-time)
   */
  minimal: morgan('tiny', {
    stream: isDevelopment ? undefined : winstonStream,
    skip: skipRoutes,
  }),

  /**
   * Combined Apache-style logging
   */
  combined: morgan('combined', {
    stream: isDevelopment ? undefined : winstonStream,
    skip: skipRoutes,
  }),

  /**
   * Short format with response time
   */
  short: morgan('short', {
    stream: isDevelopment ? undefined : winstonStream,
    skip: skipRoutes,
  }),

  /**
   * Only log errors (4xx and 5xx)
   */
  errorsOnly: morgan('combined', {
    stream: winstonStream,
    skip: (req, res) => res.statusCode < 400 || skipRoutes(req, res),
  }),
};

export default requestLogger;
