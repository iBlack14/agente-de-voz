-- schema.sql (SUPABASE READY)
-- Limpia y recrea la estructura con los datos reales

-- 1. IDENTIDADES (PROMPTS)
CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  greeting TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RECORDATORIOS (REMINDER PROMPTS)
CREATE TABLE IF NOT EXISTS reminder_prompts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  greeting TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CONFIGURACIÓN
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CAMPANAS Y LOTES
CREATE TABLE IF NOT EXISTS call_batches (
    id TEXT PRIMARY KEY,
    parent_batch_id TEXT REFERENCES call_batches(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    total_destinations INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. LLAMADAS
CREATE TABLE IF NOT EXISTS calls (
  call_id TEXT PRIMARY KEY,
  direction TEXT,
  from_number TEXT,
  to_number TEXT,
  domain TEXT,
  mode TEXT,
  reminder_greeting TEXT,
  reminder_instructions TEXT,
  batch_id TEXT,
  batch_label TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_sec INTEGER,
  turn_count INTEGER,
  status TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TRANSCRIPCIONES Y LOGS
CREATE TABLE IF NOT EXISTS call_transcripts (
  id BIGSERIAL PRIMARY KEY,
  call_id TEXT NOT NULL REFERENCES calls(call_id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_logs (
  id BIGSERIAL PRIMARY KEY,
  call_id TEXT REFERENCES calls(call_id) ON DELETE SET NULL,
  service TEXT NOT NULL, 
  metric TEXT NOT NULL,  
  value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PROGRAMACIÓN (SCHEDULED CALLS)
CREATE TABLE IF NOT EXISTS scheduled_calls (
  id BIGSERIAL PRIMARY KEY,
  to_number TEXT NOT NULL,
  batch_id TEXT,
  batch_label TEXT,
  domain TEXT,
  greeting TEXT,
  instructions TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  retry_interval_hours INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', 
  processing_started_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. VENCIMIENTOS Y DOMINIOS (UPDATES)
CREATE TABLE IF NOT EXISTS updates (
  id BIGSERIAL PRIMARY KEY,
  domain VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  execution_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_transcripts_call_id ON call_transcripts (call_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_status ON scheduled_calls (status);
CREATE INDEX IF NOT EXISTS idx_updates_execution_date ON updates (execution_date);
CREATE INDEX IF NOT EXISTS idx_updates_domain ON updates (domain);

-- ==========================================
-- SEMILLAS (DATA DE LA EMPRESA)
-- ==========================================

-- Recordatorios originales
INSERT INTO reminder_prompts (id, name, greeting, text) VALUES 
('uso_correos', 'USO DE CORREOS', '', 'Buenas () Estimado cliente, para garantizar un uso correcto de sus correos corporativos, les recomendamos descargar periodicamente toda su informacion importante a sus computadoras. Esta accion preventiva es vital para evitar perdidas de datos ante cualquier fallo inesperado en los backups. Atentamente, VIA COMUNICATIVA, "Publicidad que marca tu exito".'),
('informacion_pendientes', 'INFORMACIÓN PENDIENTES', '', 'Estimado cliente, estamos en la etapa final del proyecto de su desarrollo web ... Para culminar exitosamente el proyecto, solicitamos amablemente el envio de la informacion pendiente. Puede comunicarse directamente con el area de soporte de VIA COMUNICATIVA a los numeros 936613758 o 924461828. Esperamos su pronta respuesta para culminar el servicio exitosamente. Estamos listos para lanzar su proyecto al mercado hoy mismo. Quedamos atentos.'),
('llamada_ofertas', 'LLAMADA DE OFERTAS', '', 'Estimado cliente, impulsa tu empresa aumentando la rentabilidad y utilidades con nuestras paginas web profesionales, reestructuraciones y sistemas ERP empresariales. Te entregamos soluciones tecnologicas de excelencia, disenadas para automatizar procesos y escalar tus ventas rapidamente, manteniendo una inversion accesible. Moderniza tu presencia digital y asegura resultados comerciales. Somos VIA COMUNICATIVA - Agencia de Marketing y Publicidad. Puedes comunicarte al: 936613758.'),
('respuesta_cotizacion', 'RESPUESTA DE COTIZACIÓN', '', 'Buenos Dias, Estimado cliente, le enviamos una cotizacion para el desarrollo de su servicio web, esperamos su verificacion tecnica y estamos atentos a una respuesta sobre el servicio. Nos contactaremos a la brevedad desde el numero principal de nuestra empresa. 936613758. VIA COMUNICATIVA, "Publicidad que marca tu exito".'),
('renovacion_servicios', 'RENOVACIÓN DE SERVICIOS', 'Buenas () Estimado Clientes, somos de la Agencia de Publicidad VIA COMUNICATIVA.', 'Tenemos a cargo su servicio web dominio... Esta proximo a vencer, se le recomienda realizar el pago por renovacion de s/.250.00 al haber cumplido ya un ano con nosotros, evitar cortes e interrupciones y pagos por reposicion de servicio. Quedamos Atentos.'),
('actualizacion_datos', 'ACTUALIZACIÓN DE DATOS', 'Somos la agencia de marketing y publicidad. Via Comunicativa,', 'Como parte de una mejora continua, estamos realizando actualizaciones y optimizaciones en su sitio web ......, sin costo alguno, incluyendo ajustes visuales, contenido y estructura. Para adjuntar cambios o enviar solicitudes de modificacion, pueden comunicarse directamente al numero: 924461828 Quedamos atentos a sus indicaciones. Saludos cordiales.')
ON CONFLICT (id) DO NOTHING;

-- Identidades por defecto
INSERT INTO prompts (id, name, greeting, text) VALUES 
('asistente_comercial', 'ASISTENTE COMERCIAL', 'Hola, soy el asistente de ViaAI, ¿en qué puedo ayudarte?', 'Eres un asistente comercial experto en soluciones digitales. Tu objetivo es calificar leads y agendar reuniones para el equipo de ventas. Se amable, profesional y conciso.'),
('atencion_soporte', 'SOPORTE TÉCNICO', 'Hola, te hablas del área técnica, ¿tienes algún problema con tu servicio?', 'Eres un técnico de soporte nivel 1. Tu objetivo es entender el problema del cliente, intentar resolver dudas básicas y escalar si es necesario.')
ON CONFLICT (id) DO NOTHING;
