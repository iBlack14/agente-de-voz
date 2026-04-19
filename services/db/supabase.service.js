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
        console.log('[Supabase Shim] Executing query simulation:', text);
        
        // Very basic parsing for common queries used in this app
        if (text.toLowerCase().includes('select') && text.toLowerCase().includes('from prompts')) {
            const { data, error } = await supabase.from('prompts').select('*');
            if (error) throw error;
            return { rows: data };
        }
        
        if (text.toLowerCase().includes('select') && text.toLowerCase().includes('from calls')) {
            let query = supabase.from('calls').select('*').order('started_at', { ascending: false });
            if (text.toLowerCase().includes('limit')) {
                const limit = text.match(/limit\s+(\d+)/i)?.[1];
                if (limit) query = query.limit(parseInt(limit));
            }
            const { data, error } = await query;
            if (error) throw error;
            return { rows: data };
        }

        // For more complex queries, we should ideally use supabase.rpc() or rewrite the logic.
        // But to keep the app running, I'll implement a few more.
        
        throw new Error(`[Supabase Shim] Query not implemented in shim: ${text}. Please rewrite using Supabase SDK.`);
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
