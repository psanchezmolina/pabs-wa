import Redis from 'ioredis';
import logger from './logger.js';

// Redis configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

if (!process.env.REDIS_URL) {
  logger.warn('REDIS_URL not set, using default: redis://localhost:6379');
}

/**
 * Redis client configuration options
 */
const redisOptions = {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.debug('Redis retry attempt', { attempt: times, delay });
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Reconnect when Redis is in readonly mode
      logger.warn('Redis in READONLY mode, reconnecting...', { error: err.message });
      return true;
    }
    return false;
  },
};

/**
 * Main Redis client instance
 * @type {Redis}
 */
const redisClient = new Redis(redisUrl, redisOptions);

// Track connection state
let isConnected = false;
let isReady = false;

/**
 * Event: connect
 * Fired when connection is established (but not ready yet)
 */
redisClient.on('connect', () => {
  isConnected = true;
  logger.info('Redis connection established', {
    url: redisUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'), // Hide password in logs
    status: 'connecting',
  });
});

/**
 * Event: ready
 * Fired when Redis is ready to receive commands
 */
redisClient.on('ready', () => {
  isReady = true;
  logger.info('Redis client ready', {
    url: redisUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'),
    status: 'ready',
  });
});

/**
 * Event: error
 * Fired when an error occurs
 */
redisClient.on('error', (err) => {
  logger.error('Redis error', {
    error: err.message,
    code: err.code,
    stack: err.stack,
  });
});

/**
 * Event: close
 * Fired when connection is closed
 */
redisClient.on('close', () => {
  isConnected = false;
  isReady = false;
  logger.warn('Redis connection closed');
});

/**
 * Event: reconnecting
 * Fired when client is trying to reconnect
 */
redisClient.on('reconnecting', (time) => {
  logger.info('Redis reconnecting', {
    attempt: time,
    status: 'reconnecting',
  });
});

/**
 * Event: end
 * Fired when connection is ended (no more reconnect attempts)
 */
redisClient.on('end', () => {
  isConnected = false;
  isReady = false;
  logger.error('Redis connection ended', {
    status: 'disconnected',
  });
});

/**
 * Get the Redis client instance
 * Use this function when creating BullMQ queues or workers
 *
 * @returns {Redis} Redis client instance
 *
 * @example
 * import { getRedisClient } from './config/redis.js';
 * import { Queue } from 'bullmq';
 *
 * const queue = new Queue('my-queue', {
 *   connection: getRedisClient()
 * });
 */
export const getRedisClient = () => {
  return redisClient;
};

/**
 * Check if Redis is connected
 * @returns {boolean} True if connected
 */
export const isRedisConnected = () => {
  return isConnected;
};

/**
 * Check if Redis is ready to receive commands
 * @returns {boolean} True if ready
 */
export const isRedisReady = () => {
  return isReady;
};

/**
 * Get Redis connection status
 * @returns {Object} Connection status information
 */
export const getRedisStatus = () => {
  return {
    connected: isConnected,
    ready: isReady,
    status: redisClient.status,
    url: redisUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'),
  };
};

/**
 * Gracefully close Redis connection
 * @returns {Promise<void>}
 */
export const closeRedis = async () => {
  try {
    logger.info('Closing Redis connection...');
    await redisClient.quit();
    logger.info('Redis connection closed gracefully');
  } catch (error) {
    logger.error('Error closing Redis connection', {
      error: error.message,
      stack: error.stack,
    });
    // Force disconnect if quit fails
    redisClient.disconnect();
  }
};

/**
 * Ping Redis to check connectivity
 * @returns {Promise<string>} 'PONG' if successful
 * @throws {Error} If ping fails
 */
export const pingRedis = async () => {
  try {
    const result = await redisClient.ping();
    logger.debug('Redis ping successful', { result });
    return result;
  } catch (error) {
    logger.error('Redis ping failed', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Get Redis server info
 * @returns {Promise<Object>} Redis server information
 */
export const getRedisInfo = async () => {
  try {
    const info = await redisClient.info();
    const lines = info.split('\r\n');
    const result = {};

    lines.forEach((line) => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    });

    return result;
  } catch (error) {
    logger.error('Failed to get Redis info', {
      error: error.message,
    });
    throw error;
  }
};

// Graceful shutdown handling
const shutdown = async (signal) => {
  logger.info(`Received ${signal}, closing Redis connection...`);
  await closeRedis();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Log initialization
logger.info('Redis module initialized', {
  url: redisUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'),
  maxRetriesPerRequest: redisOptions.maxRetriesPerRequest,
});

export default redisClient;
