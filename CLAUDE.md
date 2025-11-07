# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Pabs.ai WhatsApp Bridge** - A monolithic modular middleware system that connects GoHighLevel CRM with WhatsApp via Evolution API. Handles bidirectional messaging (GHL ↔ WhatsApp) with multimedia processing (Whisper audio transcription, GPT-4o Vision image descriptions).

**Owner:** Pablo Sánchez (@pabs.ai)
**Stack:** Node.js 20, Express, Supabase (PostgreSQL), Redis, BullMQ
**Deployment:** Docker on Contabo VPS with Easypanel (builds from GitHub)

## Common Commands

### Development
```bash
npm run dev              # Start with nodemon
npm start                # Start server (production)
npm run worker           # Start queue workers (separate process)
```

### Testing
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
```

### Docker
```bash
docker-compose up --build    # Build & start all services
docker-compose logs -f app   # View application logs
docker-compose down          # Stop services
```

## Architecture Overview

### High-Level Request Flow

The system has three main data flows:

1. **GHL → WhatsApp:** `POST /webhook/ghl` → Validate client → Get contact from GHL → Normalize phone → Send via Evolution API → Queue on failure
2. **WhatsApp → GHL:** `POST /webhook/wa` → Process media (transcribe audio/describe images) → Get/create contact in GHL → Upload to conversation
3. **OAuth Setup:** `/auth/ghl/start` → GHL authorization → `/auth/ghl/callback` → Store tokens in Supabase

### Module Structure Pattern

Each feature follows this pattern:
```
src/modules/feature-name/
├── feature-name.routes.js      # Express router
├── feature-name.controller.js  # Request handlers
├── feature-name.service.js     # Business logic
└── feature-name.queue.js       # Queue setup (optional)
```

Main modules:
- `auth/` - GHL OAuth flow
- `ghl-to-wa/` - GHL → WhatsApp messaging
- `wa-to-ghl/` - WhatsApp → GHL messaging with media processing
- `clients/` - Client CRUD (admin)
- `qr-panel/` - QR connection panel

### Database Schema (Supabase)

Single table: `clients`
- **GHL fields:** `location_id` (unique), `ghl_access_token`, `ghl_refresh_token`, `ghl_token_expiry`, `conversation_provider_id`
- **Evolution fields:** `instance_name`, `instance_apikey`, `instance_sender` (format: `34684735362@s.whatsapp.net`)
- **Optional:** `openai_apikey` (per-client override), `webhook_secret`

Indexed on: `location_id`, `instance_name`

### Error Handling Strategy (3 Layers)

1. **Immediate retries:** axios-retry (3 attempts, exponential backoff: 1s, 2s, 4s)
2. **Queue-based retries:** BullMQ processes every 2 minutes, max 10 attempts
3. **Dead Letter Queue:** After 10 failures → DLQ + admin notification

Admin notifications sent via WhatsApp to `ADMIN_PHONE` environment variable.

## Key External Integrations

### GoHighLevel API v2
- Base URL: `https://services.leadconnectorhq.com`
- Auth: OAuth2 Bearer tokens (auto-refresh when expired)
- Headers: `Version: 2021-04-15`, `Accept: application/json`
- Key endpoints: `/contacts/:contactId`, `/conversations/search`, `/conversations/messages/inbound`

### Evolution API
- Base URL: `https://pabs-evolution-api.r4isqy.easypanel.host`
- Auth: `apikey` header
- Endpoints: `/message/sendText/:instanceName`, `/chat/whatsappNumbers/:instanceName`, `/chat/getBase64FromMediaMessage/:instanceName`
- Message delay calculation: `min(max(text.length * 50, 2000), 10000)`

### OpenAI API
- Single global key (per-client override via `openai_apikey` column)
- **Whisper:** Audio transcription (prefix: `audio: [text]`)
- **GPT-4o-mini:** Image description (prefix: `descripcion imagen: [text]`)

## Critical Implementation Details

### Phone Number Normalization
Always convert to WhatsApp format internally:
- Input: `+34633839200`
- Stored/Used: `34633839200@s.whatsapp.net`

### OAuth Token Management
Tokens auto-refresh when `ghl_token_expiry < now()`. This happens transparently in middleware layer - services should never handle token refresh logic directly.

### Message Processing Flow (WhatsApp → GHL)
1. Skip if `fromMe === true`
2. Download media if present
3. Process content:
   - Audio → Whisper → Prefix `audio: `
   - Image → GPT-4o-mini → Prefix `descripcion imagen: `
   - Text → Direct extraction
4. Get/create contact in GHL by phone
5. Get/create conversation in GHL
6. Upload message (queue on failure)

### Client Config Caching
Client configurations are cached for 5 minutes in-memory to reduce DB calls. When modifying client data, be aware cached data may still be in use.

## Code Style Conventions

### General Rules
- **ES Modules only** (`type: "module"` in package.json)
- **Async/await** - no callbacks or promise chains
- **Explicit error handling** - every async function wrapped in try-catch
- **JSDoc comments** for all public functions

### Naming Conventions
- Files: `kebab-case.js`
- Variables/Functions: `camelCase`
- Classes/Errors: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

### Custom Error Pattern
Extend from `shared/errors/AppError.js`:
```javascript
class GHLError extends AppError {
  constructor(message, statusCode = 500, details = {}) {
    super(message, statusCode, 'GHL_ERROR', details);
  }
}
```

### Input Validation
Use Joi schemas for all webhook/API input:
```javascript
const schema = Joi.object({
  locationId: Joi.string().required(),
  message: Joi.string().max(4096)
});
```

## Environment Variables

Critical variables:
```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx...

# Redis (BullMQ)
REDIS_URL=redis://redis:6379

# GHL OAuth
GHL_CLIENT_ID=xxx-xxx-xxx
GHL_CLIENT_SECRET=xxx
GHL_REDIRECT_URI=https://your-domain.com/auth/ghl/callback

# OpenAI
OPENAI_API_KEY=sk-xxx

# Evolution API
EVOLUTION_BASE_URL=https://pabs-evolution-api.r4isqy.easypanel.host

# Admin
ADMIN_PHONE=+34633839200
ADMIN_API_KEY=xxx  # For /api/clients endpoints
```

## Deployment Process

1. Push to GitHub main branch
2. Easypanel auto-builds from Dockerfile
3. Uses docker-compose.yml (includes Redis container)
4. Environment variables configured in Easypanel UI
5. Health check: `GET /health` must return 200

**Important:** Run queue workers as separate process (`npm run worker`)

## Logging Strategy

**Tool:** Winston with daily rotate files

Files:
- `logs/app.log` - All logs (info+)
- `logs/error.log` - Errors only
- `logs/messages.log` - WhatsApp message tracking

Format: JSON in production, colorized console in development

## Common Troubleshooting

### "Location not found"
- Verify `location_id` exists in Supabase `clients` table
- Check Supabase connection string

### "GHL token expired"
- Auto-refresh should handle this automatically
- If persistent, client needs to re-authorize via `/auth/ghl/start?locationId=XXX`

### "Evolution API timeout"
- Check Evolution API status
- Messages should auto-queue for retry
- Verify BullMQ worker process is running (`npm run worker`)

### "WhatsApp number invalid"
- System uses `checkWhatsAppNumber` before sending
- If number has no WhatsApp, note is uploaded to GHL + admin notified

## Key Design Decisions

1. **Monolith over microservices:** Simpler deployment, shared code, single DB pool. Migrate when >10k msg/day.

2. **Single OpenAI key:** Centralized cost tracking, better rate limits. Per-client override available.

3. **BullMQ for queues:** Robust retry logic, Redis-backed, built-in DLQ.

4. **OAuth auto-refresh:** Transparent to services, handled in middleware.

5. **5-minute config cache:** Reduces DB load, acceptable staleness for this use case.

## Adding New Features

### Adding a new webhook action:
1. Create module in `src/modules/new-feature/`
2. Follow pattern: `routes.js` → `controller.js` → `service.js`
3. Add route to `src/routes/index.js`
4. Add Joi validation schema
5. Implement error handling (extend AppError)
6. Add queue if async processing needed
7. Update this CLAUDE.md with new flow

### Adding a new external API:
1. Create service in `src/shared/services/`
2. Configure axios-retry (3 attempts, exponential backoff)
3. Add environment variables for credentials
4. Document in this file's "External Integrations" section
