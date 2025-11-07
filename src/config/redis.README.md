# Redis Configuration

Módulo de configuración de Redis usando ioredis con reconexión automática, event handlers y funciones de utilidad.

## Características

- ✅ Cliente de ioredis configurado para BullMQ
- ✅ Reconexión automática con estrategia exponencial
- ✅ Event handlers completos (connect, ready, error, close, etc.)
- ✅ Función `getRedisClient()` para uso en queues
- ✅ Funciones de utilidad: status, ping, info
- ✅ Graceful shutdown handling
- ✅ Logging integrado con Winston
- ✅ Seguridad: oculta credenciales en logs

## Variables de Entorno

```bash
REDIS_URL=redis://redis:6379
# O con autenticación:
# REDIS_URL=redis://username:password@host:port
```

## Uso Básico

### Importar el cliente de Redis

```javascript
import redisClient from './config/redis.js';

// Usar el cliente directamente
await redisClient.set('key', 'value');
const value = await redisClient.get('key');
```

### Usar con BullMQ (RECOMENDADO)

```javascript
import { getRedisClient } from './config/redis.js';
import { Queue, Worker } from 'bullmq';

// Crear una queue
const myQueue = new Queue('my-queue', {
  connection: getRedisClient()
});

// Crear un worker
const worker = new Worker('my-queue', async (job) => {
  console.log('Processing job:', job.data);
}, {
  connection: getRedisClient()
});

// Añadir un job
await myQueue.add('job-name', { data: 'example' });
```

## Configuración del Cliente

### Opciones de ioredis

```javascript
{
  maxRetriesPerRequest: null,  // Requerido por BullMQ
  enableReadyCheck: true,      // Verifica que Redis esté listo
  retryStrategy: (times) => {
    // Estrategia exponencial: 50ms, 100ms, 150ms... hasta 2s
    return Math.min(times * 50, 2000);
  },
  reconnectOnError: (err) => {
    // Reconecta automáticamente en modo READONLY
    if (err.message.includes('READONLY')) {
      return true;
    }
    return false;
  }
}
```

## Event Handlers

El módulo gestiona automáticamente todos los eventos de Redis:

### connect
Disparado cuando se establece la conexión (pero no está listo para comandos)

```javascript
// Logs automáticos:
// [info] Redis connection established { url: 'redis://redis:6379', status: 'connecting' }
```

### ready
Disparado cuando Redis está listo para recibir comandos

```javascript
// Logs automáticos:
// [info] Redis client ready { url: 'redis://redis:6379', status: 'ready' }
```

### error
Disparado cuando ocurre un error

```javascript
// Logs automáticos:
// [error] Redis error { error: 'Connection timeout', code: 'ETIMEDOUT', stack: '...' }
```

### close
Disparado cuando se cierra la conexión

```javascript
// Logs automáticos:
// [warn] Redis connection closed
```

### reconnecting
Disparado cuando el cliente intenta reconectar

```javascript
// Logs automáticos:
// [info] Redis reconnecting { attempt: 1, status: 'reconnecting' }
```

### end
Disparado cuando la conexión termina definitivamente

```javascript
// Logs automáticos:
// [error] Redis connection ended { status: 'disconnected' }
```

## Funciones de Utilidad

### getRedisClient()

Obtiene la instancia del cliente Redis. Usar en BullMQ.

```javascript
import { getRedisClient } from './config/redis.js';

const client = getRedisClient();
```

### isRedisConnected()

Verifica si hay conexión establecida.

```javascript
import { isRedisConnected } from './config/redis.js';

if (isRedisConnected()) {
  console.log('Redis está conectado');
}
```

### isRedisReady()

Verifica si Redis está listo para recibir comandos.

```javascript
import { isRedisReady } from './config/redis.js';

if (isRedisReady()) {
  console.log('Redis está listo');
}
```

### getRedisStatus()

Obtiene el estado completo de la conexión.

```javascript
import { getRedisStatus } from './config/redis.js';

const status = getRedisStatus();
console.log(status);
// {
//   connected: true,
//   ready: true,
//   status: 'ready',
//   url: 'redis://redis:6379'
// }
```

### pingRedis()

Hace ping a Redis para verificar conectividad.

```javascript
import { pingRedis } from './config/redis.js';

try {
  const result = await pingRedis(); // 'PONG'
  console.log('Redis responde:', result);
} catch (error) {
  console.error('Redis no responde:', error.message);
}
```

### getRedisInfo()

Obtiene información del servidor Redis.

```javascript
import { getRedisInfo } from './config/redis.js';

const info = await getRedisInfo();
console.log(info.redis_version); // '7.0.0'
console.log(info.used_memory_human); // '1.5M'
console.log(info.connected_clients); // '2'
```

### closeRedis()

Cierra la conexión gracefully.

```javascript
import { closeRedis } from './config/redis.js';

await closeRedis();
console.log('Redis desconectado');
```

## Graceful Shutdown

El módulo maneja automáticamente las señales de terminación:

```javascript
// Automático en SIGTERM y SIGINT
process.on('SIGTERM', () => {
  // Cierra Redis automáticamente
});

process.on('SIGINT', () => {
  // Cierra Redis automáticamente
});
```

## Seguridad

### Credenciales en Logs

Las contraseñas se ocultan automáticamente en los logs:

```javascript
// URL real: redis://user:password123@host:6379
// En logs:   redis://user:***@host:6379
```

### Conexión Segura (TLS)

Para conexiones con TLS (Redis Cloud, etc.):

```bash
REDIS_URL=rediss://username:password@host:port
# Nota: 'rediss://' con doble 's' para TLS
```

## Integración en Módulos

### Ejemplo: Crear un Queue

```javascript
// src/modules/ghl-to-wa/ghl-to-wa.queue.js
import { Queue } from 'bullmq';
import { getRedisClient } from '../../config/redis.js';
import logger from '../../config/logger.js';

export const messageQueue = new Queue('ghl-to-wa-messages', {
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 10,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
      age: 3600, // 1 hour
    },
    removeOnFail: {
      count: 500,
    },
  },
});

messageQueue.on('error', (error) => {
  logger.error('Message queue error', { error: error.message });
});

logger.info('Message queue initialized');
```

### Ejemplo: Crear un Worker

```javascript
// src/queues/worker.js
import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import logger from '../config/logger.js';

const worker = new Worker('ghl-to-wa-messages', async (job) => {
  logger.info('Processing job', { jobId: job.id, data: job.data });

  try {
    // Procesar el job
    await processMessage(job.data);

    logger.info('Job completed', { jobId: job.id });
  } catch (error) {
    logger.error('Job failed', {
      jobId: job.id,
      error: error.message,
      stack: error.stack,
    });
    throw error; // BullMQ reintentará automáticamente
  }
}, {
  connection: getRedisClient(),
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000, // 10 jobs por segundo
  },
});

worker.on('completed', (job) => {
  logger.info('Worker completed job', { jobId: job.id });
});

worker.on('failed', (job, err) => {
  logger.error('Worker failed job', {
    jobId: job.id,
    error: err.message,
  });
});

logger.info('Worker started');
```

### Ejemplo: Health Check Endpoint

```javascript
// src/routes/health.js
import express from 'express';
import { getRedisStatus, pingRedis } from '../config/redis.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    const redisStatus = getRedisStatus();
    const ping = await pingRedis();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      redis: {
        ...redisStatus,
        ping,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      redis: {
        error: error.message,
      },
    });
  }
});

export default router;
```

## Testing

### Test con Redis Mock

```javascript
// __tests__/redis.test.js
import { jest } from '@jest/globals';

// Mock ioredis
jest.unstable_mockModule('ioredis', () => ({
  default: class MockRedis {
    constructor() {
      this.data = new Map();
    }
    async set(key, value) {
      this.data.set(key, value);
      return 'OK';
    }
    async get(key) {
      return this.data.get(key);
    }
    async ping() {
      return 'PONG';
    }
    on() {}
    quit() {}
  }
}));

const { getRedisClient, pingRedis } = await import('../src/config/redis.js');

describe('Redis Module', () => {
  test('should get Redis client', () => {
    const client = getRedisClient();
    expect(client).toBeDefined();
  });

  test('should ping Redis', async () => {
    const result = await pingRedis();
    expect(result).toBe('PONG');
  });
});
```

### Test en Docker

```bash
# Iniciar Redis en Docker
docker run -d --name redis-test -p 6379:6379 redis:7-alpine

# Configurar .env
echo "REDIS_URL=redis://localhost:6379" > .env.test

# Ejecutar tests
npm test

# Limpiar
docker stop redis-test && docker rm redis-test
```

## Monitoreo en Producción

### Ver logs de Redis

```bash
# Logs de conexión
grep "Redis" logs/app-2025-11-07.log

# Errores de Redis
grep "Redis error" logs/error-2025-11-07.log

# Reconexiones
grep "reconnecting" logs/app-2025-11-07.log
```

### Métricas de Redis

```javascript
import { getRedisInfo } from './config/redis.js';

const info = await getRedisInfo();

console.log('Memoria usada:', info.used_memory_human);
console.log('Clientes conectados:', info.connected_clients);
console.log('Total de comandos:', info.total_commands_processed);
console.log('Uptime:', info.uptime_in_seconds);
console.log('Hit rate:',
  info.keyspace_hits / (info.keyspace_hits + info.keyspace_misses)
);
```

### Dashboard de BullMQ

```bash
# Instalar Bull Board (UI para queues)
npm install @bull-board/express @bull-board/api @bull-board/ui

# Configurar en tu app
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(messageQueue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

## Troubleshooting

### Error: "ECONNREFUSED"

**Causa:** Redis no está corriendo o la URL es incorrecta.

**Solución:**
```bash
# Verificar que Redis esté corriendo
docker ps | grep redis

# O iniciar Redis
docker-compose up -d redis

# Verificar la URL en .env
echo $REDIS_URL
```

### Error: "READONLY You can't write against a read only replica"

**Causa:** Redis está en modo réplica de solo lectura.

**Solución:** El módulo automáticamente reconecta. Si persiste, verificar la configuración del cluster.

### Error: "Too many connections"

**Causa:** Se están creando múltiples conexiones a Redis.

**Solución:** Usar siempre `getRedisClient()` en lugar de crear nuevas instancias:

```javascript
// ❌ MAL: Crea múltiples conexiones
import Redis from 'ioredis';
const client = new Redis(url); // Nueva conexión

// ✅ BIEN: Reutiliza la conexión existente
import { getRedisClient } from './config/redis.js';
const client = getRedisClient(); // Conexión compartida
```

### Reconexión lenta

**Causa:** Estrategia de retry exponencial.

**Solución:** Verificar que Redis esté disponible. La estrategia aumenta el delay progresivamente:
- Intento 1: 50ms
- Intento 2: 100ms
- Intento 3: 150ms
- ...
- Intento 40+: 2000ms (máximo)

### Memoria alta en Redis

```bash
# Ver estadísticas de memoria
redis-cli INFO memory

# Limpiar datos expirados
redis-cli --scan --pattern '*' | xargs redis-cli DEL

# O configurar maxmemory y eviction policy
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## Configuración Avanzada

### Cluster de Redis

```javascript
import { Cluster } from 'ioredis';

const cluster = new Cluster([
  { host: 'redis-node-1', port: 6379 },
  { host: 'redis-node-2', port: 6379 },
  { host: 'redis-node-3', port: 6379 },
], {
  maxRetriesPerRequest: null,
});
```

### Redis Sentinel (Alta Disponibilidad)

```javascript
const sentinel = new Redis({
  sentinels: [
    { host: 'sentinel-1', port: 26379 },
    { host: 'sentinel-2', port: 26379 },
    { host: 'sentinel-3', port: 26379 },
  ],
  name: 'mymaster',
  maxRetriesPerRequest: null,
});
```

### Pipelines (Batch Operations)

```javascript
const pipeline = client.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.get('key1');
const results = await pipeline.exec();
```

## Mejores Prácticas

### ✅ Hacer

```javascript
// Usar getRedisClient() para BullMQ
const queue = new Queue('my-queue', {
  connection: getRedisClient()
});

// Verificar estado antes de operaciones críticas
if (isRedisReady()) {
  await client.set('key', 'value');
}

// Usar pipelines para múltiples operaciones
const pipeline = client.pipeline();
pipeline.set('key1', 'val1');
pipeline.set('key2', 'val2');
await pipeline.exec();

// Setear TTL en datos temporales
await client.set('session:123', data, 'EX', 3600); // Expira en 1h
```

### ❌ Evitar

```javascript
// NO crear múltiples clientes
const client1 = new Redis(url); // ❌
const client2 = new Redis(url); // ❌

// NO ignorar errores de conexión
client.get('key'); // ❌ Sin await ni error handling

// NO guardar datos sensibles sin encriptar
await client.set('password', plainPassword); // ❌

// NO usar keys con wildcards en producción
await client.keys('*'); // ❌ Bloquea Redis
// Usar SCAN en su lugar
```

## Referencias

- [ioredis Documentation](https://github.com/luin/ioredis)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Commands](https://redis.io/commands)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
