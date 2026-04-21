const { supabase } = require('./supabase.service');

module.exports = {
    /**
     * Get updates with filtering
     */
    getUpdates: async ({ month, year, search }) => {
        let query = supabase.from('updates').select('*');

        if (month) {
            if (year) {
                const startDate = new Date(year, month - 1, 1).toISOString();
                const endDate = new Date(year, month, 0).toISOString();
                query = query.gte('execution_date', startDate).lte('execution_date', endDate);
            } else {
                // If no year, we'll filter in JS after fetching or use a postgres fragment
                // For simplicity and compatibility with Supabase client, we'll fetch and filter if there's no year
                // But wait, it's better to use a raw filter if possible.
                // Supabase allows .or() and .filter() with custom logic.
                // However, the easiest way is to use a computed column or just filter in memory for now
                // since the number of domains is likely small (< 1000).
                // Let's optimize: query.filter('execution_date', 'cs', `-${String(month).padStart(2, '0')}-`);
                // Actually, 'cs' (contains) works for strings. DATE in pg can be cast to text.
            }
        }

        if (search) {
            query = query.or(`domain.ilike.%${search}%,notes.ilike.%${search}%`);
        }

        const { data, error } = await query.order('execution_date', { ascending: true });
        if (error) throw error;

        // If no year was provided but month was, filter in memory
        if (month && !year) {
            return data.filter(item => {
                // item.execution_date is "YYYY-MM-DD"
                if (!item.execution_date) return false;
                const parts = item.execution_date.split('-');
                if (parts.length < 2) return false;
                const monthFromDate = parseInt(parts[1], 10);
                return monthFromDate === month;
            });
        }

        return data;
    },

    /**
     * Schedule a batch of calls from updates
     */
    scheduleBatch: async ({ updateIds, promptId, scheduledFor }) => {
        // 1. Fetch updates to get phone numbers and domains
        const { data: updates, error: fetchError } = await supabase
            .from('updates')
            .select('*')
            .in('id', updateIds);
        
        if (fetchError) throw fetchError;

        // 2. Fetch the prompt details
        const { data: prompt, error: promptError } = await supabase
            .from('reminder_prompts')
            .select('*')
            .eq('id', promptId)
            .single();
        
        if (promptError) throw promptError;

        // 3. Helper for professional replacement (mirroring frontend logic)
        const personalizeText = (text, domain) => {
            if (!text) return text;
            const cleanDomain = (domain || 'su sitio web').replace(/^www\./i, '');
            return text.replace(/dominio(\.\.\.|…)/gi, `dominio ${cleanDomain}`);
        };

        // 4. Prepare scheduled calls with personalized content
        const scheduledCalls = updates
            .filter(u => u.phone) // Only those with phones
            .map(u => ({
                to_number: u.phone,
                domain: u.domain,
                batch_label: `Campana ${prompt.name}`,
                greeting: personalizeText(prompt.greeting, u.domain),
                instructions: personalizeText(prompt.text, u.domain),
                scheduled_for: scheduledFor || new Date().toISOString(),
                status: 'pending'
            }));

        if (scheduledCalls.length === 0) return { scheduled: 0 };

        // 4. Insert into scheduled_calls
        const { data, error: insertError } = await supabase
            .from('scheduled_calls')
            .insert(scheduledCalls)
            .select();
        
        if (insertError) throw insertError;
        return { scheduled: data.length, data };
    },

    /**
     * Create a single update entry manually
     */
    createUpdate: async (payload) => {
        const { data, error } = await supabase
            .from('updates')
            .insert([payload])
            .select();
        if (error) throw error;
        return data[0];
    },

    /**
     * Bulk insert updates (Initial load)
     */
    bulkInsert: async (records) => {
        const { data, error } = await supabase.from('updates').insert(records);
        if (error) throw error;
        return data;
    },

    /**
     * Update an entry
     */
    updateUpdate: async (id, payload) => {
        const { data, error } = await supabase
            .from('updates')
            .update(payload)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data[0];
    },

    /**
     * Delete an entry
     */
    deleteUpdate: async (id) => {
        const { error } = await supabase
            .from('updates')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    }
};
