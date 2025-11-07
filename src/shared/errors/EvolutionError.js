/**
 * Evolution API Error
 * Error class for Evolution API (WhatsApp) interactions
 */
import AppError from './AppError.js';

/**
 * Evolution Error Codes
 */
export const EVOLUTION_ERROR_CODES = {
  // Authentication & Authorization
  AUTH_ERROR: 'EVOLUTION_AUTH_ERROR',
  INVALID_API_KEY: 'EVOLUTION_INVALID_API_KEY',
  UNAUTHORIZED: 'EVOLUTION_UNAUTHORIZED',

  // Instance Errors
  INSTANCE_NOT_FOUND: 'EVOLUTION_INSTANCE_NOT_FOUND',
  INSTANCE_NOT_CONNECTED: 'EVOLUTION_INSTANCE_NOT_CONNECTED',
  INSTANCE_DISCONNECTED: 'EVOLUTION_INSTANCE_DISCONNECTED',
  INSTANCE_CREATION_FAILED: 'EVOLUTION_INSTANCE_CREATION_FAILED',
  QR_CODE_EXPIRED: 'EVOLUTION_QR_CODE_EXPIRED',

  // Message Errors
  MESSAGE_SEND_FAILED: 'EVOLUTION_MESSAGE_SEND_FAILED',
  MESSAGE_NOT_FOUND: 'EVOLUTION_MESSAGE_NOT_FOUND',
  MESSAGE_TOO_LONG: 'EVOLUTION_MESSAGE_TOO_LONG',

  // Media Errors
  MEDIA_DOWNLOAD_FAILED: 'EVOLUTION_MEDIA_DOWNLOAD_FAILED',
  MEDIA_UPLOAD_FAILED: 'EVOLUTION_MEDIA_UPLOAD_FAILED',
  MEDIA_NOT_FOUND: 'EVOLUTION_MEDIA_NOT_FOUND',
  MEDIA_INVALID_FORMAT: 'EVOLUTION_MEDIA_INVALID_FORMAT',
  MEDIA_TOO_LARGE: 'EVOLUTION_MEDIA_TOO_LARGE',

  // Phone/Contact Errors
  INVALID_PHONE: 'EVOLUTION_INVALID_PHONE',
  PHONE_NOT_WHATSAPP: 'EVOLUTION_PHONE_NOT_WHATSAPP',
  CONTACT_NOT_FOUND: 'EVOLUTION_CONTACT_NOT_FOUND',
  CONTACT_BLOCKED: 'EVOLUTION_CONTACT_BLOCKED',

  // API Errors
  API_ERROR: 'EVOLUTION_API_ERROR',
  RATE_LIMIT: 'EVOLUTION_RATE_LIMIT',
  TIMEOUT: 'EVOLUTION_TIMEOUT',
  INVALID_REQUEST: 'EVOLUTION_INVALID_REQUEST',
  SERVICE_UNAVAILABLE: 'EVOLUTION_SERVICE_UNAVAILABLE',
};

/**
 * Evolution API Error Class
 */
class EvolutionError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {string} code - Evolution error code (default: EVOLUTION_API_ERROR)
   * @param {Object} details - Additional error details
   */
  constructor(message, statusCode = 500, code = EVOLUTION_ERROR_CODES.API_ERROR, details = {}) {
    super(message, statusCode, code, details);
  }

  /**
   * Create authentication error
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {EvolutionError}
   */
  static authError(message = 'Evolution API authentication failed', details = {}) {
    return new EvolutionError(message, 401, EVOLUTION_ERROR_CODES.AUTH_ERROR, details);
  }

  /**
   * Create instance not found error
   * @param {string} instanceName - Instance name
   * @param {Object} details - Additional details
   * @returns {EvolutionError}
   */
  static instanceNotFound(instanceName, details = {}) {
    return new EvolutionError(
      `Evolution instance not found: ${instanceName}`,
      404,
      EVOLUTION_ERROR_CODES.INSTANCE_NOT_FOUND,
      { instanceName, ...details }
    );
  }

  /**
   * Create instance not connected error
   * @param {string} instanceName - Instance name
   * @param {Object} details - Additional details
   * @returns {EvolutionError}
   */
  static instanceNotConnected(instanceName, details = {}) {
    return new EvolutionError(
      `Evolution instance not connected to WhatsApp: ${instanceName}`,
      503,
      EVOLUTION_ERROR_CODES.INSTANCE_NOT_CONNECTED,
      { instanceName, ...details }
    );
  }

  /**
   * Create instance disconnected error
   * @param {string} instanceName - Instance name
   * @param {Object} details - Additional details
   * @returns {EvolutionError}
   */
  static instanceDisconnected(instanceName, details = {}) {
    return new EvolutionError(
      `Evolution instance disconnected from WhatsApp: ${instanceName}`,
      503,
      EVOLUTION_ERROR_CODES.INSTANCE_DISCONNECTED,
      { instanceName, ...details }
    );
  }

  /**
   * Create message send failed error
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {EvolutionError}
   */
  static messageSendFailed(message = 'Failed to send WhatsApp message', details = {}) {
    return new EvolutionError(message, 500, EVOLUTION_ERROR_CODES.MESSAGE_SEND_FAILED, details);
  }

  /**
   * Create media download failed error
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {EvolutionError}
   */
  static mediaDownloadFailed(message = 'Failed to download WhatsApp media', details = {}) {
    return new EvolutionError(message, 500, EVOLUTION_ERROR_CODES.MEDIA_DOWNLOAD_FAILED, details);
  }

  /**
   * Create media upload failed error
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {EvolutionError}
   */
  static mediaUploadFailed(message = 'Failed to upload media to WhatsApp', details = {}) {
    return new EvolutionError(message, 500, EVOLUTION_ERROR_CODES.MEDIA_UPLOAD_FAILED, details);
  }

  /**
   * Create invalid phone error
   * @param {string} phone - Phone number
   * @param {Object} details - Additional details
   * @returns {EvolutionError}
   */
  static invalidPhone(phone, details = {}) {
    return new EvolutionError(
      `Invalid phone number format: ${phone}`,
      400,
      EVOLUTION_ERROR_CODES.INVALID_PHONE,
      { phone, ...details }
    );
  }

  /**
   * Create phone not on WhatsApp error
   * @param {string} phone - Phone number
   * @param {Object} details - Additional details
   * @returns {EvolutionError}
   */
  static phoneNotWhatsApp(phone, details = {}) {
    return new EvolutionError(
      `Phone number not registered on WhatsApp: ${phone}`,
      400,
      EVOLUTION_ERROR_CODES.PHONE_NOT_WHATSAPP,
      { phone, ...details }
    );
  }

  /**
   * Create rate limit error
   * @param {string} message - Error message
   * @param {Object} details - Additional details (should include retryAfter)
   * @returns {EvolutionError}
   */
  static rateLimit(message = 'Evolution API rate limit exceeded', details = {}) {
    return new EvolutionError(message, 429, EVOLUTION_ERROR_CODES.RATE_LIMIT, details);
  }

  /**
   * Create timeout error
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {EvolutionError}
   */
  static timeout(message = 'Evolution API request timeout', details = {}) {
    return new EvolutionError(message, 504, EVOLUTION_ERROR_CODES.TIMEOUT, details);
  }

  /**
   * Create invalid request error
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {EvolutionError}
   */
  static invalidRequest(message = 'Invalid request to Evolution API', details = {}) {
    return new EvolutionError(message, 400, EVOLUTION_ERROR_CODES.INVALID_REQUEST, details);
  }

  /**
   * Create QR code expired error
   * @param {string} instanceName - Instance name
   * @param {Object} details - Additional details
   * @returns {EvolutionError}
   */
  static qrCodeExpired(instanceName, details = {}) {
    return new EvolutionError(
      `QR code expired for instance: ${instanceName}`,
      400,
      EVOLUTION_ERROR_CODES.QR_CODE_EXPIRED,
      { instanceName, ...details }
    );
  }

  /**
   * Create service unavailable error
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {EvolutionError}
   */
  static serviceUnavailable(message = 'Evolution API service unavailable', details = {}) {
    return new EvolutionError(message, 503, EVOLUTION_ERROR_CODES.SERVICE_UNAVAILABLE, details);
  }
}

export default EvolutionError;
