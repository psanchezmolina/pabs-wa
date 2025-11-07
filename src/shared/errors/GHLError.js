/**
 * GoHighLevel API Error
 * Error class for GoHighLevel API interactions
 */
import AppError from './AppError.js';

/**
 * GHL Error Codes
 */
export const GHL_ERROR_CODES = {
  // Authentication & Authorization
  AUTH_ERROR: 'GHL_AUTH_ERROR',
  TOKEN_EXPIRED: 'GHL_TOKEN_EXPIRED',
  TOKEN_REFRESH_FAILED: 'GHL_TOKEN_REFRESH_FAILED',
  INVALID_CREDENTIALS: 'GHL_INVALID_CREDENTIALS',
  UNAUTHORIZED: 'GHL_UNAUTHORIZED',

  // API Errors
  API_ERROR: 'GHL_API_ERROR',
  RATE_LIMIT: 'GHL_RATE_LIMIT',
  INVALID_REQUEST: 'GHL_INVALID_REQUEST',
  TIMEOUT: 'GHL_TIMEOUT',

  // Resource Errors
  CONTACT_NOT_FOUND: 'GHL_CONTACT_NOT_FOUND',
  CONVERSATION_NOT_FOUND: 'GHL_CONVERSATION_NOT_FOUND',
  LOCATION_NOT_FOUND: 'GHL_LOCATION_NOT_FOUND',
  MESSAGE_SEND_FAILED: 'GHL_MESSAGE_SEND_FAILED',

  // Data Errors
  INVALID_PHONE: 'GHL_INVALID_PHONE',
  INVALID_LOCATION_ID: 'GHL_INVALID_LOCATION_ID',
  MISSING_REQUIRED_FIELD: 'GHL_MISSING_REQUIRED_FIELD',
};

/**
 * GoHighLevel API Error Class
 */
class GHLError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {string} code - GHL error code (default: GHL_API_ERROR)
   * @param {Object} details - Additional error details
   */
  constructor(message, statusCode = 500, code = GHL_ERROR_CODES.API_ERROR, details = {}) {
    super(message, statusCode, code, details);
  }

  /**
   * Create authentication error
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {GHLError}
   */
  static authError(message = 'GHL authentication failed', details = {}) {
    return new GHLError(message, 401, GHL_ERROR_CODES.AUTH_ERROR, details);
  }

  /**
   * Create token expired error
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {GHLError}
   */
  static tokenExpired(message = 'GHL access token expired', details = {}) {
    return new GHLError(message, 401, GHL_ERROR_CODES.TOKEN_EXPIRED, details);
  }

  /**
   * Create token refresh failed error
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {GHLError}
   */
  static tokenRefreshFailed(message = 'Failed to refresh GHL access token', details = {}) {
    return new GHLError(message, 500, GHL_ERROR_CODES.TOKEN_REFRESH_FAILED, details);
  }

  /**
   * Create rate limit error
   * @param {string} message - Error message
   * @param {Object} details - Additional details (should include retryAfter)
   * @returns {GHLError}
   */
  static rateLimit(message = 'GHL API rate limit exceeded', details = {}) {
    return new GHLError(message, 429, GHL_ERROR_CODES.RATE_LIMIT, details);
  }

  /**
   * Create contact not found error
   * @param {string} contactId - Contact ID or phone
   * @param {Object} details - Additional details
   * @returns {GHLError}
   */
  static contactNotFound(contactId, details = {}) {
    return new GHLError(
      `GHL contact not found: ${contactId}`,
      404,
      GHL_ERROR_CODES.CONTACT_NOT_FOUND,
      { contactId, ...details }
    );
  }

  /**
   * Create conversation not found error
   * @param {string} conversationId - Conversation ID
   * @param {Object} details - Additional details
   * @returns {GHLError}
   */
  static conversationNotFound(conversationId, details = {}) {
    return new GHLError(
      `GHL conversation not found: ${conversationId}`,
      404,
      GHL_ERROR_CODES.CONVERSATION_NOT_FOUND,
      { conversationId, ...details }
    );
  }

  /**
   * Create location not found error
   * @param {string} locationId - Location ID
   * @param {Object} details - Additional details
   * @returns {GHLError}
   */
  static locationNotFound(locationId, details = {}) {
    return new GHLError(
      `GHL location not found: ${locationId}`,
      404,
      GHL_ERROR_CODES.LOCATION_NOT_FOUND,
      { locationId, ...details }
    );
  }

  /**
   * Create invalid request error
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {GHLError}
   */
  static invalidRequest(message = 'Invalid request to GHL API', details = {}) {
    return new GHLError(message, 400, GHL_ERROR_CODES.INVALID_REQUEST, details);
  }

  /**
   * Create timeout error
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {GHLError}
   */
  static timeout(message = 'GHL API request timeout', details = {}) {
    return new GHLError(message, 504, GHL_ERROR_CODES.TIMEOUT, details);
  }

  /**
   * Create message send failed error
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {GHLError}
   */
  static messageSendFailed(message = 'Failed to send message via GHL', details = {}) {
    return new GHLError(message, 500, GHL_ERROR_CODES.MESSAGE_SEND_FAILED, details);
  }
}

export default GHLError;
