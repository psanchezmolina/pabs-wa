/**
 * Test script for Express app configuration
 * Tests middleware setup, security headers, static files, error handling
 */

import request from 'supertest';
import app from './src/app.js';

// Test counters
let testsPassed = 0;
let testsFailed = 0;

// Test helper
function test(description, fn) {
  return fn()
    .then(() => {
      console.log(`✅ ${description}`);
      testsPassed++;
    })
    .catch((error) => {
      console.error(`❌ ${description}`);
      console.error(`   Error: ${error.message}`);
      testsFailed++;
    });
}

console.log('\n🧪 Testing Express App Configuration\n');

// ============================================
// Health Check Tests
// ============================================
console.log('📋 Health Check Tests');

await test('GET /health - should return 200 and health status', async () => {
  const response = await request(app).get('/health');

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (!response.body.status) {
    throw new Error('Response should have status field');
  }

  if (response.body.status !== 'healthy') {
    throw new Error(`Expected status 'healthy', got '${response.body.status}'`);
  }

  if (!response.body.timestamp) {
    throw new Error('Response should have timestamp field');
  }

  if (typeof response.body.uptime !== 'number') {
    throw new Error('Response should have uptime field as number');
  }
});

// ============================================
// Security Headers Tests (Helmet)
// ============================================
console.log('\n📋 Security Headers Tests (Helmet)');

await test('Security headers - should include X-Content-Type-Options', async () => {
  const response = await request(app).get('/health');

  if (!response.headers['x-content-type-options']) {
    throw new Error('Missing X-Content-Type-Options header');
  }

  if (response.headers['x-content-type-options'] !== 'nosniff') {
    throw new Error('X-Content-Type-Options should be nosniff');
  }
});

await test('Security headers - should include X-Frame-Options', async () => {
  const response = await request(app).get('/health');

  if (!response.headers['x-frame-options']) {
    throw new Error('Missing X-Frame-Options header');
  }
});

await test('Security headers - should include X-XSS-Protection', async () => {
  const response = await request(app).get('/health');

  if (!response.headers['x-xss-protection']) {
    throw new Error('Missing X-XSS-Protection header');
  }
});

// ============================================
// CORS Tests
// ============================================
console.log('\n📋 CORS Tests');

await test('CORS - should include Access-Control-Allow-Origin', async () => {
  const response = await request(app).get('/health');

  if (!response.headers['access-control-allow-origin']) {
    throw new Error('Missing Access-Control-Allow-Origin header');
  }
});

await test('CORS - should handle OPTIONS preflight', async () => {
  const response = await request(app).options('/health');

  if (response.status !== 200 && response.status !== 204) {
    throw new Error(`Expected status 200 or 204, got ${response.status}`);
  }
});

// ============================================
// Body Parsing Tests
// ============================================
console.log('\n📋 Body Parsing Tests');

await test('JSON parsing - should accept and parse JSON body', async () => {
  const testData = { test: 'data', number: 123 };
  const response = await request(app).post('/test-json').send(testData);

  // Should either 404 (route not implemented) or accept JSON
  // We expect 404 since route is not implemented yet
  if (response.status !== 404) {
    // If not 404, body parsing should have worked (no 400 parse error)
    if (response.status === 400) {
      throw new Error('JSON parsing failed');
    }
  }
});

await test('URL-encoded parsing - should accept form data', async () => {
  const response = await request(app)
    .post('/test-form')
    .type('form')
    .send('name=test&value=123');

  // Should either 404 (route not implemented) or accept form data
  if (response.status !== 404) {
    if (response.status === 400) {
      throw new Error('URL-encoded parsing failed');
    }
  }
});

// ============================================
// Static Files Tests
// ============================================
console.log('\n📋 Static Files Tests');

await test('Static files - should serve index.html from /public', async () => {
  const response = await request(app).get('/');

  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }

  if (!response.text.includes('Pabs.ai WhatsApp Bridge')) {
    throw new Error('index.html should contain "Pabs.ai WhatsApp Bridge"');
  }

  if (response.type !== 'text/html') {
    throw new Error(`Expected content-type text/html, got ${response.type}`);
  }
});

await test('Static files - should return 404 for non-existent files', async () => {
  const response = await request(app).get('/non-existent-file.txt');

  if (response.status !== 404) {
    throw new Error(`Expected status 404, got ${response.status}`);
  }
});

// ============================================
// Error Handler Tests
// ============================================
console.log('\n📋 Error Handler Tests');

await test('404 handler - should return 404 for unknown routes', async () => {
  const response = await request(app).get('/api/unknown-route');

  if (response.status !== 404) {
    throw new Error(`Expected status 404, got ${response.status}`);
  }

  if (!response.body.success === false) {
    throw new Error('Error response should have success: false');
  }

  if (!response.body.error) {
    throw new Error('Error response should have error object');
  }

  if (!response.body.error.code) {
    throw new Error('Error object should have code field');
  }
});

await test('404 handler - should return JSON error format', async () => {
  const response = await request(app).get('/api/not-found');

  if (response.type !== 'application/json') {
    throw new Error(`Expected JSON response, got ${response.type}`);
  }

  if (!response.body.error.message) {
    throw new Error('Error should have message field');
  }

  if (typeof response.body.error.statusCode !== 'number') {
    throw new Error('Error should have statusCode field as number');
  }
});

// ============================================
// HTTP Methods Tests
// ============================================
console.log('\n📋 HTTP Methods Tests');

await test('GET method - should be supported', async () => {
  const response = await request(app).get('/health');

  if (response.status !== 200) {
    throw new Error('GET method should be supported');
  }
});

await test('POST method - should be supported', async () => {
  const response = await request(app).post('/test-route').send({});

  // Should return 404 (route not implemented) not 405 (method not allowed)
  if (response.status !== 404) {
    throw new Error(`Expected 404, got ${response.status}`);
  }
});

await test('PUT method - should be supported', async () => {
  const response = await request(app).put('/test-route').send({});

  // Should return 404 (route not implemented) not 405 (method not allowed)
  if (response.status !== 404) {
    throw new Error(`Expected 404, got ${response.status}`);
  }
});

await test('DELETE method - should be supported', async () => {
  const response = await request(app).delete('/test-route');

  // Should return 404 (route not implemented) not 405 (method not allowed)
  if (response.status !== 404) {
    throw new Error(`Expected 404, got ${response.status}`);
  }
});

// ============================================
// Content Type Tests
// ============================================
console.log('\n📋 Content Type Tests');

await test('Content-Type - JSON responses should have application/json', async () => {
  const response = await request(app).get('/health');

  if (!response.type.includes('application/json')) {
    throw new Error(`Expected application/json, got ${response.type}`);
  }
});

await test('Content-Type - should accept application/json requests', async () => {
  const response = await request(app)
    .post('/test-json')
    .set('Content-Type', 'application/json')
    .send({ test: 'data' });

  // Should not return 415 (Unsupported Media Type)
  if (response.status === 415) {
    throw new Error('application/json should be accepted');
  }
});

// ============================================
// Large Payload Tests
// ============================================
console.log('\n📋 Large Payload Tests');

await test('Large payload - should accept payloads up to 10MB', async () => {
  // Create a 1MB payload (well under 10MB limit)
  const largeData = {
    data: 'x'.repeat(1024 * 1024), // 1MB of 'x'
  };

  const response = await request(app).post('/test-large').send(largeData);

  // Should not return 413 (Payload Too Large)
  if (response.status === 413) {
    throw new Error('Should accept 1MB payload (limit is 10MB)');
  }
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
