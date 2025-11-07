import logger from '../../config/logger.js';
import AppError from '../errors/AppError.js';

/**
 * Check if error is a Joi validation error
 * @param {Error} error - Error object
 * @returns {boolean} True if Joi validation error
 */
const isJoiValidationError = (error) => {
  return error.name === 'ValidationError' && error.isJoi === true;
};

/**
 * Check if error is an operational error (AppError)
 * @param {Error} error - Error object
 * @returns {boolean} True if operational error
 */
const isOperationalError = (error) => {
  return error instanceof AppError && error.isOperational === true;
};

/**
 * Format Joi validation error
 * @param {Error} error - Joi validation error
 * @returns {Object} Formatted error response
 */
const formatJoiError = (error) => {
  const details = error.details.map((detail) => ({
    field: detail.path.join('.'),
    message: detail.message,
    type: detail.type,
  }));

  return {
    message: 'Validation error',
    code: 'VALIDATION_ERROR',
    statusCode: 400,
    details: {
      fields: details,
      originalMessage: error.message,
    },
  };
};

/**
 * Format AppError (custom application error)
 * @param {AppError} error - Application error
 * @returns {Object} Formatted error response
 */
const formatAppError = (error) => {
  return {
    message: error.message,
    code: error.code || 'APP_ERROR',
    statusCode: error.statusCode || 500,
    details: error.details || {},
  };
};

/**
 * Format generic error
 * @param {Error} error - Generic error
 * @param {boolean} isDevelopment - Is development environment
 * @returns {Object} Formatted error response
 */
const formatGenericError = (error, isDevelopment) => {
  // In production, don't expose internal error details
  const message = isDevelopment
    ? error.message
    : 'An unexpected error occurred';

  const details = isDevelopment
    ? {
        name: error.name,
        stack: error.stack,
        originalMessage: error.message,
      }
    : {};

  return {
    message,
    code: 'INTERNAL_ERROR',
    statusCode: 500,
    details,
  };
};

/**
 * Log error with appropriate level
 * @param {Error} error - Error object
 * @param {Object} formattedError - Formatted error response
 * @param {Object} req - Express request object
 */
const logError = (error, formattedError, req) => {
  const logContext = {
    error: formattedError,
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: sanitizeBody(req.body),
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
    stack: error.stack,
  };

  // Log with appropriate level based on status code
  if (formattedError.statusCode >= 500) {
    // Server errors - log as error
    logger.error('Server error', logContext);
  } else if (formattedError.statusCode >= 400) {
    // Client errors - log as warning
    logger.warn('Client error', logContext);
  } else {
    // Other errors - log as info
    logger.info('Request error', logContext);
  }
};

/**
 * Sanitize request body to remove sensitive data from logs
 * @param {Object} body - Request body
 * @returns {Object} Sanitized body
 */
const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'accessToken',
    'access_token',
    'refreshToken',
    'refresh_token',
    'secret',
    'authorization',
  ];

  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
};

/**
 * Global error handler middleware for Express
 * Must be the last middleware in the chain
 *
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 *
 * @example
 * // In your Express app
 * import errorHandler from './middleware/error-handler.js';
 *
 * app.use(errorHandler);
 */
const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Format error based on type
  let formattedError;

  if (isJoiValidationError(err)) {
    // Joi validation error
    formattedError = formatJoiError(err);
  } else if (isOperationalError(err)) {
    // Custom AppError
    formattedError = formatAppError(err);
  } else {
    // Generic error
    formattedError = formatGenericError(err, isDevelopment);
  }

  // Log the error
  logError(err, formattedError, req);

  // Send response
  res.status(formattedError.statusCode).json({
    success: false,
    error: {
      message: formattedError.message,
      code: formattedError.code,
      statusCode: formattedError.statusCode,
      details: formattedError.details,
    },
  });
};

/**
 * Not found handler middleware
 * Use this before the error handler to catch 404s
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 *
 * @example
 * // In your Express app
 * import { notFoundHandler } from './middleware/error-handler.js';
 *
 * // After all routes
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.path}`,
    404,
    'NOT_FOUND',
    {
      method: req.method,
      path: req.path,
    }
  );

  next(error);
};

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 *
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 *
 * @example
 * import { asyncHandler } from './middleware/error-handler.js';
 *
 * router.get('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await getUser(req.params.id);
 *   res.json(user);
 * }));
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Unhandled rejection handler
 * Call this in your main app file to catch unhandled promise rejections
 *
 * @example
 * import { setupUnhandledRejectionHandler } from './middleware/error-handler.js';
 *
 * setupUnhandledRejectionHandler();
 */
export const setupUnhandledRejectionHandler = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      promise,
    });

    // In production, you might want to exit the process
    if (process.env.NODE_ENV === 'production') {
      logger.error('Exiting process due to unhandled rejection');
      process.exit(1);
    }
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
    });

    // Always exit on uncaught exception
    logger.error('Exiting process due to uncaught exception');
    process.exit(1);
  });
};

export default errorHandler;
