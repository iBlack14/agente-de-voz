const { supabase } = require('../db/supabase.service');
const { makeOutboundCall } = require('./telnyxClient');
const { setCallContext } = require('./context.service');
const { logCall } = require('../db/repository');
const { callQueue } = require('./queue.service');

function getRetryPolicy(intervalHours) {
    const hours = Number(intervalHours || 0);
    if (!Number.isFinite(hours) || hours <= 0) {
        return { intervalHours: 0, maxAttempts: 1 };
    }

    return {
        intervalHours: hours,
        maxAttempts: Math.max(1, Math.floor(24 / hours))
    };
}

/**
 * Periodically checks for scheduled calls and triggers them if due.
 */
async function recoverStuckScheduledCalls(maxMinutes = 3) {
    try {
        const threshold = new Date(Date.now() - maxMinutes * 60000).toISOString();
        
        const { data, error } = await supabase
            .from('scheduled_calls')
            .update({ 
                status: 'pending', 
                processing_started_at: null,
                updated_at: new Date().toISOString()
            })
            .eq('status', 'processing')
            .lt('processing_started_at', threshold)
            .select();

        if (error) throw error;
        if (data && data.length > 0) {
            console.warn(`[Supabase Scheduler] Recovery: ${data.length} tarea(s) liberadas.`);
        }
    } catch (err) {
        console.error('[Supabase Scheduler] Error recovering stuck calls:', err.message);
    }
}

async function processScheduledCalls() {
    try {
        const now = new Date().toISOString();
        
        // 1. Marcar como processing y obtener los datos (Atomic-ish)
        const { data: tasks, error } = await supabase
            .from('scheduled_calls')
            .update({ 
                status: 'processing',
                processing_started_at: now,
                updated_at: now
            })
            .eq('status', 'pending')
            .lte('scheduled_for', now)
            .select('*');

        if (error) throw error;
        if (!tasks || tasks.length === 0) return;

        for (const task of tasks) {
            console.log(`🚀 [Supabase Scheduler] Iniciando llamada: ${task.to_number}`);
            
            try {
                await callQueue.add(async () => {
                    const result = await makeOutboundCall(task.to_number, task.domain, { 
                        mode: 'reminder', 
                        customGreeting: task.greeting, 
                        customInstructions: task.instructions 
                    });
                    
                    const callId = result.data?.call_control_id;
                    if (callId) {
                        const retryPolicy = getRetryPolicy(task.retry_interval_hours);
                        setCallContext(callId, { 
                            domain: task.domain, 
                            mode: 'reminder', 
                            customGreeting: task.greeting, 
                            customInstructions: task.instructions,
                            retry_interval: task.retry_interval_hours,
                            retry_attempts: (task.attempts || 0) + 1,
                            retry_max_attempts: retryPolicy.maxAttempts,
                            batch_id: task.batch_id || null,
                            batch_label: task.batch_label || null
                        });
                        
                        await logCall({ 
                            callId, 
                            from: process.env.TELNYX_PHONE_NUMBER || '+5114682421', 
                            to: task.to_number, 
                            direction: 'outbound', 
                            domain: task.domain || null,
                            mode: 'reminder',
                            reminderGreeting: task.greeting || null,
                            reminderInstructions: task.instructions || null,
                            batchId: task.batch_id || null,
                            batchLabel: task.batch_label || null,
                            startedAt: new Date().toISOString(), 
                            status: 'queued' 
                        });
                    }
                });
                
                await supabase
                    .from('scheduled_calls')
                    .update({ 
                        status: 'completed',
                        attempts: (task.attempts || 0) + 1,
                        last_error: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', task.id);

            } catch (err) {
                const status = err.response?.status;
                const errorMsg = err.response?.data?.errors?.[0]?.detail || err.message;
                console.error(`❌ [Supabase Scheduler] Error en llamada ${task.id}:`, errorMsg);
                
                // Detect permanent errors (Invalid number D11, Whitelist D13, Authentication)
                const isPermanent = status === 422 || status === 403 || status === 401;
                
                await supabase
                    .from('scheduled_calls')
                    .update({ 
                        status: isPermanent ? 'failed' : 'pending', 
                        scheduled_for: isPermanent ? task.scheduled_for : new Date(Date.now() + 180000).toISOString(), // Wait 3 min for transients
                        attempts: (task.attempts || 0) + 1,
                        last_error: errorMsg?.slice(0, 500)
                    })
                    .eq('id', task.id);
            }
        }
    } catch (err) {
        console.error('[Supabase Scheduler] Error processing calls:', err.message);
    }
}

function startScheduler() {
    recoverStuckScheduledCalls(1).catch(() => {});
    // Ejecución inicial rápida
    setTimeout(processScheduledCalls, 3000);
    
    setInterval(processScheduledCalls, 30000); // Revisar cada 30 segundos para más velocidad
    setInterval(() => recoverStuckScheduledCalls(5), 300000);
    console.log('✅ [Supabase Scheduler] Motor Nativo: ACTIVADO');
}

module.exports = { startScheduler, recoverStuckScheduledCalls, processScheduledCalls };
