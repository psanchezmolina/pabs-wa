/**
 * Central export for all application errors
 */

// Base error classes
export { default as AppError } from './AppError.js';
export { default as DatabaseError } from './DatabaseError.js';
export { default as GHLError, GHL_ERROR_CODES } from './GHLError.js';
export { default as EvolutionError, EVOLUTION_ERROR_CODES } from './EvolutionError.js';
export { default as ValidationError, VALIDATION_ERROR_CODES } from './ValidationError.js';
