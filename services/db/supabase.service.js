const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('[Supabase] CRITICAL: Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
    supabase,
    
    // Helper to keep some compatibility with the old "query" style
    // WARNING: This is a limited shim for simple queries.
    // Real migration should use .from().select() etc.
    query: async (text, params = []) => {
        const textLower = text.toLowerCase().trim();
        const isPeriodic = textLower.includes('from calls') || textLower.includes('from scheduled_calls') || textLower.includes('from app_settings');
        
        if (!isPeriodic) {
            console.log('⚡ [Supabase] Executing:', text.substring(0, 70) + (text.length > 70 ? '...' : ''));
        }
        
        try {
            // SELECT prompts
            if (textLower.includes('select') && textLower.includes('from prompts')) {
                const { data, error } = await supabase.from('prompts').select('*');
                if (error) throw error;
                
                const defaults = [
                    { id: 'asistente_comercial', name: 'ASISTENTE COMERCIAL', greeting: 'Hola, soy el asistente de ViaAI, ¿en qué puedo ayudarte?', text: 'Eres un asistente comercial experto en soluciones digitales. Tu objetivo es calificar leads y agendar reuniones para el equipo de ventas. Se amable, profesional y conciso.' },
                    { id: 'atencion_soporte', name: 'SOPORTE TÉCNICO', greeting: 'Hola, te hablas del área técnica, ¿tienes algún problema con tu servicio?', text: 'Eres un técnico de soporte nivel 1. Tu objetivo es entender el problema del cliente, intentar resolver dudas básicas y escalar si es necesario.' }
                ];
                
                const merged = [...(data || [])];
                defaults.forEach(def => {
                    if (!merged.find(m => m.id === def.id || m.name === def.name)) merged.push(def);
                });
                return { rows: merged, rowCount: merged.length };
            }
            
            // SELECT reminder_prompts
            if (textLower.includes('select') && textLower.includes('from reminder_prompts')) {
                const { data, error } = await supabase.from('reminder_prompts').select('*');
                if (error) throw error;
                
                const defaults = [
                    { id: 'uso_correos', name: 'USO DE CORREOS', greeting: '', text: 'Buenas () Estimado cliente, para garantizar un uso correcto de sus correos corporativos, les recomendamos descargar periodicamente toda su informacion importante a sus computadoras. Esta accion preventiva es vital para evitar perdidas de datos ante cualquier fallo inesperado en los backups. Atentamente, VIA COMUNICATIVA, "Publicidad que marca tu exito".' },
                    { id: 'informacion_pendientes', name: 'INFORMACIÓN PENDIENTES', greeting: '', text: 'Estimado cliente, estamos en la etapa final del proyecto de su desarrollo web ... Para culminar exitosamente el proyecto, solicitamos amablemente el envio de la informacion pendiente. Puede comunicarse directamente con el area de soporte de VIA COMUNICATIVA a los numeros 936613758 o 924461828. Esperamos su pronta respuesta para culminar el servicio exitosamente. Estamos listos para lanzar su proyecto al mercado hoy mismo. Quedamos atentos.' },
                    { id: 'llamada_ofertas', name: 'LLAMADA DE OFERTAS', greeting: '', text: 'Estimado cliente, impulsa tu empresa aumentando la rentabilidad y utilidades con nuestras paginas web profesionales, reestructuraciones y sistemas ERP empresariales. Te entregamos soluciones tecnologicas de excelencia, disenadas para automatizar procesos y escalar tus ventas rapidamente, manteniendo una inversión accesible. Moderniza tu presencia digital y asegura resultados comerciales. Somos VIA COMUNICATIVA - Agencia de Marketing y Publicidad. Puedes comunicarte al: 936613758.' },
                    { id: 'respuesta_cotizacion', name: 'RESPUESTA DE COTIZACIÓN', greeting: '', text: 'Buenos Dias, Estimado cliente, le enviamos una cotizacion para el desarrollo de su servicio web, esperamos su verificacion tecnica y estamos atentos a una respuesta sobre el servicio. Nos contactaremos a la brevedad desde el numero principal de nuestra empresa. 936613758. VIA COMUNICATIVA, "Publicidad que marca tu exito".' },
                    { id: 'renovacion_servicios', name: 'RENOVACIÓN DE SERVICIOS', greeting: 'Buenas () Estimado Clientes, somos de la Agencia de Publicidad VIA COMUNICATIVA.', text: 'Tenemos a cargo su servicio web dominio... Esta proximo a vencer, se le recomienda realizar el pago por renovacion de s/.250.00 al haber cumplido ya un ano con nosotros, evitar cortes e interrupciones y pagos por reposicion de servicio. Quedamos Atentos.' },
                    { id: 'actualizacion_datos', name: 'ACTUALIZACIÓN DE DATOS', greeting: 'Somos la agencia de marketing y publicidad. Via Comunicativa,', text: 'Como parte de una mejora continua, estamos realizando actualizaciones y optimizaciones en su sitio web ......, sin costo alguno, incluyendo ajustes visuales, contenido y estructura. Para adjuntar cambios o enviar solicitudes de modificacion, pueden comunicarse directamente al numero: 924461828 Quedamos atentos a sus indicaciones. Saludos cordiales.' }
                ];

                const merged = [...(data || [])];
                defaults.forEach(def => {
                    if (!merged.find(m => m.id === def.id || m.name === def.name)) merged.push(def);
                });
                return { rows: merged, rowCount: merged.length };
            }

            // SELECT calls
            if (textLower.includes('select') && textLower.includes('from calls')) {
                let query = supabase.from('calls').select('*').order('started_at', { ascending: false });
                if (textLower.includes('limit')) {
                    const limit = text.match(/limit\s+(\d+)/i)?.[1];
                    if (limit) query = query.limit(parseInt(limit));
                }
                const { data, error } = await query;
                if (error) throw error;
                return { rows: data, rowCount: data.length };
            }

            // SELECT scheduled_calls
            if (textLower.includes('select') && textLower.includes('from scheduled_calls')) {
                const { data, error } = await supabase.from('scheduled_calls').select('*').order('scheduled_for', { ascending: true });
                if (error) throw error;
                return { rows: data, rowCount: data.length };
            }

            // SELECT app_settings
            if (textLower.includes('select') && textLower.includes('from app_settings')) {
                const keyMatch = text.match(/key\s*=\s*['"]([^'"]+)['"]/i);
                let query = supabase.from('app_settings').select('value');
                if (keyMatch) query = query.eq('key', keyMatch[1]);
                
                const { data, error } = await query;
                if (error) throw error;
                if (!data || data.length === 0) {
                    return { rows: [{ value: '1' }], rowCount: 1 };
                }
                return { rows: data, rowCount: data.length };
            }

            // UPDATE scheduled_calls (Start processing)
            if (textLower.includes('update scheduled_calls') && textLower.includes("set status = 'processing'")) {
                const now = new Date().toISOString();
                const { data, error } = await supabase
                    .from('scheduled_calls')
                    .update({ 
                        status: 'processing', 
                        processing_started_at: now,
                        updated_at: now
                    })
                    .eq('status', 'pending')
                    .lte('scheduled_for', params[0] || now)
                    .select('*');
                
                if (error) throw error;
                return { rows: data || [], rowCount: (data || []).length };
            }

            // UPDATE scheduled_calls (Complete / Error / Recovery)
            if (textLower.includes('update scheduled_calls')) {
                let status = 'pending';
                if (textLower.includes("'completed'")) status = 'completed';
                if (textLower.includes("'processing'")) status = 'processing';
                
                const { error } = await supabase
                    .from('scheduled_calls')
                    .update({ status, updated_at: new Date().toISOString() })
                    .eq('id', params[0]);
                
                return { rows: [], rowCount: error ? 0 : 1 };
            }

            // INSERT into calls
            if (textLower.includes('insert into calls')) {
                // params: [callId, direction, from, to, startedAt, endedAt, duration, turns, status]
                // Note: The order varies depending on logCall implementation
                // We'll use a simplified version for common logCall usage
                const { error } = await supabase.from('calls').upsert({
                    call_id: params[0],
                    from_number: params[1],
                    to_number: params[2],
                    direction: params[3],
                    domain: params[4],
                    mode: params[5],
                    reminder_greeting: params[6],
                    reminder_instructions: params[7],
                    started_at: params[8],
                    status: params[9]
                });
                return { rows: [], rowCount: error ? 0 : 1 };
            }

            // Handle other UPDATE / DELETE / INSERT (Bypass)
            if (textLower.startsWith('update') || textLower.startsWith('delete') || textLower.startsWith('insert')) {
                return { rows: [], rowCount: 0 };
            }

            console.warn(`[Supabase Shim] Warning: Query not fully implemented, returning empty: ${text.substring(0, 50)}`);
            return { rows: [], rowCount: 0 };
        } catch (e) {
            console.error('[Supabase Shim] Error in simulated query:', e.message);
            return { rows: [], rowCount: 0 };
        }
    },

    testConnection: async () => {
        const { data, error } = await supabase.from('prompts').select('count', { count: 'exact', head: true });
        if (error) throw error;
        return true;
    },

    initSchema: async () => {
        console.log('[Supabase] Note: Auto-schema creation is not supported via SDK. Please run schema.sql in Supabase SQL Editor.');
    }
};
