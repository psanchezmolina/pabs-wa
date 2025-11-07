/**
 * Phone number formatter utilities for WhatsApp
 * Handles conversion between standard phone format and WhatsApp JID format
 */

/**
 * Regular expressions for validation
 */
const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/; // E.164 format: 10-15 digits, no leading zero
const WHATSAPP_JID_REGEX = /^[1-9]\d{9,14}@s\.whatsapp\.net$/; // WhatsApp JID format
const DIGITS_ONLY_REGEX = /^\d+$/;

/**
 * Convert phone number to WhatsApp JID format
 *
 * @param {string} phone - Phone number in various formats (+34633839200, 34633839200, etc.)
 * @returns {string} WhatsApp JID format (34633839200@s.whatsapp.net)
 * @throws {Error} If phone number is invalid
 *
 * @example
 * toWhatsAppFormat('+34633839200')        // '34633839200@s.whatsapp.net'
 * toWhatsAppFormat('34633839200')         // '34633839200@s.whatsapp.net'
 * toWhatsAppFormat('+1 (555) 123-4567')   // '15551234567@s.whatsapp.net'
 */
export const toWhatsAppFormat = (phone) => {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Phone number must be a non-empty string');
  }

  // Normalize phone number (remove non-digits except leading +)
  const normalized = normalizePhone(phone);

  // Validate normalized phone
  if (!isValidPhone(normalized)) {
    throw new Error(`Invalid phone number format: ${phone}. Expected 10-15 digits with optional leading +`);
  }

  // Remove leading + if present
  const digits = normalized.replace(/^\+/, '');

  // Return WhatsApp JID format
  return `${digits}@s.whatsapp.net`;
};

/**
 * Convert WhatsApp JID to standard phone format
 *
 * @param {string} jid - WhatsApp JID (34633839200@s.whatsapp.net)
 * @returns {string} Phone number with + prefix (+34633839200)
 * @throws {Error} If JID is invalid
 *
 * @example
 * fromWhatsAppFormat('34633839200@s.whatsapp.net')  // '+34633839200'
 * fromWhatsAppFormat('15551234567@s.whatsapp.net')  // '+15551234567'
 */
export const fromWhatsAppFormat = (jid) => {
  if (!jid || typeof jid !== 'string') {
    throw new Error('JID must be a non-empty string');
  }

  // Validate JID format
  if (!isValidWhatsAppJID(jid)) {
    throw new Error(`Invalid WhatsApp JID format: ${jid}. Expected format: {digits}@s.whatsapp.net`);
  }

  // Extract digits (remove @s.whatsapp.net suffix)
  const digits = jid.replace(/@s\.whatsapp\.net$/, '');

  // Return with + prefix
  return `+${digits}`;
};

/**
 * Normalize phone number by removing non-digit characters (except leading +)
 *
 * @param {string} phone - Phone number in any format
 * @returns {string} Normalized phone number
 *
 * @example
 * normalizePhone('+1 (555) 123-4567')  // '+15551234567'
 * normalizePhone('34 633 83 92 00')    // '34633839200'
 * normalizePhone('+34-633-839-200')    // '+34633839200'
 */
export const normalizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Check if starts with +
  const hasPlus = phone.startsWith('+');

  // Remove all non-digits
  const digitsOnly = phone.replace(/\D/g, '');

  // Add back + if it was present
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
};

/**
 * Validate if a phone number is in valid format
 *
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone number
 *
 * @example
 * isValidPhone('+34633839200')    // true
 * isValidPhone('34633839200')     // true
 * isValidPhone('+1234')           // false (too short)
 * isValidPhone('0123456789')      // false (starts with 0)
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  const normalized = normalizePhone(phone);
  return PHONE_REGEX.test(normalized);
};

/**
 * Validate if a string is in valid WhatsApp JID format
 *
 * @param {string} jid - JID to validate
 * @returns {boolean} True if valid WhatsApp JID
 *
 * @example
 * isValidWhatsAppJID('34633839200@s.whatsapp.net')  // true
 * isValidWhatsAppJID('15551234567@s.whatsapp.net')  // true
 * isValidWhatsAppJID('34633839200')                 // false
 * isValidWhatsAppJID('invalid@whatsapp.net')        // false
 */
export const isValidWhatsAppJID = (jid) => {
  if (!jid || typeof jid !== 'string') {
    return false;
  }

  return WHATSAPP_JID_REGEX.test(jid);
};

/**
 * Extract phone number from WhatsApp JID (without validation)
 * Returns null if JID is not in WhatsApp format
 *
 * @param {string} jid - WhatsApp JID
 * @returns {string|null} Phone number or null
 *
 * @example
 * extractPhoneFromJID('34633839200@s.whatsapp.net')  // '34633839200'
 * extractPhoneFromJID('invalid-jid')                 // null
 */
export const extractPhoneFromJID = (jid) => {
  if (!jid || typeof jid !== 'string') {
    return null;
  }

  const match = jid.match(/^(\d+)@s\.whatsapp\.net$/);
  return match ? match[1] : null;
};

/**
 * Check if a JID or phone number is already in WhatsApp format
 *
 * @param {string} value - Value to check
 * @returns {boolean} True if already in WhatsApp format
 *
 * @example
 * isWhatsAppFormat('34633839200@s.whatsapp.net')  // true
 * isWhatsAppFormat('+34633839200')                // false
 */
export const isWhatsAppFormat = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }

  return value.includes('@s.whatsapp.net');
};

/**
 * Ensure a phone number or JID is in WhatsApp format
 * If already in WhatsApp format, returns as-is
 * If in phone format, converts to WhatsApp format
 *
 * @param {string} phoneOrJID - Phone number or WhatsApp JID
 * @returns {string} WhatsApp JID format
 * @throws {Error} If invalid format
 *
 * @example
 * ensureWhatsAppFormat('+34633839200')                  // '34633839200@s.whatsapp.net'
 * ensureWhatsAppFormat('34633839200@s.whatsapp.net')    // '34633839200@s.whatsapp.net'
 */
export const ensureWhatsAppFormat = (phoneOrJID) => {
  if (!phoneOrJID || typeof phoneOrJID !== 'string') {
    throw new Error('Phone or JID must be a non-empty string');
  }

  // Already in WhatsApp format
  if (isWhatsAppFormat(phoneOrJID)) {
    if (!isValidWhatsAppJID(phoneOrJID)) {
      throw new Error(`Invalid WhatsApp JID: ${phoneOrJID}`);
    }
    return phoneOrJID;
  }

  // Convert to WhatsApp format
  return toWhatsAppFormat(phoneOrJID);
};

/**
 * Ensure a phone number or JID is in standard phone format
 * If already in phone format, normalizes it with + prefix
 * If in WhatsApp format, converts to phone format
 *
 * @param {string} phoneOrJID - Phone number or WhatsApp JID
 * @returns {string} Phone number with + prefix
 * @throws {Error} If invalid format
 *
 * @example
 * ensurePhoneFormat('34633839200@s.whatsapp.net')  // '+34633839200'
 * ensurePhoneFormat('+34633839200')                // '+34633839200'
 * ensurePhoneFormat('34633839200')                 // '+34633839200'
 */
export const ensurePhoneFormat = (phoneOrJID) => {
  if (!phoneOrJID || typeof phoneOrJID !== 'string') {
    throw new Error('Phone or JID must be a non-empty string');
  }

  // In WhatsApp format
  if (isWhatsAppFormat(phoneOrJID)) {
    return fromWhatsAppFormat(phoneOrJID);
  }

  // In phone format - normalize and validate
  const normalized = normalizePhone(phoneOrJID);
  if (!isValidPhone(normalized)) {
    throw new Error(`Invalid phone number: ${phoneOrJID}`);
  }

  // Ensure it has + prefix
  return normalized.startsWith('+') ? normalized : `+${normalized}`;
};

/**
 * Format phone number for display (with spaces)
 *
 * @param {string} phoneOrJID - Phone number or WhatsApp JID
 * @param {Object} options - Formatting options
 * @param {string} options.style - 'international' (default) or 'national'
 * @returns {string} Formatted phone number
 *
 * @example
 * formatPhoneDisplay('+34633839200')  // '+34 633 83 92 00'
 * formatPhoneDisplay('34633839200@s.whatsapp.net')  // '+34 633 83 92 00'
 */
export const formatPhoneDisplay = (phoneOrJID, options = {}) => {
  const { style = 'international' } = options;

  // Convert to standard phone format first
  const phone = isWhatsAppFormat(phoneOrJID)
    ? fromWhatsAppFormat(phoneOrJID)
    : ensurePhoneFormat(phoneOrJID);

  // Simple formatting: add space every 3 digits
  const digits = phone.replace(/^\+/, '');

  if (style === 'international') {
    // Format: +XX XXX XX XX XX
    const formatted = digits.match(/.{1,3}/g)?.join(' ') || digits;
    return `+${formatted}`;
  }

  // National style (without +)
  return digits.match(/.{1,3}/g)?.join(' ') || digits;
};

export default {
  toWhatsAppFormat,
  fromWhatsAppFormat,
  normalizePhone,
  isValidPhone,
  isValidWhatsAppJID,
  extractPhoneFromJID,
  isWhatsAppFormat,
  ensureWhatsAppFormat,
  ensurePhoneFormat,
  formatPhoneDisplay,
};
