const { supabase } = require('./supabase.service');
const { formatToE164, isValidE164 } = require('../utils');

const MAX_BATCH_REPEAT_COUNT = Math.max(1, parseInt(process.env.MAX_BATCH_REPEAT_COUNT || '1', 10));
const RECENT_CALL_COOLDOWN_HOURS = Math.max(1, parseInt(process.env.RECENT_CALL_COOLDOWN_HOURS || '24', 10));

async function getRecentlyContactedNumbers(numbers) {
    const normalizedNumbers = Array.from(new Set((numbers || []).filter(Boolean)));
    if (normalizedNumbers.length === 0) return new Set();

    const cutoff = new Date(Date.now() - RECENT_CALL_COOLDOWN_HOURS * 3600000).toISOString();
    const recentStatusesToIgnore = ['failed', 'busy', 'no_answer', 'canceled'];

    const [{ data: recentCalls, error: callsError }, { data: recentScheduled, error: scheduledError }] = await Promise.all([
        supabase
            .from('calls')
            .select('to_number,status,started_at')
            .in('to_number', normalizedNumbers)
            .gte('started_at', cutoff),
        supabase
            .from('scheduled_calls')
            .select('to_number,status,scheduled_for')
            .in('to_number', normalizedNumbers)
            .gte('scheduled_for', cutoff)
    ]);

    if (callsError) throw callsError;
    if (scheduledError) throw scheduledError;

    const blocked = new Set();

    for (const row of recentCalls || []) {
        const status = String(row.status || '').toLowerCase();
        if (!recentStatusesToIgnore.includes(status)) {
            blocked.add(row.to_number);
        }
    }

    for (const row of recentScheduled || []) {
        const status = String(row.status || '').toLowerCase();
        if (status === 'pending' || status === 'processing' || status === 'completed') {
            blocked.add(row.to_number);
        }
    }

    return blocked;
}

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
    scheduleBatch: async ({ updateIds, promptId, scheduledFor, repeatEveryHours, repeatCount, customGreeting, customInstructions }) => {
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
        const getTimeGreeting = () => {
            const hour = Number(new Intl.DateTimeFormat('es-PE', {
                hour: 'numeric',
                hour12: false,
                timeZone: 'America/Lima'
            }).format(new Date()));

            if (hour >= 5 && hour < 12) return 'Buenos dias';
            if (hour >= 12 && hour < 19) return 'Buenas tardes';
            return 'Buenas noches';
        };

        const personalizeText = (text, domain) => {
            if (!text) return text;
            const cleanDomain = (domain || 'su sitio web').replace(/^www\./i, '');
            const greeting = getTimeGreeting();
            return text
                .replace(/Buenas\s*\(\)/gi, greeting)
                .replace(/\(\)/g, greeting)
                .replace(/\bBuenos\s+d[ií]as\b/gi, greeting)
                .replace(/\bBuenas\s+tardes\b/gi, greeting)
                .replace(/\bBuenas\s+noches\b/gi, greeting)
                .replace(/\bdominio\b\s*(?:\.{2,}|…)/gi, `dominio ${cleanDomain}`)
                .replace(/\bservicio\s+web\b\s*(?:\.{2,}|…)/gi, `servicio web ${cleanDomain}`)
                .replace(/\bsitio\s+web\b\s*(?:\.{2,}|…)/gi, `sitio web ${cleanDomain}`)
                .replace(/\bdesarrollo\s+web\b\s*(?:\.{2,}|…)/gi, `desarrollo web ${cleanDomain}`)
                .replace(/\bp[aá]gina\s+web\b\s*(?:\.{2,}|…)/gi, `pagina web ${cleanDomain}`)
                .replace(/\bproyecto\s+web\b\s*(?:\.{2,}|…)/gi, `proyecto web ${cleanDomain}`);
        };

        const greetingBase = typeof customGreeting === 'string' ? customGreeting : prompt.greeting;
        const instructionsBase = typeof customInstructions === 'string' ? customInstructions : prompt.text;
        const intervalHours = Math.max(1, parseInt(repeatEveryHours || 2, 10));
        const requestedRuns = Math.max(1, parseInt(repeatCount || 1, 10));
        const totalRuns = Math.min(MAX_BATCH_REPEAT_COUNT, requestedRuns);
        const firstRunAt = scheduledFor ? new Date(scheduledFor) : new Date();

        const stamp = Date.now();
        const shortId = stamp.toString().slice(-4);
        const commonBatchId = `batch-${shortId}-${stamp}`;
        const commonBatchLabel = `Campaña ${prompt.name} [Vol. ${updates.length}] | ID-${shortId}`;

        // 4. Prepare scheduled calls with personalized content
        const validNumbers = updates
            .map(u => formatToE164(u.phone || ''))
            .filter(isValidE164);
        const recentlyContacted = await getRecentlyContactedNumbers(validNumbers);

        const seenRuns = new Set();
        const skippedNumbers = [];
        const scheduledCalls = updates
            .filter(u => u.phone) // Only those with phones
            .flatMap(u => {
                const normalizedPhone = formatToE164(u.phone);
                if (!isValidE164(normalizedPhone)) {
                    skippedNumbers.push({ phone: u.phone, reason: 'invalid_number', domain: u.domain || null });
                    return [];
                }

                if (recentlyContacted.has(normalizedPhone)) {
                    skippedNumbers.push({ phone: normalizedPhone, reason: `recently_contacted_${RECENT_CALL_COOLDOWN_HOURS}h`, domain: u.domain || null });
                    return [];
                }

                const greeting = personalizeText(greetingBase, u.domain);
                const instructions = personalizeText(instructionsBase, u.domain);

                return Array.from({ length: totalRuns }, (_, idx) => {
                    const runAt = new Date(firstRunAt.getTime() + (idx * intervalHours * 60 * 60 * 1000));
                    const dedupeKey = [
                        normalizedPhone,
                        String(u.domain || '').trim().toLowerCase(),
                        runAt.toISOString()
                    ].join('|');

                    if (seenRuns.has(dedupeKey)) {
                        return null;
                    }
                    seenRuns.add(dedupeKey);
                    
                    // For multiple runs, we might want different batch IDs if the UI expects it for iterations,
                    // but the user wants to see it as "one batch". 
                    // Let's use the same commonBatchId but different labels if idx > 0?
                    // Actually, the UI buildHistoryBatchGroups uses batchId to group.
                    // If we want them in ONE card, they MUST have the same batchId or follow the retry: format.
                    
                    let batchId = commonBatchId;
                    if (idx > 0) {
                        batchId = `retry:${commonBatchId}:${idx}:${stamp}`;
                    }

                    return {
                        to_number: normalizedPhone,
                        domain: u.domain,
                        batch_id: batchId,
                        batch_label: totalRuns > 1
                            ? `Campana ${prompt.name} · ${idx + 1}/${totalRuns}`
                            : `Campana ${prompt.name}`,
                        greeting,
                        instructions,
                        scheduled_for: runAt.toISOString(),
                        retry_interval_hours: 0,
                        status: 'pending'
                    };
                }).filter(Boolean);
            });

        if (scheduledCalls.length === 0) return { scheduled: 0, skipped: skippedNumbers, capped_repeat_count: totalRuns };

        // 5. Register the batch in call_batches for the UI to recognize it properly
        await supabase.from('call_batches').upsert({
            id: commonBatchId,
            name: commonBatchLabel,
            total_destinations: updates.length,
            created_at: new Date().toISOString()
        });

        // 6. Insert into scheduled_calls
        const { data, error: insertError } = await supabase
            .from('scheduled_calls')
            .insert(scheduledCalls)
            .select();
        
        if (insertError) throw insertError;
        return { scheduled: data.length, data, skipped: skippedNumbers, capped_repeat_count: totalRuns };
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
    },

    /**
     * Delete all entries in a category
     */
    deleteByCategory: async (categoryName) => {
        const { data: items, error: fetchError } = await supabase
            .from('updates')
            .select('id, notes')
            .like('notes', `%[CAT:${categoryName}]%`);
        
        if (fetchError) throw fetchError;
        
        const idsToDelete = items
            .filter(item => {
                const match = item.notes?.match(/\[CAT:(.*?)\]/);
                return match && match[1] === categoryName;
            })
            .map(item => item.id);

        if (idsToDelete.length === 0) return { success: true };

        const { error: deleteError } = await supabase
            .from('updates')
            .delete()
            .in('id', idsToDelete);
            
        if (deleteError) throw deleteError;
        return { success: true };
    }
};
