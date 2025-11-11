/**
 * Server entry point
 * Initializes and starts the Express application
 */

import 'dotenv/config';
import app from './src/app.js';
import logger from './src/config/logger.js';
import { setupUnhandledRejectionHandler } from './src/shared/middleware/error-handler.js';

// Setup unhandled rejection handler
setupUnhandledRejectionHandler();

// Get port from environment or use default
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Start server
const server = app.listen(PORT, HOST, () => {
  logger.info('🚀 Server started successfully', {
    port: PORT,
    host: HOST,
    env: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
  });

  logger.info('📡 Server endpoints available:', {
    health: `http://localhost:${PORT}/health`,
    root: `http://localhost:${PORT}/`,
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    logger.info('HTTP server closed');

    // Close other connections (database, redis, etc.)
    // TODO: Add cleanup for database, redis when needed

    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export default server;
