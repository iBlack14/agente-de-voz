# Plan de Implementación: Dashboard de Consumo (Tokens y Créditos)

El objetivo es proporcionar una vista en tiempo real del uso de recursos (Tokens, Caracteres, Minutos) en todos los servicios de IA y telefonía integrados.

## 1. Expansión del Esquema de Base de Datos
Añadir columnas de seguimiento a la tabla `calls` o crear una nueva tabla `usage_logs`. Utilizaremos una nueva tabla por granularidad.

```sql
CREATE TABLE IF NOT EXISTS usage_logs (
  id BIGSERIAL PRIMARY KEY,
  call_id TEXT REFERENCES calls(call_id) ON DELETE SET NULL,
  service TEXT NOT NULL, -- 'groq', 'deepgram', 'elevenlabs', 'telnyx'
  metric TEXT NOT NULL,  -- 'tokens_in', 'tokens_out', 'characters', 'seconds'
  value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 2. Integración de Lógica de Seguimiento

### Groq (Tokens)
Capturar `usage.prompt_tokens` y `usage.completion_tokens` de la respuesta en `brain.service.js`.

### ElevenLabs (Caracteres)
Registrar el `length` del texto enviado a `textToSpeech` en `tts.service.js`.

### Deepgram (Segundos)
Rastrear la duración de los flujos de audio recibidos o usar la metadata de Deepgram en `stt.service.js`.

### Telnyx (Segundos/Costo)
Actualizar `calls.duration_sec` en el evento `call.hangup` y registrar el uso correspondiente de Telnyx.

## 3. API del Backend
Nuevo endpoint `/api/stats/usage`:
- Agregados diarios/semanales/totales del consumo.
- (Opcional) Estimación de costos basada en precios de proveedores.

## 4. UI del Frontend (Nueva Pestaña "CONSUMO")
- **Tarjetas de Alta Fidelidad**: Contadores dinámicos para Tokens, Caracteres y Minutos.
- **Gráficos**: Uso a lo largo del tiempo (utilizando Chart.js o similar).
- **Desglose por Servicio**: Visualización de dónde se están gastando los recursos.
