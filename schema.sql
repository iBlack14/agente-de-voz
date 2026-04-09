CREATE TABLE IF NOT EXISTS prompts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  greeting TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminder_prompts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  greeting TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calls (
  call_id TEXT PRIMARY KEY,
  direction TEXT,
  from_number TEXT,
  to_number TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_sec INTEGER,
  turn_count INTEGER,
  status TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS call_transcripts (
  id BIGSERIAL PRIMARY KEY,
  call_id TEXT NOT NULL REFERENCES calls(call_id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls (status);
CREATE INDEX IF NOT EXISTS idx_calls_from_number ON calls (from_number);
CREATE INDEX IF NOT EXISTS idx_calls_to_number ON calls (to_number);
CREATE INDEX IF NOT EXISTS idx_call_transcripts_call_id ON call_transcripts (call_id);

CREATE TABLE IF NOT EXISTS usage_logs (
  id BIGSERIAL PRIMARY KEY,
  call_id TEXT REFERENCES calls(call_id) ON DELETE SET NULL,
  service TEXT NOT NULL, 
  metric TEXT NOT NULL,  
  value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_call_id ON usage_logs (call_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_service ON usage_logs (service);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs (created_at DESC);

-- Semillar prompts de recordatorio por defecto
INSERT INTO reminder_prompts (id, name, greeting, text) 
VALUES ('actualizaciones_marketing', 'ACTUALIZACIONES', 'Somos la agencia de marketing y publicidad. Via Comunicativa,', 
'Como parte de una mejora continua, estamos realizando actualizaciones y optimizaciones en su sitio web ......, sin costo alguno, incluyendo ajustes visuales, contenido y estructura. Para adjuntar cambios o enviar solicitudes de modificación, pueden comunicarse directamente al número: 924461828 Quedamos atentos a sus indicaciones. Saludos cordiales.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO reminder_prompts (id, name, greeting, text)
VALUES ('renovacion_web', 'RENOVACON', 'Buenas () Estimado Clientes, somos de la Agencia de Publicidad VIA COMUNICATIVA.', 
'Tenemos a cargo su servicio web dominio... Está próximo a vencer, se le recomienda realizar el pago por renovación de s/.250.00 al haber cumplido ya un año con nosotros, evitar cortes e interrupciones y pagos por reposición de servicio. Quedamos Atentos.')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS scheduled_calls (
  id BIGSERIAL PRIMARY KEY,
  to_number TEXT NOT NULL,
  domain TEXT,
  greeting TEXT,
  instructions TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  retry_interval_hours INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_calls_status ON scheduled_calls (status);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_time ON scheduled_calls (scheduled_for);
