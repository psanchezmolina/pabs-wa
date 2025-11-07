# Middleware Documentation

Middlewares centralizados para manejo de errores, validación, y utilidades de Express.

## Tabla de Contenidos

- [Request Logger](#request-logger)
- [Error Handler](#error-handler)
- [Validation Middleware](#validation-middleware)
- [Async Handler](#async-handler)
- [Not Found Handler](#not-found-handler)
- [Ejemplos de Integración](#ejemplos-de-integración)

---

## Request Logger

Middleware de logging de requests HTTP usando Morgan. Integrado con Winston para logs persistentes.

### Características

- ✅ **Desarrollo:** Formato colorizado 'dev' a consola
- ✅ **Producción:** Formato JSON a Winston (app.log, error.log)
- ✅ Niveles de log automáticos según status code (info/warn/error)
- ✅ Skip automático de rutas (ej: /health)
- ✅ Tokens personalizados (timestamp, response-time-ms)
- ✅ Presets configurables (minimal, combined, short, errorsOnly)
- ✅ Función para crear loggers personalizados

### Configuración Automática

El logger se configura automáticamente según `NODE_ENV`:

**Desarrollo (`NODE_ENV !== 'production'`):**
```
GET /api/users 200 12.345 ms - 1234
```

**Producción (`NODE_ENV === 'production'`):**
```json
{
  "timestamp": "2025-11-08T00:06:18.587Z",
  "method": "GET",
  "url": "/api/users",
  "status": 200,
  "responseTime": "12.345ms",
  "contentLength": "1234",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.1",
  "httpVersion": "1.1"
}
```

### Uso Básico

```javascript
// src/index.js
import express from 'express';
import requestLogger from './shared/middleware/request-logger.js';

const app = express();

// Request logger DEBE ir después de body parsers
app.use(express.json());
app.use(requestLogger); // ← Aquí

// ... rutas ...

app.listen(3000);
```

### Niveles de Log Automáticos

El middleware loggea automáticamente con el nivel apropiado según el status code:

- **5xx (Server Errors):** `logger.error()`
- **4xx (Client Errors):** `logger.warn()`
- **2xx/3xx (Success):** `logger.info()`

**Ejemplo en logs:**
```json
// app-2025-11-08.log
{"level":"info","message":"{...GET /api/users 200...}","timestamp":"..."}
{"level":"warn","message":"{...GET /api/unknown 404...}","timestamp":"..."}
{"level":"error","message":"{...GET /api/crash 500...}","timestamp":"..."}
```

### Skip de Rutas

Por defecto, el middleware **NO loggea**:
- `/health` (health checks)

Para agregar más rutas a skip:

```javascript
// src/shared/middleware/request-logger.js
const skipRoutes = (req, res) => {
  // Skip health check
  if (req.path === '/health') return true;

  // Skip metrics endpoint
  if (req.path === '/metrics') return true;

  // Skip static files
  if (req.path.startsWith('/static')) return true;

  return false;
};
```

### Presets Disponibles

El módulo incluye presets predefinidos:

```javascript
import { loggerPresets } from './shared/middleware/request-logger.js';

// Minimal (tiny format)
app.use(loggerPresets.minimal);

// Combined (Apache-style)
app.use(loggerPresets.combined);

// Short (with response time)
app.use(loggerPresets.short);

// Only errors (4xx y 5xx)
app.use(loggerPresets.errorsOnly);
```

### Custom Loggers

#### getMorganLogger()

Crea un logger con formato específico:

```javascript
import { getMorganLogger } from './shared/middleware/request-logger.js';

// Logger para API con formato tiny
const apiLogger = getMorganLogger('tiny', {
  skip: (req) => !req.path.startsWith('/api')
});

app.use('/api', apiLogger);
```

#### createCustomLogger()

Crea un logger con formato personalizado:

```javascript
import { createCustomLogger } from './shared/middleware/request-logger.js';

// Logger personalizado para webhooks
const webhookLogger = createCustomLogger((tokens, req, res) => {
  return JSON.stringify({
    type: 'webhook',
    timestamp: new Date().toISOString(),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: tokens['response-time'](req, res),
    // Campos custom
    locationId: req.body?.locationId,
    instanceName: req.body?.instanceName,
  });
});

app.use('/webhook', webhookLogger);
```

### Tokens Personalizados

El módulo define tokens custom para Morgan:

```javascript
// timestamp - ISO 8601 timestamp
morgan.token('timestamp', () => new Date().toISOString());

// response-time-ms - Response time en milisegundos con 3 decimales
morgan.token('response-time-ms', (req, res) => {
  // returns "12.345ms"
});
```

Usar en formato personalizado:

```javascript
const customFormat = ':timestamp :method :url :status :response-time-ms';
app.use(getMorganLogger(customFormat));
```

### Integración con Winston

Los logs de Morgan se escriben automáticamente a los archivos de Winston:

```javascript
// src/shared/middleware/request-logger.js
const winstonStream = {
  write: (message) => {
    const logMessage = message.trim();
    const statusCode = extractStatusCode(logMessage);

    if (statusCode >= 500) {
      logger.error(logMessage);      // → error-2025-11-08.log
    } else if (statusCode >= 400) {
      logger.warn(logMessage);       // → app-2025-11-08.log
    } else {
      logger.info(logMessage);       // → app-2025-11-08.log
    }
  }
};
```

### Ejemplos de Integración

#### Setup Completo

```javascript
// src/index.js
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import requestLogger from './shared/middleware/request-logger.js';
import errorHandler, { notFoundHandler } from './shared/middleware/error-handler.js';

const app = express();

// Security
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (después de body parsers, antes de rutas)
app.use(requestLogger);

// Health check (no se loggea)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);

// Error handling (debe ir al final)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(3000);
```

#### Logger por Ruta

```javascript
import { createCustomLogger } from './shared/middleware/request-logger.js';

// Logger específico para webhooks
const webhookLogger = createCustomLogger((tokens, req, res) => {
  return JSON.stringify({
    type: 'webhook',
    direction: req.path.includes('ghl') ? 'ghl-to-wa' : 'wa-to-ghl',
    timestamp: tokens.timestamp(req, res),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: tokens['response-time-ms'](req, res),
  });
});

app.use('/webhook/ghl', webhookLogger, ghlWebhookHandler);
app.use('/webhook/wa', webhookLogger, waWebhookHandler);
```

#### Solo Errores en Producción

```javascript
import { loggerPresets } from './shared/middleware/request-logger.js';

// Solo loggear errores en producción
if (process.env.NODE_ENV === 'production') {
  app.use(loggerPresets.errorsOnly);
} else {
  app.use(requestLogger);
}
```

### Formatos de Morgan Disponibles

Morgan incluye varios formatos predefinidos:

#### combined (Apache Combined Log)
```
:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"
```

#### common (Apache Common Log)
```
:remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]
```

#### dev (Colorizado para desarrollo)
```
:method :url :status :response-time ms - :res[content-length]
```

#### short
```
:remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms
```

#### tiny (Minimal)
```
:method :url :status :res[content-length] - :response-time ms
```

### Monitoreo de Logs

#### Ver logs en tiempo real

```bash
# Todos los requests
tail -f logs/app-2025-11-08.log | grep -E '"method"|"url"'

# Solo errores
tail -f logs/error-2025-11-08.log

# Filtrar por ruta
tail -f logs/app-2025-11-08.log | grep '/api/users'

# Filtrar por status code
tail -f logs/app-2025-11-08.log | grep '"status":500'
```

#### Análisis de logs

```bash
# Contar requests por status code
grep '"status":' logs/app-2025-11-08.log | sed 's/.*"status":\([0-9]*\).*/\1/' | sort | uniq -c

# Requests más lentos
grep '"responseTime"' logs/app-2025-11-08.log | sort -t: -k7 -n | tail -10

# Top rutas más accedidas
grep '"url":' logs/app-2025-11-08.log | sed 's/.*"url":"\([^"]*\)".*/\1/' | sort | uniq -c | sort -rn | head -10
```

### Performance

#### Consideraciones

- Morgan es muy ligero (~0.1ms overhead por request)
- En producción, considera usar `errorsOnly` si hay alto tráfico
- Los logs se escriben de forma asíncrona (no bloquean requests)

#### Optimizaciones

```javascript
// Solo loggear en producción si es error o request lento
const productionLogger = createCustomLogger((tokens, req, res) => {
  const status = parseInt(tokens.status(req, res), 10);
  const responseTime = parseFloat(tokens['response-time'](req, res));

  // Solo loggear si es error O request > 1 segundo
  if (status >= 400 || responseTime > 1000) {
    return JSON.stringify({
      timestamp: tokens.timestamp(req, res),
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status,
      responseTime: `${responseTime}ms`,
    });
  }

  return null; // Skip log
});
```

### Testing

#### Unit Test

```javascript
import request from 'supertest';
import express from 'express';
import requestLogger from '../src/shared/middleware/request-logger.js';

describe('Request Logger Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(requestLogger);
    app.get('/test', (req, res) => res.json({ ok: true }));
  });

  test('should log requests', async () => {
    const response = await request(app).get('/test');
    expect(response.status).toBe(200);
    // Verificar que se escribió al log (mock Winston)
  });

  test('should skip health check', async () => {
    app.get('/health', (req, res) => res.json({ ok: true }));
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    // Verificar que NO se escribió al log
  });
});
```

### Troubleshooting

#### Los logs no aparecen

**Causa:** Request logger colocado después de las rutas

**Solución:**
```javascript
// ❌ MAL
app.use('/api', routes);
app.use(requestLogger); // Nunca se ejecuta

// ✅ BIEN
app.use(requestLogger);
app.use('/api', routes);
```

#### Logs duplicados

**Causa:** Múltiples instancias de request logger

**Solución:** Solo usar una vez, globalmente:
```javascript
// ❌ MAL
app.use(requestLogger);
app.use('/api', requestLogger, routes); // Duplicado

// ✅ BIEN
app.use(requestLogger); // Una sola vez
app.use('/api', routes);
```

#### No se loggean los errores

**Causa:** Request logger después del error handler

**Solución:**
```javascript
// Orden correcto
app.use(requestLogger);    // 1. Logger primero
app.use('/api', routes);   // 2. Rutas
app.use(errorHandler);     // 3. Error handler último
```

### Mejores Prácticas

#### ✅ Hacer

```javascript
// Usar el logger por defecto (ajusta automáticamente según NODE_ENV)
app.use(requestLogger);

// Skip de rutas que no necesitan logging
const skipRoutes = (req, res) => {
  return req.path === '/health' || req.path === '/metrics';
};

// Loggers personalizados para rutas específicas
const webhookLogger = createCustomLogger(customFormat);
app.use('/webhook', webhookLogger);

// Solo errores en alto tráfico
if (highTraffic) {
  app.use(loggerPresets.errorsOnly);
}
```

#### ❌ Evitar

```javascript
// NO usar console.log para requests
app.use((req, res, next) => {
  console.log(req.method, req.url); // ❌
  next();
});

// NO loggear información sensible en custom formats
const badLogger = createCustomLogger((tokens, req, res) => {
  return JSON.stringify({
    password: req.body?.password, // ❌ Nunca loggear passwords
    token: req.headers.authorization, // ❌
  });
});

// NO crear múltiples instancias
app.use(requestLogger);
app.use(requestLogger); // ❌ Duplicado
```

---

## Error Handler

Middleware global de manejo de errores para Express. Captura todos los errores, los loggea con Winston, y retorna respuestas JSON consistentes.

### Formato de Respuesta

Todos los errores retornan este formato consistente:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "details": {}
  }
}
```

### Tipos de Errores Soportados

#### 1. Joi ValidationError

**Trigger:** Errores de validación con Joi

**Status Code:** 400

**Ejemplo:**
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "code": "VALIDATION_ERROR",
    "statusCode": 400,
    "details": {
      "fields": [
        {
          "field": "email",
          "message": "\"email\" must be a valid email",
          "type": "string.email"
        },
        {
          "field": "age",
          "message": "\"age\" must be greater than or equal to 18",
          "type": "number.min"
        }
      ],
      "originalMessage": "\"email\" must be a valid email. \"age\" must be greater than or equal to 18"
    }
  }
}
```

#### 2. AppError (Custom Errors)

**Trigger:** Errores lanzados con `AppError`, `DatabaseError`, etc.

**Status Code:** Definido en el error (por defecto 500)

**Ejemplo:**
```json
{
  "success": false,
  "error": {
    "message": "Location not found: loc_123",
    "code": "DATABASE_ERROR",
    "statusCode": 404,
    "details": {
      "locationId": "loc_123"
    }
  }
}
```

#### 3. Generic Errors

**Trigger:** Cualquier error no manejado (Error, TypeError, etc.)

**Status Code:** 500

**Producción:**
```json
{
  "success": false,
  "error": {
    "message": "An unexpected error occurred",
    "code": "INTERNAL_ERROR",
    "statusCode": 500,
    "details": {}
  }
}
```

**Desarrollo:**
```json
{
  "success": false,
  "error": {
    "message": "Cannot read property 'name' of undefined",
    "code": "INTERNAL_ERROR",
    "statusCode": 500,
    "details": {
      "name": "TypeError",
      "stack": "TypeError: Cannot read property 'name' of undefined\n    at ...",
      "originalMessage": "Cannot read property 'name' of undefined"
    }
  }
}
```

### Logging

El error handler loggea automáticamente todos los errores con contexto completo:

- **Server errors (5xx):** `logger.error()`
- **Client errors (4xx):** `logger.warn()`
- **Otros:** `logger.info()`

**Contexto incluido:**
- Error message, code, statusCode
- Request method, path, query, body (sanitizado)
- IP address, User-Agent
- Stack trace

**Sanitización:**
Los siguientes campos se redactan automáticamente en logs:
- `password`
- `token`
- `apiKey` / `api_key`
- `accessToken` / `access_token`
- `refreshToken` / `refresh_token`
- `secret`
- `authorization`

### Uso

#### Setup en Express App

```javascript
// src/index.js
import express from 'express';
import errorHandler, { notFoundHandler } from './shared/middleware/error-handler.js';

const app = express();

// ... tus rutas aquí ...

// 404 handler (antes del error handler)
app.use(notFoundHandler);

// Error handler global (DEBE ser el último middleware)
app.use(errorHandler);

app.listen(3000);
```

#### Lanzar errores en routes/controllers

```javascript
import { asyncHandler } from './shared/middleware/error-handler.js';
import AppError from './shared/errors/AppError.js';

// Opción 1: Usar asyncHandler (recomendado para async)
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUser(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND', {
      userId: req.params.id
    });
  }

  res.json({ success: true, data: user });
}));

// Opción 2: Pasar al next (sync o async)
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await getUser(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});
```

---

## Validation Middleware

Middleware factory para validar request data con Joi schemas.

### Características

- ✅ Valida `body`, `query`, o `params`
- ✅ Retorna todos los errores (no solo el primero)
- ✅ Elimina campos desconocidos automáticamente
- ✅ Aplica valores por defecto y coerción de tipos
- ✅ Schemas comunes predefinidos

### Uso Básico

```javascript
import { validate } from './shared/middleware/validate.js';
import Joi from 'joi';

// Definir schema
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

// Aplicar validación
router.post('/login', validate(loginSchema, 'body'), loginController);
```

### Schemas Comunes

El módulo incluye schemas predefinidos para casos comunes:

```javascript
import { validate, commonSchemas } from './shared/middleware/validate.js';

// Location ID
const schema = Joi.object({
  locationId: commonSchemas.locationId
});

// Phone number (WhatsApp format)
const schema = Joi.object({
  phone: commonSchemas.phone
});

// Message text
const schema = Joi.object({
  text: commonSchemas.messageText
});

// Pagination
router.get('/items', validate(commonSchemas.pagination, 'query'), controller);

// Contact ID
const schema = Joi.object({
  contactId: commonSchemas.contactId
});

// Instance name
const schema = Joi.object({
  instanceName: commonSchemas.instanceName
});

// API key
const schema = Joi.object({
  apiKey: commonSchemas.apiKey
});

// URL
const schema = Joi.object({
  webhookUrl: commonSchemas.url
});

// Email
const schema = Joi.object({
  email: commonSchemas.email
});
```

### Validar Diferentes Propiedades

```javascript
// Validar body (por defecto)
router.post('/users', validate(userSchema), createUser);

// Validar query params
router.get('/users', validate(paginationSchema, 'query'), listUsers);

// Validar URL params
const paramsSchema = Joi.object({
  id: Joi.string().required()
});
router.get('/users/:id', validate(paramsSchema, 'params'), getUser);
```

### Combinar Schemas

```javascript
import { combineSchemas, commonSchemas } from './shared/middleware/validate.js';

const schema = combineSchemas(
  Joi.object({ email: commonSchemas.email }),
  Joi.object({ locationId: commonSchemas.locationId }),
  Joi.object({ name: Joi.string().required() })
);
```

---

## Async Handler

Wrapper para route handlers async que captura errores automáticamente.

### Problema que Resuelve

Sin async handler:
```javascript
// ❌ Tedioso: try-catch en cada route
router.get('/users', async (req, res, next) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});
```

Con async handler:
```javascript
// ✅ Limpio: errores manejados automáticamente
router.get('/users', asyncHandler(async (req, res) => {
  const users = await getUsers();
  res.json(users);
}));
```

### Uso

```javascript
import { asyncHandler } from './shared/middleware/error-handler.js';

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await findUser(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ success: true, data: user });
}));

router.post('/users', asyncHandler(async (req, res) => {
  const user = await createUser(req.body);
  res.status(201).json({ success: true, data: user });
}));
```

---

## Not Found Handler

Middleware que captura rutas no encontradas (404).

### Uso

```javascript
import { notFoundHandler } from './shared/middleware/error-handler.js';

// Después de todas las rutas, antes del error handler
app.use(notFoundHandler);
app.use(errorHandler);
```

### Respuesta

```json
{
  "success": false,
  "error": {
    "message": "Route not found: GET /api/nonexistent",
    "code": "NOT_FOUND",
    "statusCode": 404,
    "details": {
      "method": "GET",
      "path": "/api/nonexistent"
    }
  }
}
```

---

## Unhandled Rejection Handler

Setup para capturar promise rejections y uncaught exceptions no manejadas.

### Setup

```javascript
// src/index.js
import { setupUnhandledRejectionHandler } from './shared/middleware/error-handler.js';

// Llamar al inicio de tu app
setupUnhandledRejectionHandler();

// ... resto de tu app ...
```

### Comportamiento

**Desarrollo:**
- Loggea el error
- Continúa ejecutando

**Producción:**
- Loggea el error
- Sale del proceso con código 1
- El orquestador (Docker, PM2, etc.) debe reiniciar el proceso

---

## Ejemplos de Integración

### Ejemplo 1: CRUD Completo

```javascript
// src/modules/clients/clients.routes.js
import express from 'express';
import { asyncHandler } from '../../shared/middleware/error-handler.js';
import { validate, commonSchemas } from '../../shared/middleware/validate.js';
import Joi from 'joi';
import * as controller from './clients.controller.js';

const router = express.Router();

// Schema para crear cliente
const createClientSchema = Joi.object({
  locationId: commonSchemas.locationId,
  instanceName: commonSchemas.instanceName,
  instanceApikey: commonSchemas.apiKey,
  instanceSender: commonSchemas.phone,
});

// Schema para actualizar cliente
const updateClientSchema = Joi.object({
  instanceName: commonSchemas.instanceName.optional(),
  instanceApikey: commonSchemas.apiKey.optional(),
  instanceSender: commonSchemas.phone.optional(),
}).min(1); // Al menos un campo requerido

// Schema para params
const idParamSchema = Joi.object({
  locationId: commonSchemas.locationId,
});

// Routes
router.get('/', asyncHandler(controller.list));

router.get(
  '/:locationId',
  validate(idParamSchema, 'params'),
  asyncHandler(controller.get)
);

router.post(
  '/',
  validate(createClientSchema, 'body'),
  asyncHandler(controller.create)
);

router.put(
  '/:locationId',
  validate(idParamSchema, 'params'),
  validate(updateClientSchema, 'body'),
  asyncHandler(controller.update)
);

router.delete(
  '/:locationId',
  validate(idParamSchema, 'params'),
  asyncHandler(controller.remove)
);

export default router;
```

```javascript
// src/modules/clients/clients.controller.js
import { getClientConfig } from '../../config/database.js';
import AppError from '../../shared/errors/AppError.js';
import logger from '../../config/logger.js';

export const get = async (req, res) => {
  const { locationId } = req.params;

  const client = await getClientConfig(locationId);

  res.json({
    success: true,
    data: client,
  });
};

export const create = async (req, res) => {
  const { locationId, instanceName } = req.body;

  // Check if exists
  try {
    await getClientConfig(locationId);
    throw new AppError('Client already exists', 409, 'CLIENT_EXISTS', {
      locationId,
    });
  } catch (error) {
    if (error.statusCode !== 404) throw error;
  }

  // Create client
  const client = await createClient(req.body);

  logger.info('Client created', { locationId, instanceName });

  res.status(201).json({
    success: true,
    data: client,
  });
};

export const update = async (req, res) => {
  const { locationId } = req.params;

  // Verify exists
  await getClientConfig(locationId);

  // Update
  const client = await updateClient(locationId, req.body);

  logger.info('Client updated', { locationId });

  res.json({
    success: true,
    data: client,
  });
};

export const remove = async (req, res) => {
  const { locationId } = req.params;

  // Verify exists
  await getClientConfig(locationId);

  // Delete
  await deleteClient(locationId);

  logger.info('Client deleted', { locationId });

  res.json({
    success: true,
    message: 'Client deleted successfully',
  });
};
```

### Ejemplo 2: Webhook con Validación

```javascript
// src/modules/ghl-to-wa/ghl-to-wa.routes.js
import express from 'express';
import { asyncHandler } from '../../shared/middleware/error-handler.js';
import { validate } from '../../shared/middleware/validate.js';
import Joi from 'joi';
import * as controller from './ghl-to-wa.controller.js';

const router = express.Router();

const webhookSchema = Joi.object({
  locationId: Joi.string().required(),
  contactId: Joi.string().required(),
  message: Joi.string().max(4096).required(),
  phone: Joi.string().required(),
  type: Joi.string().valid('SMS', 'WhatsApp').default('WhatsApp'),
});

router.post(
  '/webhook/ghl',
  validate(webhookSchema, 'body'),
  asyncHandler(controller.handleGHLWebhook)
);

export default router;
```

### Ejemplo 3: App Completa

```javascript
// src/index.js
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import logger from './config/logger.js';
import errorHandler, {
  notFoundHandler,
  setupUnhandledRejectionHandler,
} from './shared/middleware/error-handler.js';

// Import routes
import clientsRoutes from './modules/clients/clients.routes.js';
import ghlToWaRoutes from './modules/ghl-to-wa/ghl-to-wa.routes.js';
import waToGhlRoutes from './modules/wa-to-ghl/wa-to-ghl.routes.js';
import authRoutes from './modules/auth/auth.routes.js';

// Setup unhandled rejection handler
setupUnhandledRejectionHandler();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/clients', clientsRoutes);
app.use('/webhook', ghlToWaRoutes);
app.use('/webhook', waToGhlRoutes);
app.use('/auth', authRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    env: process.env.NODE_ENV,
  });
});
```

---

## Testing

### Unit Tests con Jest

```javascript
// __tests__/error-handler.test.js
import { jest } from '@jest/globals';
import errorHandler from '../src/shared/middleware/error-handler.js';
import AppError from '../src/shared/errors/AppError.js';

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/test',
      query: {},
      body: {},
      ip: '127.0.0.1',
      get: jest.fn(),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test('should handle AppError correctly', () => {
    const error = new AppError('Test error', 400, 'TEST_ERROR');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Test error',
        code: 'TEST_ERROR',
        statusCode: 400,
        details: {},
      },
    });
  });

  test('should handle generic errors', () => {
    const error = new Error('Generic error');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
          statusCode: 500,
        }),
      })
    );
  });
});
```

### Integration Tests con Supertest

```javascript
// __tests__/integration/error-handling.test.js
import request from 'supertest';
import app from '../src/index.js';

describe('Error Handling Integration', () => {
  test('should return 404 for non-existent route', async () => {
    const response = await request(app).get('/nonexistent');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'NOT_FOUND',
        statusCode: 404,
      },
    });
  });

  test('should return validation error for invalid body', async () => {
    const response = await request(app)
      .post('/api/clients')
      .send({ invalid: 'data' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      },
    });
  });
});
```

---

## Troubleshooting

### Error: Headers already sent

**Causa:** Intentar enviar respuesta después de que ya se envió una.

**Solución:**
```javascript
// ❌ MAL
router.get('/test', async (req, res, next) => {
  res.json({ data: 'something' });
  throw new Error('Oops'); // Headers ya enviados
});

// ✅ BIEN
router.get('/test', asyncHandler(async (req, res) => {
  if (error) {
    throw new Error('Oops'); // Se lanza antes de enviar respuesta
  }
  res.json({ data: 'something' });
}));
```

### Error handler no se ejecuta

**Causa:** Error handler no es el último middleware.

**Solución:**
```javascript
// ❌ MAL
app.use(errorHandler);
app.use('/api', routes); // Esto nunca se ejecuta

// ✅ BIEN
app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler); // Debe ser el último
```

### Errores async no se capturan

**Causa:** No usar asyncHandler o try-catch.

**Solución:**
```javascript
// ❌ MAL
router.get('/test', async (req, res) => {
  const data = await fetchData(); // Si falla, no se captura
  res.json(data);
});

// ✅ BIEN - Opción 1: asyncHandler
router.get('/test', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json(data);
}));

// ✅ BIEN - Opción 2: try-catch manual
router.get('/test', async (req, res, next) => {
  try {
    const data = await fetchData();
    res.json(data);
  } catch (error) {
    next(error);
  }
});
```

---

## Mejores Prácticas

### ✅ Hacer

```javascript
// Usar asyncHandler para async routes
router.get('/users', asyncHandler(async (req, res) => {
  const users = await getUsers();
  res.json({ success: true, data: users });
}));

// Lanzar errores descriptivos
throw new AppError('User not found', 404, 'USER_NOT_FOUND', {
  userId: req.params.id,
});

// Validar input con Joi
router.post('/users', validate(userSchema), asyncHandler(controller.create));

// Loggear contexto adicional cuando sea útil
logger.info('User created', { userId: user.id, email: user.email });
```

### ❌ Evitar

```javascript
// NO enviar respuestas inconsistentes
res.json({ error: 'Something failed' }); // ❌ Formato inconsistente

// NO ignorar errores
try {
  await doSomething();
} catch (error) {
  // Sin loggear ni manejar
} // ❌

// NO exponer stack traces en producción (ya manejado automáticamente)
res.status(500).json({ error: error.stack }); // ❌

// NO usar console.log para errores
console.log('Error:', error); // ❌ Usar logger
```

---

## Referencias

- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [Joi Documentation](https://joi.dev/api/)
- [Winston Documentation](https://github.com/winstonjs/winston)
