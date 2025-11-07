import AppError from './AppError.js';

/**
 * Database-related error
 */
class DatabaseError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {Object} details - Additional error details
   */
  constructor(message, statusCode = 500, details = {}) {
    super(message, statusCode, 'DATABASE_ERROR', details);
  }
}

export default DatabaseError;
