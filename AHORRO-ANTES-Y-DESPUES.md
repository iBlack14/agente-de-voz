# Antes y Después: Ahorro de Llamadas

## Antes

- Un lote de renovaciones podía salir con `3` corridas por defecto.
- El mismo número podía entrar varias veces en distintos lotes sin freno reciente.
- Las llamadas salientes podían verse como `answered` demasiado pronto.
- Un buzón o casilla podía terminar consumiendo como si fuera una entrega válida.
- Los recordatorios seguían usando grabación y STT aunque no hacía falta.
- Los recordatorios podían timbrar hasta `60s`.
- El sistema no tenía una ventana dura para bloquear llamadas nocturnas en Perú.
- Si Telnyx bloqueaba la cuenta (`D17`), el scheduler podía seguir intentando.

## Después

- Los lotes quedan capados a `1` corrida efectiva por defecto.
- Un número no vuelve a llamarse dentro de `24h`.
- Los números se normalizan y se deduplican antes de programarse.
- `call.initiated` ya no cuenta como llamada contestada; solo `call.answered`.
- Los recordatorios activan AMD de Telnyx.
- Si Telnyx detecta `machine`, `fax_detected` o `silence`, la llamada se corta y queda como `voicemail`.
- `voicemail` ahora cuenta como no contestada en dashboard y lógica de reintentos.
- Los recordatorios ya no usan STT por defecto.
- Los recordatorios ya no se graban por defecto.
- Los recordatorios timbran `25s` en vez de `60s`.
- Después de las `10:00 p. m.` hora Perú no se llama.
- Si una tarea cae fuera de horario, se mueve sola al siguiente horario permitido.
- Si Telnyx devuelve `D17`, el scheduler se pausa y deja de empujar llamadas.
- Existe una ruta de emergencia para detener todo: `POST /api/calls/stop-all`.

## Impacto Esperado

- Menos gasto por minutos inútiles.
- Menos gasto por buzón/casilla.
- Menos gasto por grabación en recordatorios.
- Menos gasto por STT en recordatorios.
- Menos duplicados y menos lotes inflados.
- Menor riesgo operativo en la noche.

## Configuración aplicada

- `CALL_WINDOW_START_HOUR=8`
- `CALL_WINDOW_END_HOUR=22`
- `RECENT_CALL_COOLDOWN_HOURS=24`
- `MAX_BATCH_REPEAT_COUNT=1`
- `ENABLE_AMD_FOR_REMINDERS=true`
- `REMINDER_AMD_MODE=detect`
- `REMINDER_AMD_WAIT_MS=4000`
- `ENABLE_RECORDING_FOR_REMINDERS=false`
- `ENABLE_STT_FOR_REMINDERS=false`
- `OUTBOUND_TIMEOUT_SECS_REMINDER=25`
