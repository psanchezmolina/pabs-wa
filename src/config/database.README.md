# Database Configuration

Módulo para conexión a Supabase con caché inteligente de configuraciones de clientes.

## Características

- ✅ Cliente de Supabase configurado y listo para usar
- ✅ Caché en memoria con TTL de 5 minutos
- ✅ Función helper `getClientConfig()` para obtener configuraciones
- ✅ Funciones de gestión de caché para testing y mantenimiento
- ✅ Logging integrado con Winston
- ✅ Manejo de errores con `DatabaseError`

## Variables de Entorno Requeridas

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx...
```

## Uso Básico

### Importar el cliente de Supabase

```javascript
import { supabase } from './config/database.js';

// Usar el cliente directamente
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .eq('location_id', 'loc_123');
```

### Obtener configuración de cliente (con caché)

```javascript
import { getClientConfig } from './config/database.js';

try {
  // Primera llamada: consulta a base de datos
  const config = await getClientConfig('loc_abc123');
  console.log(config.instance_name); // "cliente-xyz"
  console.log(config.ghl_access_token); // "token..."

  // Segunda llamada (dentro de 5 minutos): retorna del caché
  const cachedConfig = await getClientConfig('loc_abc123');
  // No hace consulta a la base de datos

} catch (error) {
  if (error.code === 'DATABASE_ERROR') {
    console.error('Error de base de datos:', error.message);
  }
}
```

## Estructura de Datos

### Tabla `clients` en Supabase

```javascript
{
  // Identificadores
  location_id: 'loc_abc123',           // GHL location ID (unique)

  // GoHighLevel
  ghl_access_token: 'eyJ...',          // Token de acceso
  ghl_refresh_token: 'eyJ...',         // Token de refresco
  ghl_token_expiry: '2025-11-07T...',  // Fecha de expiración
  conversation_provider_id: 'prov_123', // ID del proveedor de conversaciones

  // Evolution API (WhatsApp)
  instance_name: 'cliente-xyz',         // Nombre de instancia
  instance_apikey: 'api_key_xyz',       // API key de Evolution
  instance_sender: '34684735362@s.whatsapp.net', // Número de WhatsApp

  // Opcional
  openai_apikey: 'sk-...',              // OpenAI key por cliente (opcional)
  webhook_secret: 'secret_xyz'          // Secret para webhooks (opcional)
}
```

## Funciones de Gestión de Caché

### clearCache()

Limpia todo el caché. Útil para testing o forzar recarga de datos.

```javascript
import { clearCache } from './config/database.js';

const cleared = clearCache();
console.log(`Cleared ${cleared} cache entries`);
```

### invalidateCache(locationId)

Invalida el caché de un cliente específico.

```javascript
import { invalidateCache } from './config/database.js';

// Después de actualizar un cliente en la base de datos
await supabase
  .from('clients')
  .update({ instance_name: 'nuevo-nombre' })
  .eq('location_id', 'loc_123');

// Invalidar caché para que la próxima llamada obtenga los nuevos datos
invalidateCache('loc_123');
```

### getCacheStats()

Obtiene estadísticas del caché para monitoreo.

```javascript
import { getCacheStats } from './config/database.js';

const stats = getCacheStats();
console.log(stats);
// {
//   size: 3,
//   ttl: 300000,
//   entries: [
//     { locationId: 'loc_123', age: 120000, valid: true },
//     { locationId: 'loc_456', age: 280000, valid: true },
//     { locationId: 'loc_789', age: 350000, valid: false }
//   ]
// }
```

## Manejo de Errores

### DatabaseError

Todos los errores del módulo lanzan `DatabaseError` con información detallada:

```javascript
import { getClientConfig } from './config/database.js';
import DatabaseError from './shared/errors/DatabaseError.js';

try {
  const config = await getClientConfig('loc_invalid');
} catch (error) {
  if (error instanceof DatabaseError) {
    console.error('Database error:', error.message);
    console.error('Status code:', error.statusCode); // 404 o 500
    console.error('Details:', error.details); // { locationId: 'loc_invalid' }
  }
}
```

### Errores comunes

| Error | Status | Descripción | Solución |
|-------|--------|-------------|----------|
| `Location not found` | 404 | El locationId no existe en la BD | Verificar que el cliente esté registrado |
| `Failed to fetch client config` | 500 | Error de Supabase | Verificar conexión y credenciales |
| `Unexpected database error` | 500 | Error no controlado | Revisar logs para detalles |

## Caché: Comportamiento Detallado

### TTL (Time To Live)

- **Duración:** 5 minutos (300,000 ms)
- **Tipo:** Sliding window (se valida en cada acceso)
- **Limpieza:** Lazy (se elimina cuando se intenta acceder a un entry expirado)

### Flujo de getClientConfig()

```
1. ¿Existe en caché?
   ├─ Sí → ¿Está vigente (< 5 min)?
   │        ├─ Sí → Retornar del caché ✅
   │        └─ No → Eliminar y continuar
   └─ No → Continuar

2. Consultar base de datos
   ├─ Error → Lanzar DatabaseError ❌
   ├─ No encontrado → Lanzar DatabaseError (404) ❌
   └─ Encontrado → Cachear y retornar ✅
```

### Cuándo invalidar el caché

```javascript
// ✅ Después de actualizar un cliente
await supabase.from('clients').update({ ... }).eq('location_id', locationId);
invalidateCache(locationId);

// ✅ Después de eliminar un cliente
await supabase.from('clients').delete().eq('location_id', locationId);
invalidateCache(locationId);

// ✅ En tests (antes de cada test)
beforeEach(() => {
  clearCache();
});

// ❌ NO es necesario invalidar al leer/consultar
const config = await getClientConfig(locationId); // Ya usa caché automáticamente
```

## Integración en Módulos

### Ejemplo en un service

```javascript
// src/modules/ghl-to-wa/ghl-to-wa.service.js
import { getClientConfig } from '../../config/database.js';
import logger from '../../config/logger.js';

export const sendMessageToWhatsApp = async (locationId, phone, message) => {
  try {
    // Obtener configuración (con caché)
    const config = await getClientConfig(locationId);

    // Usar la configuración
    const result = await evolutionAPI.sendText(
      config.instance_name,
      phone,
      message,
      config.instance_apikey
    );

    logger.info('Message sent', { locationId, phone });
    return result;

  } catch (error) {
    if (error.code === 'DATABASE_ERROR' && error.statusCode === 404) {
      logger.error('Client not found', { locationId });
      throw new Error(`Client not configured for location: ${locationId}`);
    }
    throw error;
  }
};
```

### Ejemplo en un middleware

```javascript
// src/middleware/validateClient.js
import { getClientConfig } from '../config/database.js';

export const validateClientMiddleware = async (req, res, next) => {
  const { locationId } = req.body;

  try {
    // Validar que el cliente existe
    const config = await getClientConfig(locationId);

    // Añadir config al request para uso posterior
    req.clientConfig = config;

    next();
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        error: 'Client not found',
        message: `No configuration found for location: ${locationId}`
      });
    }

    return res.status(500).json({
      error: 'Database error',
      message: error.message
    });
  }
};
```

## Testing

### Test unitario con mock

```javascript
// __tests__/database.test.js
import { jest } from '@jest/globals';

// Mock Supabase antes de importar
jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { location_id: 'test', instance_name: 'test' },
            error: null
          }))
        }))
      }))
    }))
  }))
}));

const { getClientConfig, clearCache } = await import('../src/config/database.js');

describe('Database Module', () => {
  beforeEach(() => {
    clearCache();
  });

  test('should fetch client config', async () => {
    const config = await getClientConfig('test_location');
    expect(config.location_id).toBe('test');
  });

  test('should use cache on second call', async () => {
    const config1 = await getClientConfig('test_location');
    const config2 = await getClientConfig('test_location');
    // Segunda llamada debe ser del caché (verificar con spies)
  });
});
```

## Monitoreo en Producción

### Ver logs relacionados con database

```bash
# Ver todas las consultas a database
grep "database" logs/app-2025-11-07.log

# Ver errores de database
grep "DATABASE_ERROR" logs/error-2025-11-07.log

# Ver estadísticas de caché
grep "cache" logs/app-2025-11-07.log | grep -i "size\|hit\|cleared"
```

### Métricas importantes

```javascript
// En un endpoint de health check
app.get('/health/cache', (req, res) => {
  const stats = getCacheStats();
  res.json({
    healthy: true,
    cache: {
      size: stats.size,
      maxTTL: stats.ttl,
      hitRate: calculateHitRate(), // Implementar según necesidad
    }
  });
});
```

## Optimizaciones Futuras

### 1. Pre-warming del caché

```javascript
// Cargar clientes más usados al iniciar
const popularClients = ['loc_1', 'loc_2', 'loc_3'];
await Promise.all(popularClients.map(id => getClientConfig(id)));
```

### 2. Redis para caché distribuido

```javascript
// Para múltiples instancias del servidor
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Reemplazar Map con Redis
// Permite compartir caché entre instancias
```

### 3. Webhooks para invalidación automática

```javascript
// Endpoint para recibir cambios de Supabase
app.post('/webhooks/supabase/clients', (req, res) => {
  const { record, type } = req.body;

  if (type === 'UPDATE' || type === 'DELETE') {
    invalidateCache(record.location_id);
  }

  res.sendStatus(200);
});
```

## Troubleshooting

### "Location not found"
- Verificar que el `location_id` existe en Supabase
- Verificar que no hay typos en el ID
- Revisar logs: `grep "Location not found" logs/error-*.log`

### "Failed to fetch client config"
- Verificar conexión a Supabase
- Verificar que SUPABASE_URL y SUPABASE_KEY son correctos
- Verificar que la tabla `clients` existe

### Caché no se invalida
- Verificar que estás llamando a `invalidateCache(locationId)` después de updates
- Verificar que el locationId es exactamente el mismo (case sensitive)
- Como último recurso: `clearCache()` para limpiar todo

### Alto uso de memoria
- Revisar cuántos entries hay en caché: `getCacheStats().size`
- Si es muy alto (>1000), considerar implementar LRU cache
- Reducir TTL si es necesario
