# Custom Error Classes

Comprehensive error handling system for Pabs.ai WhatsApp Bridge with specialized error classes for different domains.

## Overview

This module provides a hierarchy of custom error classes that extend from a base `AppError` class. Each error class is designed for a specific domain (GHL, Evolution API, Validation, Database) and includes factory methods for common error scenarios.

## Error Class Hierarchy

```
Error (JavaScript native)
  └── AppError (base class)
      ├── DatabaseError
      ├── GHLError
      ├── EvolutionError
      └── ValidationError
```

## Base Class: AppError

Base error class that all custom errors extend from.

### Constructor

```javascript
new AppError(message, statusCode, code, details)
```

**Parameters:**
- `message` (string) - Human-readable error message
- `statusCode` (number, default: 500) - HTTP status code
- `code` (string, default: 'APP_ERROR') - Machine-readable error code
- `details` (Object, default: {}) - Additional error details

**Properties:**
- `message` - Error message
- `statusCode` - HTTP status code
- `code` - Error code for identification
- `details` - Additional error details
- `isOperational` - Always `true` (distinguishes operational errors from programming errors)
- `name` - Constructor name
- `stack` - Stack trace

**Methods:**
- `toJSON()` - Serialize error to JSON format

### Example

```javascript
import { AppError } from './shared/errors/index.js';

const error = new AppError('Something went wrong', 500, 'CUSTOM_ERROR', {
  userId: '123',
  action: 'create_user',
});

console.log(error.toJSON());
// {
//   name: 'AppError',
//   message: 'Something went wrong',
//   code: 'CUSTOM_ERROR',
//   statusCode: 500,
//   details: { userId: '123', action: 'create_user' },
//   stack: '...'
// }
```

---

## GHLError

Error class for GoHighLevel API interactions.

### Constructor

```javascript
new GHLError(message, statusCode, code, details)
```

### Error Codes

Available via `GHL_ERROR_CODES` export:

```javascript
import { GHL_ERROR_CODES } from './shared/errors/index.js';

// Authentication & Authorization
GHL_ERROR_CODES.AUTH_ERROR
GHL_ERROR_CODES.TOKEN_EXPIRED
GHL_ERROR_CODES.TOKEN_REFRESH_FAILED
GHL_ERROR_CODES.INVALID_CREDENTIALS
GHL_ERROR_CODES.UNAUTHORIZED

// API Errors
GHL_ERROR_CODES.API_ERROR
GHL_ERROR_CODES.RATE_LIMIT
GHL_ERROR_CODES.INVALID_REQUEST
GHL_ERROR_CODES.TIMEOUT

// Resource Errors
GHL_ERROR_CODES.CONTACT_NOT_FOUND
GHL_ERROR_CODES.CONVERSATION_NOT_FOUND
GHL_ERROR_CODES.LOCATION_NOT_FOUND
GHL_ERROR_CODES.MESSAGE_SEND_FAILED

// Data Errors
GHL_ERROR_CODES.INVALID_PHONE
GHL_ERROR_CODES.INVALID_LOCATION_ID
GHL_ERROR_CODES.MISSING_REQUIRED_FIELD
```

### Factory Methods

```javascript
import { GHLError } from './shared/errors/index.js';

// Authentication errors
GHLError.authError(message, details)           // 401
GHLError.tokenExpired(message, details)        // 401
GHLError.tokenRefreshFailed(message, details)  // 500

// Resource errors
GHLError.contactNotFound(contactId, details)        // 404
GHLError.conversationNotFound(conversationId, details) // 404
GHLError.locationNotFound(locationId, details)      // 404

// API errors
GHLError.rateLimit(message, details)           // 429
GHLError.timeout(message, details)             // 504
GHLError.invalidRequest(message, details)      // 400
GHLError.messageSendFailed(message, details)   // 500
```

### Examples

```javascript
// Token expired - auto-refresh needed
throw GHLError.tokenExpired('Access token expired', {
  locationId: 'loc-123',
  expiresAt: '2024-01-01T00:00:00Z',
});

// Contact not found
throw GHLError.contactNotFound('+34633839200', {
  searchedBy: 'phone',
  locationId: 'loc-123',
});

// Rate limit with retry info
throw GHLError.rateLimit('GHL API rate limit exceeded', {
  retryAfter: 60, // seconds
  endpoint: '/contacts',
});
```

---

## EvolutionError

Error class for Evolution API (WhatsApp) interactions.

### Constructor

```javascript
new EvolutionError(message, statusCode, code, details)
```

### Error Codes

Available via `EVOLUTION_ERROR_CODES` export:

```javascript
import { EVOLUTION_ERROR_CODES } from './shared/errors/index.js';

// Authentication & Authorization
EVOLUTION_ERROR_CODES.AUTH_ERROR
EVOLUTION_ERROR_CODES.INVALID_API_KEY
EVOLUTION_ERROR_CODES.UNAUTHORIZED

// Instance Errors
EVOLUTION_ERROR_CODES.INSTANCE_NOT_FOUND
EVOLUTION_ERROR_CODES.INSTANCE_NOT_CONNECTED
EVOLUTION_ERROR_CODES.INSTANCE_DISCONNECTED
EVOLUTION_ERROR_CODES.INSTANCE_CREATION_FAILED
EVOLUTION_ERROR_CODES.QR_CODE_EXPIRED

// Message Errors
EVOLUTION_ERROR_CODES.MESSAGE_SEND_FAILED
EVOLUTION_ERROR_CODES.MESSAGE_NOT_FOUND
EVOLUTION_ERROR_CODES.MESSAGE_TOO_LONG

// Media Errors
EVOLUTION_ERROR_CODES.MEDIA_DOWNLOAD_FAILED
EVOLUTION_ERROR_CODES.MEDIA_UPLOAD_FAILED
EVOLUTION_ERROR_CODES.MEDIA_NOT_FOUND
EVOLUTION_ERROR_CODES.MEDIA_INVALID_FORMAT
EVOLUTION_ERROR_CODES.MEDIA_TOO_LARGE

// Phone/Contact Errors
EVOLUTION_ERROR_CODES.INVALID_PHONE
EVOLUTION_ERROR_CODES.PHONE_NOT_WHATSAPP
EVOLUTION_ERROR_CODES.CONTACT_NOT_FOUND
EVOLUTION_ERROR_CODES.CONTACT_BLOCKED

// API Errors
EVOLUTION_ERROR_CODES.API_ERROR
EVOLUTION_ERROR_CODES.RATE_LIMIT
EVOLUTION_ERROR_CODES.TIMEOUT
EVOLUTION_ERROR_CODES.INVALID_REQUEST
EVOLUTION_ERROR_CODES.SERVICE_UNAVAILABLE
```

### Factory Methods

```javascript
import { EvolutionError } from './shared/errors/index.js';

// Authentication
EvolutionError.authError(message, details)  // 401

// Instance management
EvolutionError.instanceNotFound(instanceName, details)      // 404
EvolutionError.instanceNotConnected(instanceName, details)  // 503
EvolutionError.instanceDisconnected(instanceName, details)  // 503
EvolutionError.qrCodeExpired(instanceName, details)         // 400

// Messaging
EvolutionError.messageSendFailed(message, details)     // 500
EvolutionError.mediaDownloadFailed(message, details)   // 500
EvolutionError.mediaUploadFailed(message, details)     // 500

// Phone validation
EvolutionError.invalidPhone(phone, details)           // 400
EvolutionError.phoneNotWhatsApp(phone, details)       // 400

// API errors
EvolutionError.rateLimit(message, details)            // 429
EvolutionError.timeout(message, details)              // 504
EvolutionError.invalidRequest(message, details)       // 400
EvolutionError.serviceUnavailable(message, details)   // 503
```

### Examples

```javascript
// Instance not connected to WhatsApp
throw EvolutionError.instanceNotConnected('pabs-instance', {
  instanceName: 'pabs-instance',
  lastConnectionTime: '2024-01-01T00:00:00Z',
});

// Phone not on WhatsApp
throw EvolutionError.phoneNotWhatsApp('+34633839200', {
  phone: '+34633839200',
  checkedAt: new Date().toISOString(),
});

// Media download failed
throw EvolutionError.mediaDownloadFailed('Failed to download audio file', {
  messageId: 'msg-123',
  mediaType: 'audio',
  url: 'https://...',
});
```

---

## ValidationError

Error class for data validation failures. Always returns HTTP 400 status.

### Constructor

```javascript
new ValidationError(message, code, details)
```

Note: ValidationError always uses status code 400, so it's not a constructor parameter.

### Error Codes

Available via `VALIDATION_ERROR_CODES` export:

```javascript
import { VALIDATION_ERROR_CODES } from './shared/errors/index.js';

// General Validation
VALIDATION_ERROR_CODES.VALIDATION_FAILED
VALIDATION_ERROR_CODES.INVALID_INPUT

// Required Fields
VALIDATION_ERROR_CODES.REQUIRED_FIELD_MISSING
VALIDATION_ERROR_CODES.REQUIRED_FIELDS_MISSING

// Type Validation
VALIDATION_ERROR_CODES.INVALID_TYPE
VALIDATION_ERROR_CODES.INVALID_FORMAT

// Range & Length
VALIDATION_ERROR_CODES.OUT_OF_RANGE
VALIDATION_ERROR_CODES.VALUE_TOO_SMALL
VALIDATION_ERROR_CODES.VALUE_TOO_LARGE
VALIDATION_ERROR_CODES.INVALID_LENGTH
VALIDATION_ERROR_CODES.STRING_TOO_SHORT
VALIDATION_ERROR_CODES.STRING_TOO_LONG
VALIDATION_ERROR_CODES.ARRAY_TOO_SHORT
VALIDATION_ERROR_CODES.ARRAY_TOO_LONG

// Format Validation
VALIDATION_ERROR_CODES.INVALID_EMAIL
VALIDATION_ERROR_CODES.INVALID_PHONE
VALIDATION_ERROR_CODES.INVALID_URL
VALIDATION_ERROR_CODES.INVALID_UUID
VALIDATION_ERROR_CODES.INVALID_DATE
VALIDATION_ERROR_CODES.INVALID_JSON

// WhatsApp Specific
VALIDATION_ERROR_CODES.INVALID_WHATSAPP_JID
VALIDATION_ERROR_CODES.INVALID_PHONE_FORMAT

// Enum & Choices
VALIDATION_ERROR_CODES.INVALID_ENUM_VALUE
VALIDATION_ERROR_CODES.INVALID_CHOICE

// Uniqueness
VALIDATION_ERROR_CODES.DUPLICATE_VALUE
VALIDATION_ERROR_CODES.ALREADY_EXISTS
```

### Factory Methods

```javascript
import { ValidationError } from './shared/errors/index.js';

// Required fields
ValidationError.requiredField(field, details)
ValidationError.requiredFields(fieldsArray, details)

// Type validation
ValidationError.invalidType(field, expectedType, actualType, details)
ValidationError.invalidFormat(field, expectedFormat, details)

// Format validation
ValidationError.invalidEmail(email, details)
ValidationError.invalidPhone(phone, details)
ValidationError.invalidWhatsAppJID(jid, details)
ValidationError.invalidUrl(url, details)
ValidationError.invalidDate(field, value, details)
ValidationError.invalidJson(message, details)

// String length
ValidationError.stringTooLong(field, maxLength, actualLength, details)
ValidationError.stringTooShort(field, minLength, actualLength, details)

// Range validation
ValidationError.outOfRange(field, min, max, actual, details)

// Enum validation
ValidationError.invalidEnumValue(field, allowedValues, actualValue, details)

// Uniqueness
ValidationError.duplicateValue(field, value, details)
ValidationError.alreadyExists(resource, identifier, details)
```

### Examples

```javascript
// Required field missing
throw ValidationError.requiredField('email', {
  receivedFields: ['name', 'phone'],
});

// Invalid phone format
throw ValidationError.invalidPhone('+123', {
  expectedFormat: 'E.164',
  example: '+34633839200',
});

// String too long
throw ValidationError.stringTooLong('message', 4096, 5000, {
  charactersOver: 904,
});

// Invalid enum value
throw ValidationError.invalidEnumValue(
  'status',
  ['active', 'inactive', 'pending'],
  'archived',
  { receivedValue: 'archived' }
);

// Duplicate value
throw ValidationError.duplicateValue('email', 'user@example.com', {
  existingId: 'user-123',
});
```

---

## DatabaseError

Error class for database operations (Supabase).

### Constructor

```javascript
new DatabaseError(message, details)
```

Always uses status code 500 and code 'DATABASE_ERROR'.

### Example

```javascript
import { DatabaseError } from './shared/errors/index.js';

throw new DatabaseError('Failed to fetch client config', {
  table: 'clients',
  locationId: 'loc-123',
  operation: 'select',
});
```

---

## Integration with Error Handler Middleware

The custom errors integrate seamlessly with the global error handler middleware:

```javascript
import { errorHandler } from './shared/middleware/error-handler.js';
import { GHLError, ValidationError } from './shared/errors/index.js';

app.post('/api/contacts', async (req, res, next) => {
  try {
    // Validation
    if (!req.body.phone) {
      throw ValidationError.requiredField('phone');
    }

    // GHL API call
    const contact = await ghlApi.getContact(req.body.phone);
    if (!contact) {
      throw GHLError.contactNotFound(req.body.phone);
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    next(error); // Pass to error handler
  }
});

// Error handler (must be last)
app.use(errorHandler);
```

The error handler will automatically:
- Log the error with Winston
- Format the response with proper status code
- Sanitize sensitive data
- Return consistent JSON format:

```json
{
  "success": false,
  "error": {
    "message": "Required field missing: phone",
    "code": "REQUIRED_FIELD_MISSING",
    "statusCode": 400,
    "details": {
      "field": "phone"
    }
  }
}
```

---

## Best Practices

### 1. Use Factory Methods

Prefer factory methods over direct instantiation:

```javascript
// ✅ Good
throw GHLError.contactNotFound('+34633839200');

// ❌ Avoid
throw new GHLError('Contact not found', 404, 'GHL_CONTACT_NOT_FOUND', {
  phone: '+34633839200',
});
```

### 2. Include Context in Details

Always provide relevant context in the details object:

```javascript
throw EvolutionError.messageSendFailed('Failed to send message', {
  phone: '+34633839200',
  instanceName: 'pabs-instance',
  messageType: 'text',
  attemptNumber: 3,
  originalError: originalError.message,
});
```

### 3. Use Error Codes for Client Logic

Use error codes (not messages) for client-side error handling:

```javascript
// Client-side
try {
  await api.sendMessage(phone, text);
} catch (error) {
  if (error.code === 'EVOLUTION_PHONE_NOT_WHATSAPP') {
    // Show user-friendly message: "This number is not on WhatsApp"
  } else if (error.code === 'EVOLUTION_INSTANCE_NOT_CONNECTED') {
    // Show: "Please scan QR code to connect WhatsApp"
  }
}
```

### 4. Wrap External API Errors

Always wrap external API errors with domain-specific error classes:

```javascript
async function fetchGHLContact(phone) {
  try {
    const response = await axios.get(`${GHL_API_URL}/contacts`, {
      params: { phone },
    });
    return response.data;
  } catch (error) {
    // Wrap axios error with GHLError
    if (error.response?.status === 404) {
      throw GHLError.contactNotFound(phone, {
        originalError: error.message,
      });
    } else if (error.response?.status === 429) {
      throw GHLError.rateLimit('GHL rate limit exceeded', {
        retryAfter: error.response.headers['retry-after'],
      });
    } else {
      throw GHLError.invalidRequest('GHL API request failed', {
        statusCode: error.response?.status,
        originalError: error.message,
      });
    }
  }
}
```

### 5. Use asyncHandler for Routes

Always wrap async route handlers with `asyncHandler`:

```javascript
import { asyncHandler } from './shared/middleware/error-handler.js';

app.post(
  '/api/contacts',
  asyncHandler(async (req, res) => {
    // Any error thrown here will be caught and passed to error handler
    const contact = await createContact(req.body);
    res.json({ success: true, data: contact });
  })
);
```

---

## Testing

All error classes include comprehensive tests. Run tests with:

```bash
node test-errors.js
```

Expected output:
```
✅ Passed: 48
❌ Failed: 0
📝 Total:  48
```

---

## Error Response Format

All errors follow a consistent JSON response format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "MACHINE_READABLE_ERROR_CODE",
    "statusCode": 400,
    "details": {
      "field": "additionalContext",
      "value": "moreInfo"
    }
  }
}
```

Stack traces are only included in development mode (`NODE_ENV !== 'production'`).

---

## Available Exports

```javascript
// From src/shared/errors/index.js
import {
  // Error classes
  AppError,
  DatabaseError,
  GHLError,
  EvolutionError,
  ValidationError,

  // Error code constants
  GHL_ERROR_CODES,
  EVOLUTION_ERROR_CODES,
  VALIDATION_ERROR_CODES,
} from './shared/errors/index.js';
```

---

## Error Class Summary

| Class | Status Code | Common Use Cases |
|-------|-------------|------------------|
| `AppError` | Configurable (default: 500) | Base class, generic errors |
| `DatabaseError` | 500 | Supabase query failures |
| `GHLError` | Configurable | GHL API failures, auth issues |
| `EvolutionError` | Configurable | WhatsApp API failures, instance issues |
| `ValidationError` | 400 (always) | Input validation, format errors |

---

**Implementation:** Complete
**Tests:** 48/48 passing
**Integration:** Global error handler middleware
**Documentation:** Complete
