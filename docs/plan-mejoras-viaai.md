# Plan Maestro de Mejoras y Optimización: ViaAI Voice Matrix

Este documento detalla la hoja de ruta para llevar la plataforma de un estado funcional a uno de grado empresarial, atacando los cuellos de botella actuales y mejorando el sistema de depuración.

## 1. Resolución de Errores y Debugging (Inmediato)

### A. Throttling de Llamadas (Fix Error D1)
El error `User channel limit exceeded D1` de Telnyx indica que estamos enviando demasiadas llamadas simultáneas.
- **Mejora**: Implementar una cola de tareas (usando `p-queue` o similar) para procesar llamadas en lotes de 1 a 5 (según el límite de la cuenta).
- **Control**: Añadir un retardo aleatorio de 1-3 segundos entre inicios de llamada para evitar ser bloqueados por filtros de spam.

### B. Sistema de Logs Avanzado
Actualmente, los errores se imprimen en consola (`console.error`).
- **Mejora**: Implementar `Winston` o `Pino` para guardar logs en archivos (`/logs/error.log`, `/logs/combined.log`).
- **Trazabilidad**: Asignar un `correlation_id` a cada sesión de WebSocket que se vincule con el `call_control_id` de Telnyx para seguir el rastro completo de una llamada fallida.

## 2. Optimizaciones de Infraestructura

### A. Grabación de Llamadas (Audio Proof)
- **Mejora**: Activar la grabación automática en Telnyx al iniciar la llamada.
- **Historial**: Añadir un reproductor de audio en el modal de transacciones para escuchar las grabaciones de llamadas finalizadas.

### B. Gestión de Sesiones (Seguridad)
El sistema actual usa un `Map` en memoria (`authSessions`). Si el servidor se reinicia, todos cierran sesión.
- **Mejora**: Migrar las sesiones a `Redis` o persistirlas en `PostgreSQL`.
- **Auth**: Implementar hashing de contraseñas (`bcrypt`) para el `ADMIN_PASS`.

## 3. Experiencia de Usuario (UI/UX)

### A. Auditoría de Latencia
- **Mejora**: Medir y mostrar en el Dashboard el "Ping Neural" (tiempo de respuesta de Groq + ElevenLabs).
- **Visualización**: Indicadores de "señal" para Deepgram y ElevenLabs en la pestaña de consumos.

### B. Plantillas Dinámicas
- **Mejora**: Permitir el uso de variables en los guiones (ej: `{Nombre}`, `{Deuda}`, `{Fecha}`) que se inyecten desde el Excel de importación automáticamente.

## 4. Análisis de Estabilidad (Checklist de Debug)

- [ ] **Validación de Webhooks**: Implementar firma de Telnyx (`ENFORCE_TELNYX_SIGNATURE`) para evitar ataques de inyección de eventos.
- [ ] **Manejo de Silencio**: Ajustar el `idleCount` basándose en el ruido ambiental para evitar que la IA cuelgue prematuramente en entornos ruidosos.
- [ ] **Fallback de TTS**: Si ElevenLabs falla por cuota, cambiar automáticamente a un motor secundario (ej: Google TTS o OpenAI TTS) para no interrumpir el servicio.

---
**Próximo paso sugerido:** Implementar la cola de procesamiento de llamadas para eliminar el error de límite de canales de Telnyx.
