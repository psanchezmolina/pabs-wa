import { createClient } from '@supabase/supabase-js';
import logger from './logger.js';
import DatabaseError from '../shared/errors/DatabaseError.js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_KEY environment variables are required');
}

/**
 * Supabase client instance
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
  },
});

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * In-memory cache for client configurations
 * Structure: Map<locationId, { data: Object, timestamp: number }>
 * @type {Map<string, {data: Object, timestamp: number}>}
 */
const configCache = new Map();

/**
 * Check if a cache entry is still valid
 * @param {number} timestamp - Cache entry timestamp
 * @returns {boolean} True if cache is still valid
 */
const isCacheValid = (timestamp) => {
  return Date.now() - timestamp < CACHE_TTL;
};

/**
 * Get client configuration from cache
 * @param {string} locationId - GHL location ID
 * @returns {Object|null} Cached config or null if not found/expired
 */
const getFromCache = (locationId) => {
  const cached = configCache.get(locationId);

  if (!cached) {
    return null;
  }

  if (!isCacheValid(cached.timestamp)) {
    configCache.delete(locationId);
    logger.debug('Cache expired for location', { locationId });
    return null;
  }

  logger.debug('Cache hit for location', { locationId });
  return cached.data;
};

/**
 * Store client configuration in cache
 * @param {string} locationId - GHL location ID
 * @param {Object} data - Client configuration data
 */
const setInCache = (locationId, data) => {
  configCache.set(locationId, {
    data,
    timestamp: Date.now(),
  });
  logger.debug('Config cached for location', { locationId, cacheSize: configCache.size });
};

/**
 * Get client configuration by location ID
 * Results are cached in memory for 5 minutes
 *
 * @param {string} locationId - GHL location ID
 * @returns {Promise<Object>} Client configuration object
 * @throws {DatabaseError} If location not found or database error occurs
 *
 * @example
 * const config = await getClientConfig('loc_abc123');
 * console.log(config.instance_name, config.ghl_access_token);
 */
export const getClientConfig = async (locationId) => {
  // Check cache first
  const cached = getFromCache(locationId);
  if (cached) {
    return cached;
  }

  try {
    logger.debug('Fetching client config from database', { locationId });

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('location_id', locationId)
      .single();

    if (error) {
      logger.error('Supabase query error', {
        error: error.message,
        locationId,
        code: error.code,
      });

      throw new DatabaseError(
        `Failed to fetch client config: ${error.message}`,
        500,
        { locationId, supabaseError: error }
      );
    }

    if (!data) {
      logger.warn('Location not found in database', { locationId });

      throw new DatabaseError(
        `Location not found: ${locationId}`,
        404,
        { locationId }
      );
    }

    // Cache the result
    setInCache(locationId, data);

    logger.info('Client config fetched successfully', {
      locationId,
      instanceName: data.instance_name,
    });

    return data;
  } catch (error) {
    // Re-throw DatabaseError as-is
    if (error instanceof DatabaseError) {
      throw error;
    }

    // Wrap unexpected errors
    logger.error('Unexpected error fetching client config', {
      error: error.message,
      stack: error.stack,
      locationId,
    });

    throw new DatabaseError(
      'Unexpected database error',
      500,
      { locationId, originalError: error.message }
    );
  }
};

/**
 * Clear all cached client configurations
 * Useful for testing or forcing cache refresh
 *
 * @returns {number} Number of cache entries cleared
 *
 * @example
 * const cleared = clearCache();
 * console.log(`Cleared ${cleared} cache entries`);
 */
export const clearCache = () => {
  const size = configCache.size;
  configCache.clear();

  logger.info('Client config cache cleared', { entriesCleared: size });

  return size;
};

/**
 * Get cache statistics
 * Useful for monitoring and debugging
 *
 * @returns {Object} Cache statistics
 */
export const getCacheStats = () => {
  const entries = Array.from(configCache.entries()).map(([locationId, entry]) => ({
    locationId,
    age: Date.now() - entry.timestamp,
    valid: isCacheValid(entry.timestamp),
  }));

  return {
    size: configCache.size,
    ttl: CACHE_TTL,
    entries,
  };
};

/**
 * Invalidate cache for a specific location
 * Useful when client config is updated
 *
 * @param {string} locationId - GHL location ID
 * @returns {boolean} True if entry was found and removed
 *
 * @example
 * invalidateCache('loc_abc123');
 */
export const invalidateCache = (locationId) => {
  const existed = configCache.has(locationId);
  configCache.delete(locationId);

  if (existed) {
    logger.debug('Cache invalidated for location', { locationId });
  }

  return existed;
};

// Log initialization
logger.info('Database module initialized', {
  supabaseUrl,
  cacheEnabled: true,
  cacheTTL: `${CACHE_TTL / 1000}s`,
});

export default supabase;
