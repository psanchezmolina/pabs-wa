/**
 * Validation Error
 * Error class for data validation failures
 */
import AppError from './AppError.js';

/**
 * Validation Error Codes
 */
export const VALIDATION_ERROR_CODES = {
  // General Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',

  // Required Fields
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  REQUIRED_FIELDS_MISSING: 'REQUIRED_FIELDS_MISSING',

  // Type Validation
  INVALID_TYPE: 'INVALID_TYPE',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Range & Length
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  VALUE_TOO_SMALL: 'VALUE_TOO_SMALL',
  VALUE_TOO_LARGE: 'VALUE_TOO_LARGE',
  INVALID_LENGTH: 'INVALID_LENGTH',
  STRING_TOO_SHORT: 'STRING_TOO_SHORT',
  STRING_TOO_LONG: 'STRING_TOO_LONG',
  ARRAY_TOO_SHORT: 'ARRAY_TOO_SHORT',
  ARRAY_TOO_LONG: 'ARRAY_TOO_LONG',

  // Format Validation
  INVALID_EMAIL: 'INVALID_EMAIL',
  INVALID_PHONE: 'INVALID_PHONE',
  INVALID_URL: 'INVALID_URL',
  INVALID_UUID: 'INVALID_UUID',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_JSON: 'INVALID_JSON',

  // WhatsApp Specific
  INVALID_WHATSAPP_JID: 'INVALID_WHATSAPP_JID',
  INVALID_PHONE_FORMAT: 'INVALID_PHONE_FORMAT',

  // Enum & Choices
  INVALID_ENUM_VALUE: 'INVALID_ENUM_VALUE',
  INVALID_CHOICE: 'INVALID_CHOICE',

  // Uniqueness
  DUPLICATE_VALUE: 'DUPLICATE_VALUE',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
};

/**
 * Validation Error Class
 */
class ValidationError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {string} code - Validation error code (default: VALIDATION_FAILED)
   * @param {Object} details - Additional error details (field, value, constraints, etc.)
   */
  constructor(message, code = VALIDATION_ERROR_CODES.VALIDATION_FAILED, details = {}) {
    super(message, 400, code, details);
  }

  /**
   * Create required field missing error
   * @param {string} field - Field name
   * @param {Object} details - Additional details
   * @returns {ValidationError}
   */
  static requiredField(field, details = {}) {
    return new ValidationError(
      `Required field missing: ${field}`,
      VALIDATION_ERROR_CODES.REQUIRED_FIELD_MISSING,
      { field, ...details }
    );
  }

  /**
   * Create multiple required fields missing error
   * @param {string[]} fields - Array of field names
   * @param {Object} details - Additional details
   * @returns {ValidationError}
   */
  static requiredFields(fields, details = {}) {
    return new ValidationError(
      `Required fields missing: ${fields.join(', ')}`,
      VALIDATION_ERROR_CODES.REQUIRED_FIELDS_MISSING,
      { fields, ...details }
    );
  }

  /**
   * Create invalid type error
   * @param {string} field - Field name
   * @param {string} expectedType - Expected type
   * @param {string} actualType - Actual type
   * @param {Object} details - Additional details
   * @returns {ValidationError}
   */
  static invalidType(field, expectedType, actualType, details = {}) {
    return new ValidationError(
      `Invalid type for field '${field}': expected ${expectedType}, got ${actualType}`,
      VALIDATION_ERROR_CODES.INVALID_TYPE,
      { field, expectedType, actualType, ...details }
    );
  }

  /**
   * Create invalid format error
   * @param {string} field - Field name
   * @param {string} expectedFormat - Expected format
   * @param {Object} details - Additional details
   * @returns {ValidationError}
   */
  static invalidFormat(field, expectedFormat, details = {}) {
    return new ValidationError(
      `Invalid format for field '${field}': expected ${expectedFormat}`,
      VALIDATION_ERROR_CODES.INVALID_FORMAT,
      { field, expectedFormat, ...details }
    );
  }

  /**
   * Create invalid email error
   * @param {string} email - Invalid email
   * @param {Object} details - Additional details
   * @returns {ValidationError}
   */
  static invalidEmail(email, details = {}) {
    return new ValidationError(
      `Invalid email format: ${email}`,
      VALIDATION_ERROR_CODES.INVALID_EMAIL,
      { email, ...details }
    );
  }

  /**
   * Create invalid phone error
   * @param {string} phone - Invalid phone
   * @param {Object} details - Additional details
   * @returns {ValidationError}
   */
  static invalidPhone(phone, details = {}) {
    return new ValidationError(
      `Invalid phone number format: ${phone}`,
      VALIDATION_ERROR_CODES.INVALID_PHONE,
      { phone, ...details }
    );
  }

  /**
   * Create invalid WhatsApp JID error
   * @param {string} jid - Invalid JID
   * @param {Object} details - Additional details
   * @returns {ValidationError}
   */
  static invalidWhatsAppJID(jid, details = {}) {
    return new ValidationError(
      `Invalid WhatsApp JID format: ${jid}`,
      VALIDATION_ERROR_CODES.INVALID_WHATSAPP_JID,
      { jid, ...details }
    );
  }

  /**
   * Create invalid URL error
   * @param {string} url - Invalid URL
   * @param {Object} details - Additional details
   * @returns {ValidationError}
   */
  static invalidUrl(url, details = {}) {
    return new ValidationError(
      `Invalid URL format: ${url}`,
      VALIDATION_ERROR_CODES.INVALID_URL,
      { url, ...details }
    );
  }

  /**
   * Create string too long error
   * @param {string} field - Field name
   * @param {number} maxLength - Maximum length
   * @param {number} actualLength - Actual length
   * @param {Object} details - Additional details
   * @returns {ValidationError}
   */
  static stringTooLong(field, maxLength, actualLength, details = {}) {
    return new ValidationError(
      `Field '${field}' exceeds maximum length of ${maxLength} (got ${actualLength})`,
      VALIDATION_ERROR_CODES.STRING_TOO_LONG,
      { field, maxLength, actualLength, ...details }
    );
  }

  /**
   * Create string too short error
   * @param {string} field - Field name
   * @param {number} minLength - Minimum length
   * @param {number} actualLength - Actual length
   * @param {Object} details - Additional details
   * @returns {ValidationError}
   */
  static stringTooShort(field, minLength, actualLength, details = {}) {
    return new ValidationError(
      `Field '${field}' is below minimum length of ${minLength} (got ${actualLength})`,
      VALIDATION_ERROR_CODES.STRING_TOO_SHORT,
      { field, minLength, actualLength, ...details }
    );
  }

  /**
   * Create out of range error
   * @param {string} field - Field name
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @param {number} actual - Actual value
   * @param {Object} details - Additional details
   * @returns {ValidationError}
   */
  static outOfRange(field, min, max, actual, details = {}) {
    return new ValidationError(
      `Field '${field}' value ${actual} is out of range [${min}, ${max}]`,
      VALIDATION_ERROR_CODES.OUT_OF_RANGE,
      { field, min, max, actual, ...details }
    );
  }

  /**
   * Create invalid enum value error
   * @param {string} field - Field name
   * @param {Array} allowedValues - Allowed values
   * @param {*} actualValue - Actual value
   * @param {Object} details - Additional details
   * @returns {ValidationError}
   */
  static invalidEnumValue(field, allowedValues, actualValue, details = {}) {
    return new ValidationError(
      `Invalid value for field '${field}': ${actualValue}. Allowed values: ${allowedValues.join(', ')}`,
      VALIDATION_ERROR_CODES.INVALID_ENUM_VALUE,
      { field, allowedValues, actualValue, ...details }
    );
  }

  /**
   * Create duplicate value error
   * @param {string} field - Field name
   * @param {*} value - Duplicate value
   * @param {Object} details - Additional details
   * @returns {ValidationError}
   */
  static duplicateValue(field, value, details = {}) {
    return new ValidationError(
      `Duplicate value for field '${field}': ${value}`,
      VALIDATION_ERROR_CODES.DUPLICATE_VALUE,
      { field, value, ...details }
    );
  }

  /**
   * Create already exists error
   * @param {string} resource - Resource type
   * @param {string} identifier - Identifier value
   * @param {Object} details - Additional details
   * @returns {ValidationError}
   */
  static alreadyExists(resource, identifier, details = {}) {
    return new ValidationError(
      `${resource} already exists: ${identifier}`,
      VALIDATION_ERROR_CODES.ALREADY_EXISTS,
      { resource, identifier, ...details }
    );
  }

  /**
   * Create invalid date error
   * @param {string} field - Field name
   * @param {*} value - Invalid date value
   * @param {Object} details - Additional details
   * @returns {ValidationError}
   */
  static invalidDate(field, value, details = {}) {
    return new ValidationError(
      `Invalid date format for field '${field}': ${value}`,
      VALIDATION_ERROR_CODES.INVALID_DATE,
      { field, value, ...details }
    );
  }

  /**
   * Create invalid JSON error
   * @param {string} message - Error message
   * @param {Object} details - Additional details
   * @returns {ValidationError}
   */
  static invalidJson(message = 'Invalid JSON format', details = {}) {
    return new ValidationError(message, VALIDATION_ERROR_CODES.INVALID_JSON, details);
  }
}

export default ValidationError;
