/**
 * Test script for clients.model.js
 * Tests schema validation and transformers
 */

import {
  clientSchema,
  clientCreateSchema,
  clientUpdateSchema,
  validateClient,
  dbToApp,
  appToDb,
  dbToAppArray,
  sanitizeForLogging,
  isTokenExpired,
  getTokenExpirySeconds,
} from './src/modules/clients/clients.model.js';

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

console.log('\n🧪 Testing Client Model\n');

// ============================================
// Schema Validation Tests
// ============================================
console.log('📋 Schema Validation Tests');

test('Valid client - should pass validation', () => {
  const validClient = {
    location_id: 'loc-123',
    instance_name: 'my-instance',
    ghl_access_token: 'token-123',
    instance_sender: '34633839200@s.whatsapp.net',
  };

  const { error, value } = validateClient(validClient);
  assert(!error, `Should not have validation errors: ${error?.message}`);
  assert(value.location_id === 'loc-123', 'Should preserve location_id');
});

test('Missing required field - should fail validation', () => {
  const invalidClient = {
    instance_name: 'my-instance',
    // Missing location_id
  };

  const { error } = validateClient(invalidClient);
  assert(error, 'Should have validation error');
  assert(error.details[0].path[0] === 'location_id', 'Should identify missing location_id');
});

test('Invalid WhatsApp JID - should fail validation', () => {
  const invalidClient = {
    location_id: 'loc-123',
    instance_name: 'my-instance',
    instance_sender: 'invalid-jid-format', // Invalid format
  };

  const { error } = validateClient(invalidClient);
  assert(error, 'Should have validation error for invalid JID');
});

test('Valid WhatsApp JID - should pass validation', () => {
  const validClient = {
    location_id: 'loc-123',
    instance_name: 'my-instance',
    instance_sender: '34633839200@s.whatsapp.net',
  };

  const { error } = validateClient(validClient);
  assert(!error, 'Should not have validation error for valid JID');
});

test('Invalid OpenAI key - should fail validation', () => {
  const invalidClient = {
    location_id: 'loc-123',
    instance_name: 'my-instance',
    openai_apikey: 'invalid-key', // Should start with sk-
  };

  const { error } = validateClient(invalidClient);
  assert(error, 'Should have validation error for invalid OpenAI key');
});

test('Valid OpenAI key - should pass validation', () => {
  const validClient = {
    location_id: 'loc-123',
    instance_name: 'my-instance',
    openai_apikey: 'sk-test123456789',
  };

  const { error } = validateClient(validClient);
  assert(!error, 'Should not have validation error for valid OpenAI key');
});

test('Unknown fields - should be stripped', () => {
  const clientWithUnknown = {
    location_id: 'loc-123',
    instance_name: 'my-instance',
    unknown_field: 'should-be-removed',
  };

  const { error, value } = validateClient(clientWithUnknown);
  assert(!error, 'Should not have validation error');
  assert(!value.unknown_field, 'Unknown field should be stripped');
});

test('Null optional fields - should be allowed', () => {
  const clientWithNulls = {
    location_id: 'loc-123',
    instance_name: 'my-instance',
    ghl_access_token: null,
    instance_sender: null,
    openai_apikey: null,
  };

  const { error } = validateClient(clientWithNulls);
  assert(!error, 'Should not have validation error for null optional fields');
});

// ============================================
// Create Schema Tests
// ============================================
console.log('\n📋 Create Schema Tests');

test('clientCreateSchema - valid data should pass', () => {
  const createData = {
    location_id: 'loc-123',
    instance_name: 'my-instance',
  };

  const { error } = clientCreateSchema.validate(createData);
  assert(!error, 'Should not have validation error');
});

test('clientCreateSchema - missing required field should fail', () => {
  const createData = {
    instance_name: 'my-instance',
    // Missing location_id
  };

  const { error } = clientCreateSchema.validate(createData);
  assert(error, 'Should have validation error');
});

// ============================================
// Update Schema Tests
// ============================================
console.log('\n📋 Update Schema Tests');

test('clientUpdateSchema - valid update should pass', () => {
  const updateData = {
    id: 1,
    instance_name: 'updated-instance',
  };

  const { error } = clientUpdateSchema.validate(updateData);
  assert(!error, 'Should not have validation error');
});

test('clientUpdateSchema - missing ID should fail', () => {
  const updateData = {
    instance_name: 'updated-instance',
    // Missing id
  };

  const { error } = clientUpdateSchema.validate(updateData);
  assert(error, 'Should have validation error for missing ID');
});

test('clientUpdateSchema - only ID should fail (need at least one field)', () => {
  const updateData = {
    id: 1,
    // No fields to update
  };

  const { error } = clientUpdateSchema.validate(updateData);
  assert(error, 'Should have validation error - need at least one field to update');
});

// ============================================
// Transformer Tests: DB to App
// ============================================
console.log('\n📋 Transformer Tests: DB → App');

test('dbToApp - should convert snake_case to camelCase', () => {
  const dbRow = {
    id: 1,
    location_id: 'loc-123',
    instance_name: 'my-instance',
    ghl_access_token: 'token-123',
    created_at: '2024-01-01T00:00:00Z',
  };

  const appClient = dbToApp(dbRow);
  assert(appClient.locationId === 'loc-123', 'Should convert location_id to locationId');
  assert(appClient.instanceName === 'my-instance', 'Should convert instance_name to instanceName');
  assert(
    appClient.ghlAccessToken === 'token-123',
    'Should convert ghl_access_token to ghlAccessToken'
  );
  assert(appClient.createdAt === '2024-01-01T00:00:00Z', 'Should convert created_at to createdAt');
});

test('dbToApp - null input should return null', () => {
  const result = dbToApp(null);
  assert(result === null, 'Should return null for null input');
});

test('dbToApp - should handle all fields', () => {
  const dbRow = {
    id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    location_id: 'loc-123',
    ghl_access_token: 'token-123',
    ghl_refresh_token: 'refresh-123',
    ghl_token_expiry: '2024-12-31T23:59:59Z',
    conversation_provider_id: 'provider-123',
    instance_name: 'my-instance',
    instance_apikey: 'api-key-123',
    instance_sender: '34633839200@s.whatsapp.net',
    openai_apikey: 'sk-openai-123',
    webhook_secret: 'secret-123',
    is_active: true,
    metadata: { foo: 'bar' },
  };

  const appClient = dbToApp(dbRow);
  assert(appClient.id === 1, 'Should have id');
  assert(appClient.locationId === 'loc-123', 'Should have locationId');
  assert(appClient.ghlAccessToken === 'token-123', 'Should have ghlAccessToken');
  assert(appClient.conversationProviderId === 'provider-123', 'Should have conversationProviderId');
  assert(appClient.instanceSender === '34633839200@s.whatsapp.net', 'Should have instanceSender');
  assert(appClient.openaiApikey === 'sk-openai-123', 'Should have openaiApikey');
  assert(appClient.isActive === true, 'Should have isActive');
  assert(appClient.metadata.foo === 'bar', 'Should have metadata');
});

// ============================================
// Transformer Tests: App to DB
// ============================================
console.log('\n📋 Transformer Tests: App → DB');

test('appToDb - should convert camelCase to snake_case', () => {
  const appData = {
    id: 1,
    locationId: 'loc-123',
    instanceName: 'my-instance',
    ghlAccessToken: 'token-123',
  };

  const dbData = appToDb(appData);
  assert(dbData.location_id === 'loc-123', 'Should convert locationId to location_id');
  assert(dbData.instance_name === 'my-instance', 'Should convert instanceName to instance_name');
  assert(
    dbData.ghl_access_token === 'token-123',
    'Should convert ghlAccessToken to ghl_access_token'
  );
});

test('appToDb - null input should return null', () => {
  const result = appToDb(null);
  assert(result === null, 'Should return null for null input');
});

test('appToDb - should only include defined fields', () => {
  const appData = {
    locationId: 'loc-123',
    instanceName: 'my-instance',
    // ghlAccessToken is undefined (not null)
  };

  const dbData = appToDb(appData);
  assert(dbData.location_id === 'loc-123', 'Should have location_id');
  assert(dbData.instance_name === 'my-instance', 'Should have instance_name');
  assert(!('ghl_access_token' in dbData), 'Should not include undefined fields');
});

test('appToDb - should allow null values', () => {
  const appData = {
    locationId: 'loc-123',
    instanceName: 'my-instance',
    ghlAccessToken: null, // Explicitly null
  };

  const dbData = appToDb(appData);
  assert('ghl_access_token' in dbData, 'Should include null fields');
  assert(dbData.ghl_access_token === null, 'Should preserve null value');
});

// ============================================
// Transformer Tests: Array
// ============================================
console.log('\n📋 Transformer Tests: Array');

test('dbToAppArray - should transform array of rows', () => {
  const dbRows = [
    { id: 1, location_id: 'loc-1', instance_name: 'instance-1' },
    { id: 2, location_id: 'loc-2', instance_name: 'instance-2' },
  ];

  const appArray = dbToAppArray(dbRows);
  assert(appArray.length === 2, 'Should have 2 items');
  assert(appArray[0].locationId === 'loc-1', 'First item should be transformed');
  assert(appArray[1].locationId === 'loc-2', 'Second item should be transformed');
});

test('dbToAppArray - non-array input should return empty array', () => {
  const result = dbToAppArray(null);
  assert(Array.isArray(result), 'Should return array');
  assert(result.length === 0, 'Should return empty array');
});

// ============================================
// Sanitize Tests
// ============================================
console.log('\n📋 Sanitize Tests');

test('sanitizeForLogging - should redact sensitive fields', () => {
  const client = {
    locationId: 'loc-123',
    ghlAccessToken: 'secret-token',
    ghlRefreshToken: 'secret-refresh',
    instanceApikey: 'secret-apikey',
    openaiApikey: 'sk-secret',
    webhookSecret: 'secret-webhook',
  };

  const sanitized = sanitizeForLogging(client);
  assert(sanitized.locationId === 'loc-123', 'Should preserve non-sensitive fields');
  assert(sanitized.ghlAccessToken === '[REDACTED]', 'Should redact ghlAccessToken');
  assert(sanitized.ghlRefreshToken === '[REDACTED]', 'Should redact ghlRefreshToken');
  assert(sanitized.instanceApikey === '[REDACTED]', 'Should redact instanceApikey');
  assert(sanitized.openaiApikey === '[REDACTED]', 'Should redact openaiApikey');
  assert(sanitized.webhookSecret === '[REDACTED]', 'Should redact webhookSecret');
});

test('sanitizeForLogging - null input should return null', () => {
  const result = sanitizeForLogging(null);
  assert(result === null, 'Should return null for null input');
});

// ============================================
// Token Expiry Tests
// ============================================
console.log('\n📋 Token Expiry Tests');

test('isTokenExpired - expired token should return true', () => {
  const client = {
    ghlTokenExpiry: '2020-01-01T00:00:00Z', // Past date
  };

  const expired = isTokenExpired(client);
  assert(expired === true, 'Should return true for expired token');
});

test('isTokenExpired - valid token should return false', () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1); // 1 year in future

  const client = {
    ghlTokenExpiry: futureDate.toISOString(),
  };

  const expired = isTokenExpired(client);
  assert(expired === false, 'Should return false for valid token');
});

test('isTokenExpired - no expiry should return true', () => {
  const client = {
    // No ghlTokenExpiry
  };

  const expired = isTokenExpired(client);
  assert(expired === true, 'Should return true when no expiry is set');
});

test('getTokenExpirySeconds - should return seconds until expiry', () => {
  const futureDate = new Date();
  futureDate.setHours(futureDate.getHours() + 1); // 1 hour in future

  const client = {
    ghlTokenExpiry: futureDate.toISOString(),
  };

  const seconds = getTokenExpirySeconds(client);
  assert(seconds > 3500 && seconds <= 3600, `Should be ~3600 seconds, got ${seconds}`);
});

test('getTokenExpirySeconds - no expiry should return null', () => {
  const client = {};

  const seconds = getTokenExpirySeconds(client);
  assert(seconds === null, 'Should return null when no expiry is set');
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
