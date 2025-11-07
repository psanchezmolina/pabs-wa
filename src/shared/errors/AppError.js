/**
 * Base application error class
 * All custom errors should extend from this class
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code for identification
   * @param {Object} details - Additional error details
   */
  constructor(message, statusCode = 500, code = 'APP_ERROR', details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguish operational errors from programming errors

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON format
   * @returns {Object} Error in JSON format
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      stack: this.stack,
    };
  }
}

export default AppError;
