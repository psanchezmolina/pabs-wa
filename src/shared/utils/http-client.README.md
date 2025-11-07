# HTTP Client

Cliente HTTP pre-configurado usando axios con retry automático.

## Características

- ✅ **3 reintentos automáticos** en errores 5xx y de red
- ✅ **Backoff exponencial** (1s → 2s → 4s)
- ✅ **NO reintenta** en errores 4xx (client errors)
- ✅ **Logging integrado** con Winston
- ✅ **Sanitización** de headers sensibles en logs
- ✅ **Timeout** de 30 segundos por defecto
- ✅ **Factory function** para crear clientes personalizados

## Uso Básico

### Importar el cliente

```javascript
import httpClient from './shared/utils/http-client.js';

// GET request
const response = await httpClient.get('https://api.example.com/users');
console.log(response.data);

// POST request
const user = await httpClient.post('https://api.example.com/users', {
  name: 'John Doe',
  email: 'john@example.com',
});

// PUT request
await httpClient.put('https://api.example.com/users/123', {
  name: 'Jane Doe',
});

// DELETE request
await httpClient.delete('https://api.example.com/users/123');
```

### Con headers personalizados

```javascript
const response = await httpClient.get('https://api.example.com/protected', {
  headers: {
    'Authorization': 'Bearer your-token',
    'X-Custom-Header': 'value',
  },
});
```

### Con query params

```javascript
const response = await httpClient.get('https://api.example.com/users', {
  params: {
    page: 1,
    limit: 20,
    sort: 'name',
  },
});
// Request URL: https://api.example.com/users?page=1&limit=20&sort=name
```

## Configuración de Retry

### Comportamiento automático

El cliente reintenta automáticamente en estos casos:

**✅ Reintenta:**
- Errores 5xx (500, 502, 503, 504, etc.)
- Errores de red (ECONNREFUSED, ETIMEDOUT, etc.)
- Timeouts (ECONNABORTED)

**❌ NO reintenta:**
- Errores 4xx (400, 401, 404, etc.)
- Errores 3xx (redirects)
- Errores 2xx (success)

### Backoff exponencial

Los reintentos usan backoff exponencial:
- **Intento 1:** Inmediato (request original)
- **Intento 2:** Después de ~1 segundo
- **Intento 3:** Después de ~2 segundos
- **Intento 4:** Después de ~4 segundos

**Total:** 1 request original + 3 reintentos = 4 intentos máximo

### Ejemplo de flujo con retry

```javascript
// Este request fallará 2 veces con 500, luego tendrá éxito
const response = await httpClient.get('https://api.example.com/unstable');

// Flujo interno:
// 1. Request original → 500 error
// 2. Wait 1s → Retry 1 → 500 error
// 3. Wait 2s → Retry 2 → 200 success ✅
```

## Cliente Personalizado

### createHttpClient()

Crea un cliente con configuración específica:

```javascript
import { createHttpClient } from './shared/utils/http-client.js';

// Cliente para API externa
const ghlClient = createHttpClient({
  baseURL: 'https://services.leadconnectorhq.com',
  timeout: 10000,
  headers: {
    'Version': '2021-04-15',
    'Accept': 'application/json',
  },
}, {
  retries: 5, // Más reintentos
});

// Uso
const contacts = await ghlClient.get('/contacts', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### Cliente con configuración custom

```javascript
// Cliente para Evolution API
const evolutionClient = createHttpClient({
  baseURL: 'https://pabs-evolution-api.r4isqy.easypanel.host',
  timeout: 60000, // 60 segundos para operaciones pesadas
  headers: {
    'apikey': process.env.EVOLUTION_API_KEY,
  },
}, {
  retries: 2,
  retryDelay: (retryCount) => retryCount * 2000, // 2s, 4s
});
```

## Funciones Helper

### isRetryableError()

Verifica si un error es retryable:

```javascript
import { isRetryableError } from './shared/utils/http-client.js';

try {
  await httpClient.get('https://api.example.com/data');
} catch (error) {
  if (isRetryableError(error)) {
    console.log('Error retryable, ya se reintentó automáticamente');
  } else {
    console.log('Error no retryable (probablemente 4xx)');
  }
}
```

### getRetryCount()

Obtiene el número de reintentos de un request:

```javascript
import { getRetryCount } from './shared/utils/http-client.js';

httpClient.interceptors.response.use(
  (response) => {
    const retries = getRetryCount(response.config);
    if (retries > 0) {
      console.log(`Request succeeded after ${retries} retries`);
    }
    return response;
  }
);
```

## Logging

### Requests

Todos los requests se loggean automáticamente:

```json
{
  "level": "debug",
  "message": "HTTP request",
  "method": "GET",
  "url": "https://api.example.com/users",
  "headers": {
    "Authorization": "***REDACTED***",
    "Content-Type": "application/json"
  }
}
```

### Responses

Las responses exitosas se loggean como debug:

```json
{
  "level": "debug",
  "message": "HTTP response",
  "method": "GET",
  "url": "https://api.example.com/users",
  "status": 200,
  "statusText": "OK"
}
```

### Errores

Los errores se loggean según el tipo:

**5xx errors:**
```json
{
  "level": "error",
  "message": "HTTP server error (5xx)",
  "method": "GET",
  "url": "https://api.example.com/users",
  "status": 500,
  "error": "Request failed with status code 500"
}
```

**4xx errors:**
```json
{
  "level": "warn",
  "message": "HTTP client error (4xx)",
  "method": "GET",
  "url": "https://api.example.com/users",
  "status": 404,
  "error": "Request failed with status code 404"
}
```

### Reintentos

Los reintentos se loggean con información detallada:

```json
{
  "level": "info",
  "message": "HTTP request retry",
  "retryCount": 2,
  "method": "GET",
  "url": "https://api.example.com/users",
  "status": 500
}
```

## Seguridad

### Sanitización de Headers

Los siguientes headers se redactan automáticamente en logs:
- `authorization`
- `x-api-key`
- `apikey`
- `api-key`
- `x-auth-token`
- `cookie`
- `set-cookie`

**Ejemplo:**
```javascript
// Request con token
await httpClient.get('https://api.example.com/users', {
  headers: {
    'Authorization': 'Bearer secret-token-123',
  },
});

// En logs aparece como:
// "Authorization": "***REDACTED***"
```

## Manejo de Errores

### Estructura del error

Los errores de axios tienen esta estructura:

```javascript
try {
  await httpClient.get('https://api.example.com/users');
} catch (error) {
  console.log(error.response?.status);      // 404
  console.log(error.response?.statusText);  // Not Found
  console.log(error.response?.data);        // { error: 'User not found' }
  console.log(error.message);               // Request failed with status code 404
  console.log(error.code);                  // ERR_BAD_REQUEST
}
```

### Tipos de errores

**Network errors:**
```javascript
error.code === 'ECONNREFUSED'  // Connection refused
error.code === 'ETIMEDOUT'     // Connection timeout
error.code === 'ENOTFOUND'     // DNS lookup failed
```

**Timeout errors:**
```javascript
error.code === 'ECONNABORTED'  // Request timeout
```

**HTTP errors:**
```javascript
error.response?.status === 404  // Not Found
error.response?.status === 500  // Internal Server Error
```

### Ejemplo completo de manejo

```javascript
import httpClient from './shared/utils/http-client.js';
import AppError from './shared/errors/AppError.js';

export const getUserFromAPI = async (userId) => {
  try {
    const response = await httpClient.get(`https://api.example.com/users/${userId}`);
    return response.data;
  } catch (error) {
    // Network error
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new AppError(
        'API service unavailable',
        503,
        'SERVICE_UNAVAILABLE',
        { originalError: error.message }
      );
    }

    // Timeout
    if (error.code === 'ECONNABORTED') {
      throw new AppError(
        'Request timeout',
        504,
        'GATEWAY_TIMEOUT',
        { timeout: error.config?.timeout }
      );
    }

    // HTTP errors
    const status = error.response?.status;

    if (status === 404) {
      throw new AppError(
        'User not found',
        404,
        'USER_NOT_FOUND',
        { userId }
      );
    }

    if (status === 401) {
      throw new AppError(
        'Unauthorized',
        401,
        'UNAUTHORIZED'
      );
    }

    if (status >= 500) {
      // Ya se reintentó automáticamente
      throw new AppError(
        'API server error',
        502,
        'BAD_GATEWAY',
        { status, error: error.message }
      );
    }

    // Other errors
    throw new AppError(
      'Failed to fetch user',
      500,
      'API_ERROR',
      { error: error.message }
    );
  }
};
```

## Interceptors Personalizados

### Agregar interceptor de request

```javascript
httpClient.interceptors.request.use(
  (config) => {
    // Agregar timestamp
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

### Agregar interceptor de response

```javascript
httpClient.interceptors.response.use(
  (response) => {
    // Calcular duración
    const duration = Date.now() - response.config.metadata.startTime;
    console.log(`Request took ${duration}ms`);
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

## Ejemplos de Integración

### GoHighLevel API

```javascript
// src/shared/services/ghl-api.js
import { createHttpClient } from '../utils/http-client.js';

const ghlClient = createHttpClient({
  baseURL: 'https://services.leadconnectorhq.com',
  timeout: 15000,
  headers: {
    'Version': '2021-04-15',
    'Accept': 'application/json',
  },
});

export const getContact = async (contactId, accessToken) => {
  const response = await ghlClient.get(`/contacts/${contactId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return response.data;
};
```

### Evolution API

```javascript
// src/shared/services/evolution-api.js
import { createHttpClient } from '../utils/http-client.js';

const evolutionClient = createHttpClient({
  baseURL: process.env.EVOLUTION_BASE_URL,
  timeout: 30000,
});

export const sendTextMessage = async (instanceName, phone, text, apiKey) => {
  const response = await evolutionClient.post(
    `/message/sendText/${instanceName}`,
    {
      number: phone,
      textMessage: {
        text,
      },
    },
    {
      headers: {
        'apikey': apiKey,
      },
    }
  );

  return response.data;
};
```

### OpenAI API

```javascript
// src/shared/services/openai-api.js
import { createHttpClient } from '../utils/http-client.js';

const openaiClient = createHttpClient({
  baseURL: 'https://api.openai.com/v1',
  timeout: 60000, // Transcription puede tardar
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  },
}, {
  retries: 2, // Menos reintentos para OpenAI
});

export const transcribeAudio = async (audioBuffer) => {
  const formData = new FormData();
  formData.append('file', audioBuffer);
  formData.append('model', 'whisper-1');

  const response = await openaiClient.post('/audio/transcriptions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.text;
};
```

## Performance

### Timeout por tipo de operación

```javascript
// Operaciones rápidas (< 5s)
const fastClient = createHttpClient({ timeout: 5000 });

// Operaciones normales (< 30s)
const normalClient = createHttpClient({ timeout: 30000 });

// Operaciones pesadas (< 60s)
const slowClient = createHttpClient({ timeout: 60000 });
```

### Concurrencia

```javascript
// Ejecutar múltiples requests en paralelo
const [users, posts, comments] = await Promise.all([
  httpClient.get('https://api.example.com/users'),
  httpClient.get('https://api.example.com/posts'),
  httpClient.get('https://api.example.com/comments'),
]);
```

## Testing

### Mock con Jest

```javascript
import httpClient from '../src/shared/utils/http-client.js';
import { jest } from '@jest/globals';

jest.mock('axios');

describe('API Service', () => {
  test('should fetch users', async () => {
    httpClient.get = jest.fn().mockResolvedValue({
      data: [{ id: 1, name: 'John' }],
    });

    const users = await getUsers();
    expect(users).toHaveLength(1);
  });
});
```

### Test de retry

```javascript
describe('HTTP Client Retry', () => {
  test('should retry on 500 error', async () => {
    let attempts = 0;
    httpClient.get = jest.fn(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject({
          response: { status: 500 },
        });
      }
      return Promise.resolve({ data: 'success' });
    });

    const result = await makeRequest();
    expect(attempts).toBe(3); // 1 original + 2 retries
  });
});
```

## Troubleshooting

### Error: Timeout

**Causa:** Request tarda más que el timeout configurado

**Solución:**
```javascript
// Aumentar timeout para este request específico
await httpClient.get('/slow-endpoint', {
  timeout: 60000, // 60 segundos
});
```

### Error: ECONNREFUSED

**Causa:** Servicio no disponible

**Solución:** El cliente reintentará automáticamente. Si sigue fallando, verificar que el servicio esté corriendo.

### Error: Request failed after retries

**Causa:** Servicio sigue retornando 5xx después de todos los reintentos

**Solución:** Verificar estado del servicio externo. Considerar implementar circuit breaker.

### Muchos reintentos (alto tráfico)

**Solución:** Reducir número de reintentos en producción
```javascript
const prodClient = createHttpClient({}, {
  retries: 1, // Solo 1 reintento en prod
});
```

## Mejores Prácticas

### ✅ Hacer

```javascript
// Usar el cliente pre-configurado
import httpClient from './shared/utils/http-client.js';

// Manejar errores apropiadamente
try {
  const data = await httpClient.get(url);
} catch (error) {
  // Manejar error
}

// Usar createHttpClient para APIs específicas
const apiClient = createHttpClient({ baseURL: 'https://api.example.com' });

// Setear timeout apropiado según operación
await httpClient.post('/upload', data, { timeout: 120000 });
```

### ❌ Evitar

```javascript
// NO crear nueva instancia de axios cada vez
import axios from 'axios'; // ❌
const response = await axios.get(url);

// NO ignorar errores
await httpClient.get(url).catch(() => {}); // ❌

// NO usar timeouts muy bajos que causen falsos timeouts
const client = createHttpClient({ timeout: 100 }); // ❌ Muy bajo

// NO loggear tokens manualmente (ya se sanitizan automáticamente)
console.log('Token:', headers.authorization); // ❌
```

## Referencias

- [Axios Documentation](https://axios-http.com/)
- [Axios-Retry Documentation](https://github.com/softonic/axios-retry)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
