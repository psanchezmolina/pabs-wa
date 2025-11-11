/**
 * Express Application Configuration
 * Configures all middleware and routes without starting the server
 * Server initialization is done in server.js
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import logger from './config/logger.js';
import requestLogger from './shared/middleware/request-logger.js';
import errorHandler, { notFoundHandler } from './shared/middleware/error-handler.js';

// ES modules: Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load package.json for version info
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const VERSION = packageJson.version;

/**
 * Create and configure Express application
 * @returns {express.Application} Configured Express app
 */
export function createApp() {
  const app = express();

  // ============================================
  // Security Middleware
  // ============================================

  // Helmet: Set security-related HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding for QR panel
    })
  );

  // CORS: Enable Cross-Origin Resource Sharing
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // ============================================
  // Body Parsing Middleware
  // ============================================

  // Parse JSON payloads (limit: 10MB for media processing)
  app.use(express.json({ limit: '10mb' }));

  // Parse URL-encoded bodies (extended: true for nested objects)
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ============================================
  // Static Files
  // ============================================

  // Serve static files from /public directory
  const publicPath = path.join(__dirname, '..', 'public');
  app.use(express.static(publicPath));
  logger.debug('Static files served from:', { path: publicPath });

  // ============================================
  // Request Logging
  // ============================================

  // HTTP request logger (Morgan + Winston)
  app.use(requestLogger);

  // ============================================
  // Health Check Endpoint
  // ============================================

  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: Date.now(),
      version: VERSION,
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // ============================================
  // API Routes (Placeholder - Mount later)
  // ============================================

  // TODO: Uncomment and mount routes when implemented
  // import authRoutes from './modules/auth/auth.routes.js';
  // import ghlToWaRoutes from './modules/ghl-to-wa/ghl-to-wa.routes.js';
  // import waToGhlRoutes from './modules/wa-to-ghl/wa-to-ghl.routes.js';
  // import clientsRoutes from './modules/clients/clients.routes.js';
  // import qrPanelRoutes from './modules/qr-panel/qr-panel.routes.js';

  // app.use('/auth', authRoutes);
  // app.use('/webhook/ghl', ghlToWaRoutes);
  // app.use('/webhook/wa', waToGhlRoutes);
  // app.use('/api/clients', clientsRoutes);
  // app.use('/qr', qrPanelRoutes);

  // ============================================
  // Error Handling
  // ============================================

  // 404 Handler - Must be after all routes
  app.use(notFoundHandler);

  // Global Error Handler - Must be last middleware
  app.use(errorHandler);

  logger.info('Express application configured successfully', {
    env: process.env.NODE_ENV || 'development',
    corsOrigin: corsOptions.origin,
  });

  return app;
}

// Export configured app
export default createApp();
