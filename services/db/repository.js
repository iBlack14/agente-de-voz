const { supabase } = require('./supabase.service');

/**
 * Handles all database interactions using Supabase SDK.
 */
module.exports = {
  /**
   * Logs or updates a call record.
   */
  logCall: async (entry) => {
    const callId = String(entry.callId || 'unknown');
    const transcript = Array.isArray(entry.transcript) ? entry.transcript : null;

    try {
        const { error } = await supabase.from('calls').upsert({
            call_id: callId,
            direction: entry.direction,
            from_number: entry.from,
            to_number: entry.to,
            domain: entry.domain,
            mode: entry.mode,
            reminder_greeting: entry.reminderGreeting,
            reminder_instructions: entry.reminderInstructions,
            batch_id: entry.batchId,
            batch_label: entry.batchLabel,
            started_at: entry.startedAt,
            ended_at: entry.endedAt,
            duration_sec: entry.durationSec,
            turn_count: entry.turnCount,
            status: entry.status,
            recording_url: entry.recordingUrl,
            updated_at: new Date().toISOString()
        });

        if (error) throw error;

        if (transcript && transcript.length > 0) {
            // Delete old and insert new transcript
            await supabase.from('call_transcripts').delete().eq('call_id', callId);
            const records = transcript.map(msg => ({
                call_id: callId,
                role: msg.role,
                text: msg.text,
                at: msg.at
            }));
            await supabase.from('call_transcripts').insert(records);
        }
    } catch (err) {
        console.error('[Repository] Error logging call:', err.message);
    }
  },

  /**
   * Reads call history with associated transcripts.
   */
  readCallLog: async () => {
    try {
        const historyLimit = 200;
        // Use single query with nested transcripts to avoid URI Too Long (IN clause limits)
        const { data: calls, error } = await supabase
            .from('calls')
            .select('*, call_transcripts(*)')
            .order('started_at', { ascending: false, nullsFirst: false })
            .limit(historyLimit);

        if (error) throw error;
        if (!calls || !calls.length) return [];

        return calls.map(r => ({
            callId: r.call_id,
            direction: r.direction,
            from: r.from_number,
            to: r.to_number,
            domain: r.domain,
            mode: r.mode,
            reminderGreeting: r.reminder_greeting,
            reminderInstructions: r.reminder_instructions,
            batchId: r.batch_id,
            batchLabel: r.batch_label,
            startedAt: r.started_at,
            endedAt: r.ended_at,
            durationSec: r.duration_sec,
            turnCount: r.turn_count,
            status: r.status,
            recordingUrl: r.recording_url,
            // Map nested transcripts and ensure they are sorted by ID
            transcript: (r.call_transcripts || [])
                .sort((a, b) => (a.id || 0) - (b.id || 0))
                .map(t => ({ role: t.role, text: t.text, at: t.at }))
        }));
    } catch (err) {
        console.error('[Repository] Error reading logs:', err.message);
        return [];
    }
  },

  /**
   * Logs usage metrics.
   */
  logUsage: async ({ callId, service, metric, value }) => {
    try {
        await supabase.from('usage_logs').insert({
            call_id: callId || null,
            service,
            metric,
            value
        });
    } catch (err) { /* ignore */ }
  },

  /**
   * Aggregates usage statistics.
   */
  getUsageStats: async () => {
    try {
        const { data: usage } = await supabase
            .from('usage_logs')
            .select('service, metric, value');
        
        const stats = (usage || []).reduce((acc, curr) => {
            const key = `${curr.service}:${curr.metric}`;
            if (!acc[key]) acc[key] = { service: curr.service, metric: curr.metric, total: 0 };
            acc[key].total += Number(curr.value);
            return acc;
        }, {});

        const { data: telnyxSum } = await supabase.rpc('sum_call_duration'); // Note: Requires RPC if large, otherwise manual sum
        let totalSec = 0;
        if (!telnyxSum) {
            const { data } = await supabase.from('calls').select('duration_sec').gt('duration_sec', 0);
            totalSec = (data || []).reduce((sum, r) => sum + r.duration_sec, 0);
        }

        return {
            usage: Object.values(stats),
            telnyx_seconds: totalSec
        };
    } catch (err) {
        return { usage: [], telnyx_seconds: 0 };
    }
  }
};
