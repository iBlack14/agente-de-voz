# ViaAI Voice Assistant

Asistente de voz para automatizar llamadas telefónicas con IA, incluyendo:

- llamadas salientes y entrantes por Telnyx
- transcripción en tiempo real con Deepgram
- razonamiento conversacional con Groq (LLM)
- síntesis de voz con ElevenLabs
- dashboard web para campañas, recordatorios, historial, consumo y monitoreo en vivo

## Para qué sirve

Este proyecto está pensado para equipos que necesitan hacer o recibir llamadas automatizadas y:

- ejecutar campañas de llamadas masivas
- enviar recordatorios programados con reintentos
- personalizar guiones (prompts) desde una interfaz web
- guardar historial, transcripciones y grabaciones
- monitorear conversaciones activas en tiempo real
- medir consumo por proveedor (tokens, segundos, caracteres)

## Stack

- Node.js + Express
- PostgreSQL
- WebSocket (`/neural-stream` y `/live-monitor`)
- Telnyx, Deepgram, Groq, ElevenLabs

## Requisitos

- Node.js 20+ (recomendado)
- PostgreSQL 14+ (o compatible)
- cuenta/API keys de Telnyx, Deepgram, Groq y ElevenLabs

## Variables de entorno

Crear archivo `.env` en la raíz del proyecto con esta base:

```env
TELNYX_API_KEY=
TELNYX_PHONE_NUMBER=
TELNYX_CONNECTION_ID=
TELNYX_PUBLIC_KEY=
ENFORCE_TELNYX_SIGNATURE=true
WS_URL=

DEEPGRAM_API_KEY=
GROQ_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
LLM_MODEL=llama-3.1-8b-instant

DATABASE_URL=
PGSSL=false

ADMIN_USER=
ADMIN_PASS=
PORT=3000
MAX_CONCURRENT_CALLS=2
```

Notas:

- `WS_URL` debe apuntar al WebSocket público del servidor: `wss://tu-dominio/neural-stream`
- si usas webhook firmado de Telnyx, define `TELNYX_PUBLIC_KEY` y deja `ENFORCE_TELNYX_SIGNATURE=true`
- `DATABASE_URL` ejemplo local: `postgresql://usuario:password@localhost:5432/viaai`

## Levantamiento local (paso a paso)

1. Instalar dependencias:

```bash
npm install
```

2. Configurar PostgreSQL y crear una base de datos.

3. Configurar `.env` con tus credenciales.

4. Iniciar servidor:

```bash
npm run dev
```

o en modo producción:

```bash
npm start
```

5. Verificar salud:

```bash
http://localhost:3000/health
```

6. Abrir login del dashboard:

```bash
http://localhost:3000/login.html
```

## Endpoints principales

- `GET /health`: estado de API + base de datos
- `POST /webhook/telnyx`: webhook de eventos Telnyx
- `GET /api/calls`: historial de llamadas
- `POST /api/make-call`: crear llamada inmediata o programada
- `GET /api/prompts`: listar prompts de identidad
- `GET /api/reminders`: listar prompts de recordatorio
- `GET /api/stats`: métricas de consumo
- `POST /api/tts-preview`: previsualización de voz
- `GET /api/active-calls`: llamadas activas para monitor

## Flujo general

1. Telnyx inicia/contesta llamada y envía eventos al webhook.
2. El servidor abre sesión por WebSocket.
3. Audio entrante -> Deepgram (STT).
4. Texto -> Groq (respuesta IA).
5. Respuesta -> ElevenLabs (TTS).
6. Audio de vuelta a la llamada por Telnyx.
7. Se guardan estado, transcript, grabación y consumo en PostgreSQL.
8. Dashboard puede ver actividad en vivo y métricas.

## Docker (opcional)

Construir imagen:

```bash
docker build -t viaai-voice .
```

Ejecutar:

```bash
docker run --env-file .env -p 3121:3121 -e PORT=3121 viaai-voice
```

Luego abrir:

```bash
http://localhost:3121/login.html
```

## Estructura del proyecto

```text
.
├─ server.js
├─ schema.sql
├─ routes/
├─ services/
│  ├─ ai/
│  ├─ db/
│  ├─ telephony/
│  └─ voice/
├─ middleware/
├─ public/
└─ docs/
```

## Operación recomendada

- mantener `MAX_CONCURRENT_CALLS` bajo (ej. 2) para evitar saturación del canal de salida
- exponer una URL pública HTTPS/WSS para webhook y media stream
- revisar periódicamente tabla `scheduled_calls` y `usage_logs`
- usar `ADMIN_USER`/`ADMIN_PASS` robustos en producción
