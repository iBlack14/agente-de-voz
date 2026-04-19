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
        console.log('[Supabase Shim] Executing query simulation:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
        
        try {
            // SELECT prompts
            if (textLower.includes('select') && textLower.includes('from prompts')) {
                const { data, error } = await supabase.from('prompts').select('*');
                if (error) throw error;
                // Fallback if empty to avoid UI prompts
                if (!data || data.length === 0) {
                    const defaults = [{ id: '1', name: 'ASISTENTE GENERAL', greeting: 'Hola, soy tu asistente.', text: 'Eres un asistente amable.' }];
                    return { rows: defaults, rowCount: 1 };
                }
                return { rows: data, rowCount: data.length };
            }
            
            // SELECT reminder_prompts
            if (textLower.includes('select') && textLower.includes('from reminder_prompts')) {
                const { data, error } = await supabase.from('reminder_prompts').select('*');
                if (error) throw error;
                if (!data || data.length === 0) {
                    const defaults = [{ id: '1', name: 'RECORDATORIO GENERAL', greeting: 'Hola.', text: 'Este es un recordatorio.' }];
                    return { rows: defaults, rowCount: 1 };
                }
                return { rows: data, rowCount: data.length };
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

            // Handle UPDATE / DELETE / INSERT (Bypass or basic implementation)
            // For initialization cleanups, we can return rowCount 0 to avoid crashes
            if (textLower.startsWith('update') || textLower.startsWith('delete') || textLower.startsWith('insert')) {
                console.log('[Supabase Shim] Bypassing non-select query for initialization stability.');
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
