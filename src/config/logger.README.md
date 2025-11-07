# Logger Configuration

Sistema de logging basado en Winston con rotación diaria de archivos.

## Archivos Generados

### 1. `logs/app-YYYY-MM-DD.log`
Contiene todos los logs de nivel `info` o superior. Incluye:
- Información general de la aplicación
- Requests HTTP
- Operaciones exitosas
- Warnings

### 2. `logs/error-YYYY-MM-DD.log`
Solo errores (`error` level). Incluye:
- Errores de la aplicación
- Fallos de APIs externas
- Errores de base de datos
- Stack traces completos

### 3. `logs/messages-YYYY-MM-DD.log`
Trazabilidad de mensajes de WhatsApp. Incluye:
- Mensajes enviados GHL → WhatsApp
- Mensajes recibidos WhatsApp → GHL
- Estado de entregas
- Metadata de procesamiento

### 4. `logs/exceptions-YYYY-MM-DD.log`
Excepciones no capturadas (uncaught exceptions)

### 5. `logs/rejections-YYYY-MM-DD.log`
Promise rejections no manejadas

## Configuración

- **Rotación:** Diaria (archivos por fecha)
- **Retención:** 14 días (se eliminan automáticamente)
- **Formato:** JSON en producción, colorizado en desarrollo
- **Compresión:** Los archivos antiguos se comprimen (.gz)

## Uso Básico

### Importar el logger

```javascript
import logger from './config/logger.js';
```

### Niveles de log

```javascript
// Debug (solo desarrollo)
logger.debug('Información de debugging', { userId: 123 });

// Info
logger.info('Usuario autenticado correctamente', { locationId: 'abc123' });

// Warning
logger.warn('Token próximo a expirar', { expiresIn: '5 minutes' });

// Error
logger.error('Error al conectar con Supabase', {
  error: err.message,
  stack: err.stack
});
```

### Logger de mensajes WhatsApp

Para tracking específico de mensajes, usar la función `logMessage`:

```javascript
import { logMessage } from './config/logger.js';

// Mensaje GHL → WhatsApp
logMessage({
  direction: 'ghl-to-wa',
  locationId: 'loc_abc123',
  phone: '34633839200@s.whatsapp.net',
  messageType: 'text',
  status: 'sent',
  metadata: {
    instanceName: 'cliente-xyz',
    messageId: 'msg_456',
    delay: 2000
  }
});

// Mensaje WhatsApp → GHL
logMessage({
  direction: 'wa-to-ghl',
  locationId: 'loc_abc123',
  phone: '34633839200@s.whatsapp.net',
  messageType: 'audio',
  status: 'received',
  metadata: {
    transcription: 'audio: Hola, necesito ayuda',
    contactId: 'contact_789',
    conversationId: 'conv_101'
  }
});
```

### Child Logger (contexto compartido)

Útil para añadir contexto a múltiples logs dentro de un módulo:

```javascript
import { createChildLogger } from './config/logger.js';

const moduleLogger = createChildLogger({
  module: 'ghl-to-wa',
  locationId: 'loc_abc123'
});

// Todos los logs incluirán module y locationId automáticamente
moduleLogger.info('Mensaje enviado');
moduleLogger.error('Error al enviar', { error: err.message });
```

## Formato de Salida

### Desarrollo (Console)
```
2025-11-07 10:30:45 [info]: Usuario autenticado correctamente {"locationId":"abc123"}
2025-11-07 10:30:46 [error]: Error al conectar con Supabase {"error":"Connection timeout"}
  at Database.connect (/app/src/db.js:45:12)
  at async main (/app/src/index.js:23:5)
```

### Producción (JSON)
```json
{
  "timestamp": "2025-11-07T10:30:45.123Z",
  "level": "info",
  "message": "Usuario autenticado correctamente",
  "locationId": "abc123"
}
```

## Buenas Prácticas

### ✅ Hacer

```javascript
// Incluir contexto relevante
logger.info('Token renovado', {
  locationId,
  expiresAt: new Date(expiry).toISOString()
});

// Usar niveles apropiados
logger.debug('Configuración cargada', { config }); // Solo desarrollo
logger.info('Servidor iniciado', { port: 3000 }); // Info general
logger.warn('Rate limit cercano', { remaining: 10 }); // Advertencias
logger.error('Fallo crítico', { error: err }); // Errores

// Loggear objetos de error completos
logger.error('Error en webhook GHL', {
  error: err.message,
  stack: err.stack,
  locationId,
  requestBody
});
```

### ❌ Evitar

```javascript
// No loggear información sensible
logger.info('Token obtenido', { token: accessToken }); // ❌

// No usar console.log (no se guarda en archivos)
console.log('Mensaje enviado'); // ❌

// No loggear excesivamente en loops
messages.forEach(msg => {
  logger.info('Procesando mensaje', { msg }); // ❌ Usar debug
});
```

## Integración en Módulos

### Ejemplo en un service

```javascript
// src/modules/ghl-to-wa/ghl-to-wa.service.js
import logger from '../../config/logger.js';
import { logMessage } from '../../config/logger.js';

export const sendMessage = async (locationId, phone, message) => {
  try {
    logger.info('Iniciando envío de mensaje', { locationId, phone });

    const result = await evolutionAPI.sendText(phone, message);

    logMessage({
      direction: 'ghl-to-wa',
      locationId,
      phone,
      messageType: 'text',
      status: 'sent',
      metadata: { messageId: result.key.id }
    });

    logger.info('Mensaje enviado exitosamente', { locationId, messageId: result.key.id });

    return result;
  } catch (error) {
    logger.error('Error al enviar mensaje', {
      error: error.message,
      stack: error.stack,
      locationId,
      phone
    });

    logMessage({
      direction: 'ghl-to-wa',
      locationId,
      phone,
      messageType: 'text',
      status: 'failed',
      metadata: { error: error.message }
    });

    throw error;
  }
};
```

## Monitoreo en Producción

### Ver logs en tiempo real

```bash
# Todos los logs
docker-compose logs -f app

# Solo errores
tail -f logs/error-$(date +%Y-%m-%d).log

# Solo mensajes de WhatsApp
tail -f logs/messages-$(date +%Y-%m-%d).log
```

### Buscar errores específicos

```bash
# Buscar por locationId
grep "loc_abc123" logs/app-2025-11-07.log

# Contar errores del día
grep -c '"level":"error"' logs/error-2025-11-07.log
```

## Variables de Entorno

```bash
# Cambiar nivel de log (default: info en prod, debug en dev)
LOG_LEVEL=debug

# Cambiar ambiente
NODE_ENV=production  # JSON format
NODE_ENV=development # Colorized format
```
