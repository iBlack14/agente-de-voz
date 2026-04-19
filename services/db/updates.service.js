const { supabase } = require('./supabase.service');

module.exports = {
    /**
     * Get updates with filtering
     */
    getUpdates: async ({ month, year, search }) => {
        let query = supabase.from('updates').select('*');

        if (month && year) {
            // Month is 1-indexed in JS/API but we search in DB
            const startDate = new Date(year, month - 1, 1).toISOString();
            const endDate = new Date(year, month, 0).toISOString();
            query = query.gte('execution_date', startDate).lte('execution_date', endDate);
        }

        if (search) {
            query = query.or(`domain.ilike.%${search}%,notes.ilike.%${search}%`);
        }

        const { data, error } = await query.order('execution_date', { ascending: true });
        if (error) throw error;
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

        // 3. Prepare scheduled calls
        const scheduledCalls = updates
            .filter(u => u.phone) // Only those with phones
            .map(u => ({
                to_number: u.phone,
                domain: u.domain,
                batch_label: `Campana ${prompt.name}`,
                greeting: prompt.greeting,
                instructions: prompt.text,
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
    }
};
