import axios from 'axios';
import axiosRetry from 'axios-retry';
import logger from '../../config/logger.js';

/**
 * Pre-configured axios instance with retry logic
 *
 * Features:
 * - 3 retry attempts
 * - Exponential backoff (1s, 2s, 4s)
 * - Only retries on 5xx errors and network errors
 * - Logs all requests and retries
 *
 * @example
 * import httpClient from './shared/utils/http-client.js';
 *
 * const response = await httpClient.get('https://api.example.com/data');
 * const data = await httpClient.post('https://api.example.com/users', { name: 'John' });
 */

/**
 * Create axios instance with default configuration
 */
const httpClient = axios.create({
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Configure axios-retry
 *
 * Retry configuration:
 * - retries: 3 attempts (total of 4 requests including original)
 * - retryDelay: Exponential backoff (1s → 2s → 4s)
 * - retryCondition: Only retry on 5xx errors and network errors
 */
axiosRetry(httpClient, {
  retries: 3,

  /**
   * Exponential backoff delay
   * @param {number} retryCount - Current retry attempt (1, 2, 3)
   * @returns {number} Delay in milliseconds
   */
  retryDelay: (retryCount) => {
    const delay = axiosRetry.exponentialDelay(retryCount);
    logger.debug('HTTP retry delay', {
      retryCount,
      delay: `${delay}ms`,
    });
    return delay;
  },

  /**
   * Determine if request should be retried
   * @param {Error} error - Axios error object
   * @returns {boolean} True if should retry
   */
  retryCondition: (error) => {
    // Retry on network errors (no response)
    if (axiosRetry.isNetworkError(error)) {
      logger.warn('Network error detected, will retry', {
        message: error.message,
        code: error.code,
      });
      return true;
    }

    // Retry on 5xx server errors
    if (axiosRetry.isRetryableError(error)) {
      const status = error.response?.status;
      if (status && status >= 500 && status < 600) {
        logger.warn('Server error detected, will retry', {
          status,
          statusText: error.response?.statusText,
          url: error.config?.url,
        });
        return true;
      }
    }

    // Don't retry on 4xx client errors
    return false;
  },

  /**
   * Called on each retry
   */
  onRetry: (retryCount, error, requestConfig) => {
    logger.info('HTTP request retry', {
      retryCount,
      method: requestConfig.method?.toUpperCase(),
      url: requestConfig.url,
      error: error.message,
      status: error.response?.status,
    });
  },
});

/**
 * Request interceptor
 * Logs all outgoing requests
 */
httpClient.interceptors.request.use(
  (config) => {
    logger.debug('HTTP request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: sanitizeHeaders(config.headers),
    });
    return config;
  },
  (error) => {
    logger.error('HTTP request error', {
      error: error.message,
      stack: error.stack,
    });
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Logs all responses and errors
 */
httpClient.interceptors.response.use(
  (response) => {
    logger.debug('HTTP response', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      duration: response.config.metadata?.duration,
    });
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const logData = {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status,
      statusText: error.response?.statusText,
      error: error.message,
      code: error.code,
    };

    if (status && status >= 500) {
      logger.error('HTTP server error (5xx)', logData);
    } else if (status && status >= 400) {
      logger.warn('HTTP client error (4xx)', logData);
    } else if (error.code === 'ECONNABORTED') {
      logger.error('HTTP timeout error', logData);
    } else {
      logger.error('HTTP error', logData);
    }

    return Promise.reject(error);
  }
);

/**
 * Sanitize headers to remove sensitive information from logs
 * @param {Object} headers - Request headers
 * @returns {Object} Sanitized headers
 */
const sanitizeHeaders = (headers) => {
  if (!headers) return {};

  const sensitiveKeys = [
    'authorization',
    'x-api-key',
    'apikey',
    'api-key',
    'x-auth-token',
    'cookie',
    'set-cookie',
  ];

  const sanitized = { ...headers };

  Object.keys(sanitized).forEach((key) => {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = '***REDACTED***';
    }
  });

  return sanitized;
};

/**
 * Create a custom HTTP client with specific configuration
 * @param {Object} config - Axios configuration
 * @param {Object} retryConfig - Axios-retry configuration
 * @returns {Object} Configured axios instance
 *
 * @example
 * const apiClient = createHttpClient({
 *   baseURL: 'https://api.example.com',
 *   timeout: 10000,
 * }, {
 *   retries: 5,
 *   retryDelay: axiosRetry.exponentialDelay,
 * });
 */
export const createHttpClient = (config = {}, retryConfig = {}) => {
  const client = axios.create({
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    ...config,
  });

  const defaultRetryConfig = {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      return axiosRetry.isNetworkError(error) ||
             (axiosRetry.isRetryableError(error) &&
              error.response?.status >= 500);
    },
    ...retryConfig,
  };

  axiosRetry(client, defaultRetryConfig);

  // Add same interceptors
  client.interceptors.request.use(
    httpClient.interceptors.request.handlers[0].fulfilled,
    httpClient.interceptors.request.handlers[0].rejected
  );

  client.interceptors.response.use(
    httpClient.interceptors.response.handlers[0].fulfilled,
    httpClient.interceptors.response.handlers[0].rejected
  );

  return client;
};

/**
 * Helper to check if error is retryable
 * @param {Error} error - Error object
 * @returns {boolean} True if error is retryable
 */
export const isRetryableError = (error) => {
  if (axiosRetry.isNetworkError(error)) {
    return true;
  }

  const status = error.response?.status;
  return status && status >= 500 && status < 600;
};

/**
 * Helper to get retry count from axios config
 * @param {Object} config - Axios config
 * @returns {number} Current retry count
 */
export const getRetryCount = (config) => {
  return config['axios-retry']?.retryCount || 0;
};

export default httpClient;
