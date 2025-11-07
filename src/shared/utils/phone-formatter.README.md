# Phone Formatter

Utilidades para formatear números de teléfono entre formato estándar y formato WhatsApp JID.

## Características

- ✅ Conversión bidireccional entre formatos
- ✅ Validación con regex (E.164)
- ✅ Normalización de números (elimina espacios, guiones, paréntesis)
- ✅ Funciones helper para validación
- ✅ Formato para display (con espacios)
- ✅ 10 funciones utilitarias

## Formatos Soportados

### Formato Estándar (E.164)
```
+34633839200
34633839200
+1 (555) 123-4567
```

### Formato WhatsApp JID
```
34633839200@s.whatsapp.net
15551234567@s.whatsapp.net
```

## Funciones Principales

### toWhatsAppFormat()

Convierte número de teléfono a formato WhatsApp JID.

```javascript
import { toWhatsAppFormat } from './shared/utils/phone-formatter.js';

toWhatsAppFormat('+34633839200');
// '34633839200@s.whatsapp.net'

toWhatsAppFormat('34633839200');
// '34633839200@s.whatsapp.net'

toWhatsAppFormat('+1 (555) 123-4567');
// '15551234567@s.whatsapp.net'
```

**Validación:**
- Remueve caracteres no numéricos
- Valida que tenga 10-15 dígitos
- No permite números que empiecen con 0
- Lanza error si formato inválido

### fromWhatsAppFormat()

Convierte WhatsApp JID a formato estándar con +.

```javascript
import { fromWhatsAppFormat } from './shared/utils/phone-formatter.js';

fromWhatsAppFormat('34633839200@s.whatsapp.net');
// '+34633839200'

fromWhatsAppFormat('15551234567@s.whatsapp.net');
// '+15551234567'
```

**Validación:**
- Verifica formato `{digits}@s.whatsapp.net`
- Valida que digits tenga 10-15 dígitos
- Lanza error si formato inválido

## Funciones de Normalización

### normalizePhone()

Normaliza número eliminando caracteres especiales.

```javascript
import { normalizePhone } from './shared/utils/phone-formatter.js';

normalizePhone('+1 (555) 123-4567');
// '+15551234567'

normalizePhone('34 633 83 92 00');
// '34633839200'

normalizePhone('+34-633-839-200');
// '+34633839200'
```

**Comportamiento:**
- Remueve espacios, guiones, paréntesis
- Preserva el + inicial si existe
- Solo mantiene dígitos

## Funciones de Validación

### isValidPhone()

Valida si un número es válido según E.164.

```javascript
import { isValidPhone } from './shared/utils/phone-formatter.js';

isValidPhone('+34633839200');    // true
isValidPhone('34633839200');     // true
isValidPhone('+1234');           // false (muy corto)
isValidPhone('0123456789');      // false (empieza con 0)
```

**Reglas:**
- 10-15 dígitos
- No empieza con 0
- Puede tener + opcional al inicio

### isValidWhatsAppJID()

Valida si una cadena es un JID válido de WhatsApp.

```javascript
import { isValidWhatsAppJID } from './shared/utils/phone-formatter.js';

isValidWhatsAppJID('34633839200@s.whatsapp.net');  // true
isValidWhatsAppJID('15551234567@s.whatsapp.net');  // true
isValidWhatsAppJID('34633839200');                 // false
isValidWhatsAppJID('invalid@whatsapp.net');        // false
```

**Reglas:**
- Formato: `{digits}@s.whatsapp.net`
- Digits debe tener 10-15 dígitos
- No empieza con 0

## Funciones Helper

### extractPhoneFromJID()

Extrae el número de teléfono de un JID (sin validación estricta).

```javascript
import { extractPhoneFromJID } from './shared/utils/phone-formatter.js';

extractPhoneFromJID('34633839200@s.whatsapp.net');
// '34633839200'

extractPhoneFromJID('invalid-jid');
// null
```

### isWhatsAppFormat()

Verifica si un valor ya está en formato WhatsApp.

```javascript
import { isWhatsAppFormat } from './shared/utils/phone-formatter.js';

isWhatsAppFormat('34633839200@s.whatsapp.net');  // true
isWhatsAppFormat('+34633839200');                // false
```

### ensureWhatsAppFormat()

Asegura que un valor esté en formato WhatsApp.

```javascript
import { ensureWhatsAppFormat } from './shared/utils/phone-formatter.js';

// Si es teléfono, convierte
ensureWhatsAppFormat('+34633839200');
// '34633839200@s.whatsapp.net'

// Si ya es WhatsApp, retorna como está
ensureWhatsAppFormat('34633839200@s.whatsapp.net');
// '34633839200@s.whatsapp.net'
```

### ensurePhoneFormat()

Asegura que un valor esté en formato teléfono estándar.

```javascript
import { ensurePhoneFormat } from './shared/utils/phone-formatter.js';

// Si es WhatsApp, convierte
ensurePhoneFormat('34633839200@s.whatsapp.net');
// '+34633839200'

// Si es teléfono, normaliza y agrega +
ensurePhoneFormat('34633839200');
// '+34633839200'

// Si ya tiene +, lo mantiene
ensurePhoneFormat('+34633839200');
// '+34633839200'
```

### formatPhoneDisplay()

Formatea número para display (con espacios).

```javascript
import { formatPhoneDisplay } from './shared/utils/phone-formatter.js';

// Internacional (default)
formatPhoneDisplay('+34633839200');
// '+346 338 392 00'

// Desde WhatsApp JID
formatPhoneDisplay('34633839200@s.whatsapp.net');
// '+346 338 392 00'

// Nacional (sin +)
formatPhoneDisplay('+34633839200', { style: 'national' });
// '346 338 392 00'
```

## Ejemplos de Integración

### En un Service (GHL to WA)

```javascript
// src/modules/ghl-to-wa/ghl-to-wa.service.js
import { toWhatsAppFormat, isValidPhone } from '../../shared/utils/phone-formatter.js';
import logger from '../../config/logger.js';

export const sendMessage = async (phone, message) => {
  // Validar teléfono
  if (!isValidPhone(phone)) {
    throw new Error(`Invalid phone number: ${phone}`);
  }

  // Convertir a formato WhatsApp
  const whatsappPhone = toWhatsAppFormat(phone);

  logger.info('Sending message', {
    originalPhone: phone,
    whatsappPhone,
  });

  // Enviar a Evolution API
  const result = await evolutionAPI.sendText(whatsappPhone, message);

  return result;
};
```

### En un Webhook (WA to GHL)

```javascript
// src/modules/wa-to-ghl/wa-to-ghl.controller.js
import { fromWhatsAppFormat, isValidWhatsAppJID } from '../../shared/utils/phone-formatter.js';

export const handleWhatsAppWebhook = async (req, res) => {
  const { key, message } = req.body;
  const { remoteJid } = key;

  // Validar JID
  if (!isValidWhatsAppJID(remoteJid)) {
    return res.status(400).json({
      error: 'Invalid WhatsApp JID',
    });
  }

  // Convertir a formato teléfono
  const phone = fromWhatsAppFormat(remoteJid);

  // Buscar contacto en GHL por teléfono
  const contact = await ghlAPI.findContactByPhone(phone);

  // ...proceso del mensaje...

  res.json({ success: true });
};
```

### Normalizar antes de guardar en DB

```javascript
// src/modules/clients/clients.service.js
import { ensureWhatsAppFormat, ensurePhoneFormat } from '../../shared/utils/phone-formatter.js';

export const createClient = async (data) => {
  // Asegurar que phone esté en formato WhatsApp para guardar
  const instanceSender = ensureWhatsAppFormat(data.phone);

  const client = await supabase.from('clients').insert({
    location_id: data.locationId,
    instance_sender: instanceSender, // Guardado como WhatsApp JID
    // ...otros campos
  });

  return client;
};

export const getClientPhone = async (locationId) => {
  const { data } = await supabase
    .from('clients')
    .select('instance_sender')
    .eq('location_id', locationId)
    .single();

  // Convertir a formato display para mostrar al usuario
  return formatPhoneDisplay(data.instance_sender);
};
```

### Validación en Schema de Joi

```javascript
// src/modules/ghl-to-wa/ghl-to-wa.validation.js
import Joi from 'joi';
import { isValidPhone } from '../../shared/utils/phone-formatter.js';

export const sendMessageSchema = Joi.object({
  phone: Joi.string()
    .custom((value, helpers) => {
      if (!isValidPhone(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .required()
    .messages({
      'any.invalid': 'Phone number must be in valid E.164 format (10-15 digits)',
    }),
  message: Joi.string().min(1).max(4096).required(),
});
```

### En Middleware de Validación

```javascript
// src/shared/middleware/phone-validator.js
import { isValidPhone, toWhatsAppFormat } from '../utils/phone-formatter.js';

export const validateAndConvertPhone = (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      error: 'Phone number is required',
    });
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({
      error: 'Invalid phone number format',
      details: 'Phone must be 10-15 digits with optional + prefix',
    });
  }

  // Convertir y agregar al request
  req.whatsappPhone = toWhatsAppFormat(phone);
  req.normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;

  next();
};
```

## Casos de Uso Comunes

### Caso 1: Recibir de GHL, enviar a WhatsApp

```javascript
// GHL webhook envía: +34633839200
const ghlPhone = req.body.phone;

// Convertir a WhatsApp
const waPhone = toWhatsAppFormat(ghlPhone);
// '34633839200@s.whatsapp.net'

// Enviar a Evolution API
await evolutionAPI.sendText(waPhone, message);
```

### Caso 2: Recibir de WhatsApp, buscar en GHL

```javascript
// WhatsApp envía: 34633839200@s.whatsapp.net
const waJID = req.body.key.remoteJid;

// Convertir a formato estándar
const phone = fromWhatsAppFormat(waJID);
// '+34633839200'

// Buscar en GHL
const contact = await ghlAPI.findContactByPhone(phone);
```

### Caso 3: Guardar en DB en formato consistente

```javascript
// Usuario puede enviar cualquier formato
const userInput = req.body.phone; // '+34 633 83 92 00'

// Normalizar y validar
if (!isValidPhone(userInput)) {
  throw new Error('Invalid phone');
}

// Guardar siempre en formato WhatsApp
const dbPhone = ensureWhatsAppFormat(userInput);
// '34633839200@s.whatsapp.net'

await db.clients.update({ instance_sender: dbPhone });
```

### Caso 4: Mostrar en UI

```javascript
// Desde DB: '34633839200@s.whatsapp.net'
const dbPhone = client.instance_sender;

// Formatear para display
const displayPhone = formatPhoneDisplay(dbPhone);
// '+346 338 392 00'

res.json({
  client: {
    ...client,
    phoneDisplay: displayPhone,
  },
});
```

## Manejo de Errores

### Errores comunes

```javascript
try {
  const waPhone = toWhatsAppFormat('+123'); // Muy corto
} catch (error) {
  // Error: Invalid phone number format: +123. Expected 10-15 digits with optional leading +
}

try {
  const waPhone = toWhatsAppFormat('0123456789'); // Empieza con 0
} catch (error) {
  // Error: Invalid phone number format: 0123456789. Expected 10-15 digits with optional leading +
}

try {
  const phone = fromWhatsAppFormat('invalid'); // No es JID
} catch (error) {
  // Error: Invalid WhatsApp JID format: invalid. Expected format: {digits}@s.whatsapp.net
}
```

### Validación segura

```javascript
// Opción 1: Try-catch
try {
  const waPhone = toWhatsAppFormat(userInput);
  // Usar waPhone...
} catch (error) {
  logger.error('Invalid phone format', { userInput, error: error.message });
  throw new AppError('Invalid phone number', 400, 'INVALID_PHONE');
}

// Opción 2: Validar primero
if (!isValidPhone(userInput)) {
  throw new AppError('Invalid phone number', 400, 'INVALID_PHONE');
}

const waPhone = toWhatsAppFormat(userInput);
// Ya sabemos que es válido
```

## Validación de Formatos

### Regex utilizadas

```javascript
// Teléfono válido (E.164)
/^\+?[1-9]\d{9,14}$/

// WhatsApp JID válido
/^[1-9]\d{9,14}@s\.whatsapp\.net$/

// Solo dígitos
/^\d+$/
```

### Reglas de validación

**Número de teléfono:**
- 10-15 dígitos
- Puede empezar con + (opcional)
- No empieza con 0
- Sin espacios, guiones, paréntesis (se normalizan automáticamente)

**WhatsApp JID:**
- Formato: `{digits}@s.whatsapp.net`
- Digits: 10-15 dígitos
- No empieza con 0
- Sufijo debe ser exactamente `@s.whatsapp.net`

## Testing

### Unit Tests con Jest

```javascript
import {
  toWhatsAppFormat,
  fromWhatsAppFormat,
  isValidPhone,
} from '../src/shared/utils/phone-formatter.js';

describe('Phone Formatter', () => {
  describe('toWhatsAppFormat', () => {
    test('converts standard phone to WhatsApp format', () => {
      expect(toWhatsAppFormat('+34633839200')).toBe('34633839200@s.whatsapp.net');
    });

    test('removes spaces and dashes', () => {
      expect(toWhatsAppFormat('+1 (555) 123-4567')).toBe('15551234567@s.whatsapp.net');
    });

    test('throws on invalid phone', () => {
      expect(() => toWhatsAppFormat('123')).toThrow('Invalid phone number');
    });
  });

  describe('fromWhatsAppFormat', () => {
    test('converts WhatsApp JID to phone', () => {
      expect(fromWhatsAppFormat('34633839200@s.whatsapp.net')).toBe('+34633839200');
    });

    test('throws on invalid JID', () => {
      expect(() => fromWhatsAppFormat('invalid')).toThrow('Invalid WhatsApp JID');
    });
  });

  describe('isValidPhone', () => {
    test('validates correct phones', () => {
      expect(isValidPhone('+34633839200')).toBe(true);
      expect(isValidPhone('34633839200')).toBe(true);
    });

    test('rejects invalid phones', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('0123456789')).toBe(false);
    });
  });
});
```

## Performance

Todas las funciones son síncronas y muy rápidas:
- Operaciones de regex: < 0.1ms
- Normalización: < 0.1ms
- Conversión: < 0.1ms

No hay I/O ni operaciones asíncronas.

## Troubleshooting

### Error: "Invalid phone number format"

**Causa:** Número no cumple con E.164 (10-15 dígitos, no empieza con 0)

**Solución:**
```javascript
// Verificar el número
console.log(normalizePhone(phone)); // Ver formato normalizado

// Validar antes de convertir
if (!isValidPhone(phone)) {
  console.log('Invalid:', phone);
}
```

### Error: "Invalid WhatsApp JID format"

**Causa:** JID no tiene formato correcto

**Solución:**
```javascript
// Verificar el JID
console.log(isValidWhatsAppJID(jid)); // false

// Debe ser exactamente: {digits}@s.whatsapp.net
// Correcto: 34633839200@s.whatsapp.net
// Incorrecto: 34633839200@whatsapp.net
```

### Números internacionales

```javascript
// Asegurarse de incluir código de país
toWhatsAppFormat('+1555123456'); // USA
toWhatsAppFormat('+34633839200'); // España
toWhatsAppFormat('+44207123456'); // UK

// NO omitir el código de país
toWhatsAppFormat('633839200'); // ❌ Inválido
toWhatsAppFormat('+34633839200'); // ✅ Correcto
```

## Mejores Prácticas

### ✅ Hacer

```javascript
// Validar antes de usar
if (isValidPhone(phone)) {
  const waPhone = toWhatsAppFormat(phone);
}

// Normalizar input del usuario
const normalized = normalizePhone(userInput);

// Usar ensure* para conversión segura
const waPhone = ensureWhatsAppFormat(phoneOrJID);

// Guardar en formato consistente (WhatsApp en DB)
await db.save({ phone: toWhatsAppFormat(phone) });
```

### ❌ Evitar

```javascript
// NO asumir formato sin validar
const waPhone = phone + '@s.whatsapp.net'; // ❌

// NO olvidar código de país
toWhatsAppFormat('633839200'); // ❌ Falta +34

// NO guardar en formatos mixtos
// Elegir uno (preferiblemente WhatsApp para este proyecto)

// NO ignorar errores de validación
try {
  toWhatsAppFormat(phone);
} catch (e) {} // ❌ No ignorar
```

## Referencias

- [E.164 Format](https://en.wikipedia.org/wiki/E.164)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Evolution API Documentation](https://doc.evolution-api.com/)
