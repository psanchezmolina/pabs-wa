/**
 * Test script for custom error classes
 * Tests AppError, GHLError, EvolutionError, and ValidationError
 */

import {
  AppError,
  DatabaseError,
  GHLError,
  GHL_ERROR_CODES,
  EvolutionError,
  EVOLUTION_ERROR_CODES,
  ValidationError,
  VALIDATION_ERROR_CODES,
} from './src/shared/errors/index.js';

// Test counters
let testsPassed = 0;
let testsFailed = 0;

// Test helper
function test(description, fn) {
  try {
    fn();
    console.log(`✅ ${description}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${description}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// Assert helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('\n🧪 Testing Custom Error Classes\n');

// ============================================
// AppError Tests
// ============================================
console.log('📋 AppError Tests');

test('AppError - basic constructor', () => {
  const error = new AppError('Test error', 500, 'TEST_CODE', { foo: 'bar' });
  assert(error.message === 'Test error', 'Message should match');
  assert(error.statusCode === 500, 'Status code should be 500');
  assert(error.code === 'TEST_CODE', 'Code should match');
  assert(error.details.foo === 'bar', 'Details should match');
  assert(error.isOperational === true, 'Should be operational');
  assert(error instanceof Error, 'Should be instance of Error');
});

test('AppError - default values', () => {
  const error = new AppError('Test error');
  assert(error.statusCode === 500, 'Default status code should be 500');
  assert(error.code === 'APP_ERROR', 'Default code should be APP_ERROR');
  assert(Object.keys(error.details).length === 0, 'Default details should be empty');
});

test('AppError - toJSON method', () => {
  const error = new AppError('Test error', 404, 'NOT_FOUND');
  const json = error.toJSON();
  assert(json.name === 'AppError', 'JSON should have name');
  assert(json.message === 'Test error', 'JSON should have message');
  assert(json.code === 'NOT_FOUND', 'JSON should have code');
  assert(json.statusCode === 404, 'JSON should have statusCode');
  assert(json.stack, 'JSON should have stack trace');
});

// ============================================
// DatabaseError Tests
// ============================================
console.log('\n📋 DatabaseError Tests');

test('DatabaseError - basic constructor', () => {
  const error = new DatabaseError('DB connection failed');
  assert(error.message === 'DB connection failed', 'Message should match');
  assert(error.statusCode === 500, 'Status code should be 500');
  assert(error.code === 'DATABASE_ERROR', 'Code should be DATABASE_ERROR');
  assert(error instanceof AppError, 'Should be instance of AppError');
});

// ============================================
// GHLError Tests
// ============================================
console.log('\n📋 GHLError Tests');

test('GHLError - basic constructor', () => {
  const error = new GHLError('GHL API failed');
  assert(error.message === 'GHL API failed', 'Message should match');
  assert(error.statusCode === 500, 'Default status code should be 500');
  assert(error.code === GHL_ERROR_CODES.API_ERROR, 'Default code should be GHL_API_ERROR');
  assert(error instanceof AppError, 'Should be instance of AppError');
});

test('GHLError - authError factory', () => {
  const error = GHLError.authError('Invalid credentials');
  assert(error.message === 'Invalid credentials', 'Message should match');
  assert(error.statusCode === 401, 'Status code should be 401');
  assert(error.code === GHL_ERROR_CODES.AUTH_ERROR, 'Code should be GHL_AUTH_ERROR');
});

test('GHLError - tokenExpired factory', () => {
  const error = GHLError.tokenExpired();
  assert(error.message.includes('token expired'), 'Message should mention token expired');
  assert(error.statusCode === 401, 'Status code should be 401');
  assert(error.code === GHL_ERROR_CODES.TOKEN_EXPIRED, 'Code should be GHL_TOKEN_EXPIRED');
});

test('GHLError - tokenRefreshFailed factory', () => {
  const error = GHLError.tokenRefreshFailed();
  assert(error.message.includes('refresh'), 'Message should mention refresh');
  assert(error.statusCode === 500, 'Status code should be 500');
  assert(error.code === GHL_ERROR_CODES.TOKEN_REFRESH_FAILED, 'Code should be correct');
});

test('GHLError - rateLimit factory', () => {
  const error = GHLError.rateLimit('Too many requests', { retryAfter: 60 });
  assert(error.statusCode === 429, 'Status code should be 429');
  assert(error.code === GHL_ERROR_CODES.RATE_LIMIT, 'Code should be GHL_RATE_LIMIT');
  assert(error.details.retryAfter === 60, 'Should have retryAfter in details');
});

test('GHLError - contactNotFound factory', () => {
  const error = GHLError.contactNotFound('+34633839200');
  assert(error.message.includes('+34633839200'), 'Message should include phone');
  assert(error.statusCode === 404, 'Status code should be 404');
  assert(error.code === GHL_ERROR_CODES.CONTACT_NOT_FOUND, 'Code should be correct');
  assert(error.details.contactId === '+34633839200', 'Should have contactId in details');
});

test('GHLError - conversationNotFound factory', () => {
  const error = GHLError.conversationNotFound('conv-123');
  assert(error.message.includes('conv-123'), 'Message should include conversation ID');
  assert(error.statusCode === 404, 'Status code should be 404');
  assert(error.details.conversationId === 'conv-123', 'Should have conversationId in details');
});

test('GHLError - locationNotFound factory', () => {
  const error = GHLError.locationNotFound('loc-456');
  assert(error.message.includes('loc-456'), 'Message should include location ID');
  assert(error.statusCode === 404, 'Status code should be 404');
  assert(error.details.locationId === 'loc-456', 'Should have locationId in details');
});

test('GHLError - timeout factory', () => {
  const error = GHLError.timeout();
  assert(error.message.includes('timeout'), 'Message should mention timeout');
  assert(error.statusCode === 504, 'Status code should be 504');
  assert(error.code === GHL_ERROR_CODES.TIMEOUT, 'Code should be GHL_TIMEOUT');
});

test('GHLError - messageSendFailed factory', () => {
  const error = GHLError.messageSendFailed();
  assert(error.statusCode === 500, 'Status code should be 500');
  assert(error.code === GHL_ERROR_CODES.MESSAGE_SEND_FAILED, 'Code should be correct');
});

// ============================================
// EvolutionError Tests
// ============================================
console.log('\n📋 EvolutionError Tests');

test('EvolutionError - basic constructor', () => {
  const error = new EvolutionError('Evolution API failed');
  assert(error.message === 'Evolution API failed', 'Message should match');
  assert(error.statusCode === 500, 'Default status code should be 500');
  assert(error.code === EVOLUTION_ERROR_CODES.API_ERROR, 'Default code should be correct');
  assert(error instanceof AppError, 'Should be instance of AppError');
});

test('EvolutionError - authError factory', () => {
  const error = EvolutionError.authError('Invalid API key');
  assert(error.message === 'Invalid API key', 'Message should match');
  assert(error.statusCode === 401, 'Status code should be 401');
  assert(error.code === EVOLUTION_ERROR_CODES.AUTH_ERROR, 'Code should be correct');
});

test('EvolutionError - instanceNotFound factory', () => {
  const error = EvolutionError.instanceNotFound('my-instance');
  assert(error.message.includes('my-instance'), 'Message should include instance name');
  assert(error.statusCode === 404, 'Status code should be 404');
  assert(error.code === EVOLUTION_ERROR_CODES.INSTANCE_NOT_FOUND, 'Code should be correct');
  assert(error.details.instanceName === 'my-instance', 'Should have instanceName in details');
});

test('EvolutionError - instanceNotConnected factory', () => {
  const error = EvolutionError.instanceNotConnected('my-instance');
  assert(error.message.includes('not connected'), 'Message should mention not connected');
  assert(error.statusCode === 503, 'Status code should be 503');
  assert(error.code === EVOLUTION_ERROR_CODES.INSTANCE_NOT_CONNECTED, 'Code should be correct');
});

test('EvolutionError - instanceDisconnected factory', () => {
  const error = EvolutionError.instanceDisconnected('my-instance');
  assert(error.message.includes('disconnected'), 'Message should mention disconnected');
  assert(error.statusCode === 503, 'Status code should be 503');
  assert(error.code === EVOLUTION_ERROR_CODES.INSTANCE_DISCONNECTED, 'Code should be correct');
});

test('EvolutionError - messageSendFailed factory', () => {
  const error = EvolutionError.messageSendFailed();
  assert(error.statusCode === 500, 'Status code should be 500');
  assert(error.code === EVOLUTION_ERROR_CODES.MESSAGE_SEND_FAILED, 'Code should be correct');
});

test('EvolutionError - mediaDownloadFailed factory', () => {
  const error = EvolutionError.mediaDownloadFailed();
  assert(error.message.includes('download'), 'Message should mention download');
  assert(error.statusCode === 500, 'Status code should be 500');
  assert(error.code === EVOLUTION_ERROR_CODES.MEDIA_DOWNLOAD_FAILED, 'Code should be correct');
});

test('EvolutionError - mediaUploadFailed factory', () => {
  const error = EvolutionError.mediaUploadFailed();
  assert(error.message.includes('upload'), 'Message should mention upload');
  assert(error.statusCode === 500, 'Status code should be 500');
  assert(error.code === EVOLUTION_ERROR_CODES.MEDIA_UPLOAD_FAILED, 'Code should be correct');
});

test('EvolutionError - invalidPhone factory', () => {
  const error = EvolutionError.invalidPhone('123');
  assert(error.message.includes('123'), 'Message should include phone');
  assert(error.statusCode === 400, 'Status code should be 400');
  assert(error.code === EVOLUTION_ERROR_CODES.INVALID_PHONE, 'Code should be correct');
  assert(error.details.phone === '123', 'Should have phone in details');
});

test('EvolutionError - phoneNotWhatsApp factory', () => {
  const error = EvolutionError.phoneNotWhatsApp('+34633839200');
  assert(error.message.includes('not registered'), 'Message should mention not registered');
  assert(error.statusCode === 400, 'Status code should be 400');
  assert(error.code === EVOLUTION_ERROR_CODES.PHONE_NOT_WHATSAPP, 'Code should be correct');
});

test('EvolutionError - rateLimit factory', () => {
  const error = EvolutionError.rateLimit();
  assert(error.statusCode === 429, 'Status code should be 429');
  assert(error.code === EVOLUTION_ERROR_CODES.RATE_LIMIT, 'Code should be correct');
});

test('EvolutionError - timeout factory', () => {
  const error = EvolutionError.timeout();
  assert(error.statusCode === 504, 'Status code should be 504');
  assert(error.code === EVOLUTION_ERROR_CODES.TIMEOUT, 'Code should be correct');
});

test('EvolutionError - qrCodeExpired factory', () => {
  const error = EvolutionError.qrCodeExpired('my-instance');
  assert(error.message.includes('QR code expired'), 'Message should mention QR code');
  assert(error.statusCode === 400, 'Status code should be 400');
  assert(error.code === EVOLUTION_ERROR_CODES.QR_CODE_EXPIRED, 'Code should be correct');
});

test('EvolutionError - serviceUnavailable factory', () => {
  const error = EvolutionError.serviceUnavailable();
  assert(error.statusCode === 503, 'Status code should be 503');
  assert(error.code === EVOLUTION_ERROR_CODES.SERVICE_UNAVAILABLE, 'Code should be correct');
});

// ============================================
// ValidationError Tests
// ============================================
console.log('\n📋 ValidationError Tests');

test('ValidationError - basic constructor', () => {
  const error = new ValidationError('Validation failed');
  assert(error.message === 'Validation failed', 'Message should match');
  assert(error.statusCode === 400, 'Status code should always be 400');
  assert(error.code === VALIDATION_ERROR_CODES.VALIDATION_FAILED, 'Default code should be correct');
  assert(error instanceof AppError, 'Should be instance of AppError');
});

test('ValidationError - requiredField factory', () => {
  const error = ValidationError.requiredField('email');
  assert(error.message.includes('email'), 'Message should include field name');
  assert(error.statusCode === 400, 'Status code should be 400');
  assert(error.code === VALIDATION_ERROR_CODES.REQUIRED_FIELD_MISSING, 'Code should be correct');
  assert(error.details.field === 'email', 'Should have field in details');
});

test('ValidationError - requiredFields factory', () => {
  const error = ValidationError.requiredFields(['name', 'email', 'phone']);
  assert(error.message.includes('name'), 'Message should include field names');
  assert(error.message.includes('email'), 'Message should include field names');
  assert(error.details.fields.length === 3, 'Should have fields array in details');
});

test('ValidationError - invalidType factory', () => {
  const error = ValidationError.invalidType('age', 'number', 'string');
  assert(error.message.includes('age'), 'Message should include field');
  assert(error.message.includes('number'), 'Message should include expected type');
  assert(error.message.includes('string'), 'Message should include actual type');
  assert(error.code === VALIDATION_ERROR_CODES.INVALID_TYPE, 'Code should be correct');
});

test('ValidationError - invalidFormat factory', () => {
  const error = ValidationError.invalidFormat('date', 'ISO-8601');
  assert(error.message.includes('date'), 'Message should include field');
  assert(error.message.includes('ISO-8601'), 'Message should include format');
  assert(error.code === VALIDATION_ERROR_CODES.INVALID_FORMAT, 'Code should be correct');
});

test('ValidationError - invalidEmail factory', () => {
  const error = ValidationError.invalidEmail('invalid-email');
  assert(error.message.includes('invalid-email'), 'Message should include email');
  assert(error.code === VALIDATION_ERROR_CODES.INVALID_EMAIL, 'Code should be correct');
  assert(error.details.email === 'invalid-email', 'Should have email in details');
});

test('ValidationError - invalidPhone factory', () => {
  const error = ValidationError.invalidPhone('123');
  assert(error.message.includes('123'), 'Message should include phone');
  assert(error.code === VALIDATION_ERROR_CODES.INVALID_PHONE, 'Code should be correct');
  assert(error.details.phone === '123', 'Should have phone in details');
});

test('ValidationError - invalidWhatsAppJID factory', () => {
  const error = ValidationError.invalidWhatsAppJID('invalid-jid');
  assert(error.message.includes('invalid-jid'), 'Message should include JID');
  assert(error.code === VALIDATION_ERROR_CODES.INVALID_WHATSAPP_JID, 'Code should be correct');
  assert(error.details.jid === 'invalid-jid', 'Should have jid in details');
});

test('ValidationError - invalidUrl factory', () => {
  const error = ValidationError.invalidUrl('not-a-url');
  assert(error.message.includes('not-a-url'), 'Message should include URL');
  assert(error.code === VALIDATION_ERROR_CODES.INVALID_URL, 'Code should be correct');
});

test('ValidationError - stringTooLong factory', () => {
  const error = ValidationError.stringTooLong('description', 100, 150);
  assert(error.message.includes('description'), 'Message should include field');
  assert(error.message.includes('100'), 'Message should include max length');
  assert(error.message.includes('150'), 'Message should include actual length');
  assert(error.code === VALIDATION_ERROR_CODES.STRING_TOO_LONG, 'Code should be correct');
  assert(error.details.maxLength === 100, 'Should have maxLength in details');
  assert(error.details.actualLength === 150, 'Should have actualLength in details');
});

test('ValidationError - stringTooShort factory', () => {
  const error = ValidationError.stringTooShort('password', 8, 5);
  assert(error.message.includes('password'), 'Message should include field');
  assert(error.message.includes('8'), 'Message should include min length');
  assert(error.code === VALIDATION_ERROR_CODES.STRING_TOO_SHORT, 'Code should be correct');
});

test('ValidationError - outOfRange factory', () => {
  const error = ValidationError.outOfRange('age', 0, 120, 150);
  assert(error.message.includes('age'), 'Message should include field');
  assert(error.message.includes('0'), 'Message should include min');
  assert(error.message.includes('120'), 'Message should include max');
  assert(error.message.includes('150'), 'Message should include actual value');
  assert(error.code === VALIDATION_ERROR_CODES.OUT_OF_RANGE, 'Code should be correct');
});

test('ValidationError - invalidEnumValue factory', () => {
  const error = ValidationError.invalidEnumValue('status', ['active', 'inactive'], 'pending');
  assert(error.message.includes('status'), 'Message should include field');
  assert(error.message.includes('active'), 'Message should include allowed values');
  assert(error.message.includes('pending'), 'Message should include actual value');
  assert(error.code === VALIDATION_ERROR_CODES.INVALID_ENUM_VALUE, 'Code should be correct');
  assert(error.details.allowedValues.includes('active'), 'Should have allowedValues in details');
});

test('ValidationError - duplicateValue factory', () => {
  const error = ValidationError.duplicateValue('email', 'test@example.com');
  assert(error.message.includes('email'), 'Message should include field');
  assert(error.message.includes('test@example.com'), 'Message should include value');
  assert(error.code === VALIDATION_ERROR_CODES.DUPLICATE_VALUE, 'Code should be correct');
});

test('ValidationError - alreadyExists factory', () => {
  const error = ValidationError.alreadyExists('User', 'john@example.com');
  assert(error.message.includes('User'), 'Message should include resource');
  assert(error.message.includes('john@example.com'), 'Message should include identifier');
  assert(error.code === VALIDATION_ERROR_CODES.ALREADY_EXISTS, 'Code should be correct');
});

test('ValidationError - invalidDate factory', () => {
  const error = ValidationError.invalidDate('birthdate', 'not-a-date');
  assert(error.message.includes('birthdate'), 'Message should include field');
  assert(error.code === VALIDATION_ERROR_CODES.INVALID_DATE, 'Code should be correct');
});

test('ValidationError - invalidJson factory', () => {
  const error = ValidationError.invalidJson();
  assert(error.code === VALIDATION_ERROR_CODES.INVALID_JSON, 'Code should be correct');
});

// ============================================
// Error Code Constants Tests
// ============================================
console.log('\n📋 Error Code Constants Tests');

test('GHL_ERROR_CODES - has all expected codes', () => {
  assert(GHL_ERROR_CODES.AUTH_ERROR === 'GHL_AUTH_ERROR', 'Should have AUTH_ERROR');
  assert(GHL_ERROR_CODES.TOKEN_EXPIRED === 'GHL_TOKEN_EXPIRED', 'Should have TOKEN_EXPIRED');
  assert(GHL_ERROR_CODES.API_ERROR === 'GHL_API_ERROR', 'Should have API_ERROR');
  assert(GHL_ERROR_CODES.CONTACT_NOT_FOUND === 'GHL_CONTACT_NOT_FOUND', 'Should have CONTACT_NOT_FOUND');
});

test('EVOLUTION_ERROR_CODES - has all expected codes', () => {
  assert(EVOLUTION_ERROR_CODES.AUTH_ERROR === 'EVOLUTION_AUTH_ERROR', 'Should have AUTH_ERROR');
  assert(EVOLUTION_ERROR_CODES.INSTANCE_NOT_FOUND === 'EVOLUTION_INSTANCE_NOT_FOUND', 'Should have INSTANCE_NOT_FOUND');
  assert(EVOLUTION_ERROR_CODES.MESSAGE_SEND_FAILED === 'EVOLUTION_MESSAGE_SEND_FAILED', 'Should have MESSAGE_SEND_FAILED');
});

test('VALIDATION_ERROR_CODES - has all expected codes', () => {
  assert(VALIDATION_ERROR_CODES.VALIDATION_FAILED === 'VALIDATION_FAILED', 'Should have VALIDATION_FAILED');
  assert(VALIDATION_ERROR_CODES.REQUIRED_FIELD_MISSING === 'REQUIRED_FIELD_MISSING', 'Should have REQUIRED_FIELD_MISSING');
  assert(VALIDATION_ERROR_CODES.INVALID_EMAIL === 'INVALID_EMAIL', 'Should have INVALID_EMAIL');
});

// ============================================
// Summary
// ============================================
console.log('\n' + '='.repeat(50));
console.log('📊 Test Summary');
console.log('='.repeat(50));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📝 Total:  ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
  console.log('\n🎉 All tests passed!\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${testsFailed} test(s) failed\n`);
  process.exit(1);
}
