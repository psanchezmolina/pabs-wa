import Joi from 'joi';

/**
 * Validation middleware factory
 * Creates a middleware that validates request data against a Joi schema
 *
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware
 *
 * @example
 * import { validate } from './middleware/validate.js';
 * import Joi from 'joi';
 *
 * const schema = Joi.object({
 *   email: Joi.string().email().required(),
 *   password: Joi.string().min(8).required()
 * });
 *
 * router.post('/login', validate(schema, 'body'), loginController);
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown keys
    });

    if (error) {
      // Joi validation error - will be caught by error handler
      return next(error);
    }

    // Replace request property with validated value (with defaults, coerced types, etc.)
    req[property] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  /**
   * Location ID validation
   */
  locationId: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.pattern.base': 'Location ID must contain only alphanumeric characters, dashes, and underscores',
      'string.min': 'Location ID must be at least 3 characters long',
      'string.max': 'Location ID must not exceed 100 characters',
    }),

  /**
   * Phone number validation (WhatsApp format)
   */
  phone: Joi.string()
    .pattern(/^\d{10,15}(@s\.whatsapp\.net)?$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be 10-15 digits, optionally with @s.whatsapp.net suffix',
    }),

  /**
   * Message text validation
   */
  messageText: Joi.string()
    .min(1)
    .max(4096)
    .required()
    .messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message must not exceed 4096 characters',
    }),

  /**
   * Pagination validation
   */
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  /**
   * Contact ID validation
   */
  contactId: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Contact ID must contain only alphanumeric characters, dashes, and underscores',
    }),

  /**
   * Instance name validation
   */
  instanceName: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.pattern.base': 'Instance name must contain only alphanumeric characters, dashes, and underscores',
      'string.min': 'Instance name must be at least 3 characters long',
      'string.max': 'Instance name must not exceed 50 characters',
    }),

  /**
   * API key validation
   */
  apiKey: Joi.string()
    .min(10)
    .max(255)
    .required()
    .messages({
      'string.min': 'API key must be at least 10 characters long',
    }),

  /**
   * URL validation
   */
  url: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Must be a valid URL',
    }),

  /**
   * Email validation
   */
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Must be a valid email address',
    }),
};

/**
 * Combine multiple schemas
 * @param {...Object} schemas - Joi schemas to combine
 * @returns {Object} Combined schema
 *
 * @example
 * const schema = combineSchemas(
 *   Joi.object({ email: commonSchemas.email }),
 *   Joi.object({ locationId: commonSchemas.locationId })
 * );
 */
export const combineSchemas = (...schemas) => {
  return schemas.reduce((acc, schema) => acc.concat(schema), Joi.object());
};

export default validate;
