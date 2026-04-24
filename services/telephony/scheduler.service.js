const { supabase } = require('../db/supabase.service');
const { makeOutboundCall } = require('./telnyxClient');
const { setCallContext } = require('./context.service');
const { logCall } = require('../db/repository');
const { callQueue } = require('./queue.service');
const { isWithinAllowedCallWindow, getNextAllowedCallTime } = require('./callWindow.service');

let schedulerBusy = false;
let accountBlockState = null;

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

function parseTelnyxError(err) {
    const response = err?.response?.data || {};
    const firstError = response?.errors?.[0] || {};
    const status = err?.response?.status;
    const detail = firstError?.detail || err?.message || 'Error desconocido';
    const code = String(response?.telnyx_error?.error_code || firstError?.code || '').toUpperCase();
    const isAccountBlocked = code === 'D17' || /account is disabled|account.*blocked/i.test(detail);

    return { status, detail, code, isAccountBlocked };
}

function isAccountBlockActive() {
    return accountBlockState && accountBlockState.until > Date.now();
}

function setAccountBlock(detail, code, cooldownMinutes = 30) {
    const until = Date.now() + (cooldownMinutes * 60 * 1000);
    accountBlockState = { detail, code, until };
    console.error(`[Supabase Scheduler] Bloqueo global Telnyx detectado (${code || 'N/A'}). Pausando scheduler hasta ${new Date(until).toISOString()}`);
}

async function rescheduleProcessingTasks(taskIds, detail, delayMinutes = 30) {
    if (!Array.isArray(taskIds) || taskIds.length === 0) return;

    const nextRunAt = new Date(Date.now() + delayMinutes * 60000).toISOString();
    await supabase
        .from('scheduled_calls')
        .update({
            status: 'pending',
            processing_started_at: null,
            scheduled_for: nextRunAt,
            last_error: String(detail || 'Telnyx account blocked').slice(0, 500),
            updated_at: new Date().toISOString()
        })
        .in('id', taskIds);
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
    if (schedulerBusy) {
        return;
    }

    if (isAccountBlockActive()) {
        return;
    }

    schedulerBusy = true;

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

        for (let index = 0; index < tasks.length; index++) {
            const task = tasks[index];

            if (isAccountBlockActive()) {
                await rescheduleProcessingTasks(
                    tasks.slice(index).map(item => item.id),
                    accountBlockState?.detail || 'Telnyx account blocked'
                );
                break;
            }

            if (!isWithinAllowedCallWindow()) {
                const deferredFor = getNextAllowedCallTime();
                await supabase
                    .from('scheduled_calls')
                    .update({
                        status: 'pending',
                        processing_started_at: null,
                        scheduled_for: deferredFor.toISOString(),
                        last_error: `Reprogramado por ventana horaria Peru (${deferredFor.toISOString()})`,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', task.id);
                continue;
            }

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
                const { status, detail, code, isAccountBlocked } = parseTelnyxError(err);
                console.error(`❌ [Supabase Scheduler] Error en llamada ${task.id}:`, detail);
                
                // Detect permanent errors (Invalid number D11, Whitelist D13, Authentication)
                const isPermanent = status === 422 || status === 403 || status === 401;

                if (isAccountBlocked) {
                    setAccountBlock(detail, code);
                    await rescheduleProcessingTasks(
                        tasks.slice(index).map(item => item.id),
                        detail
                    );
                    break;
                }
                
                await supabase
                    .from('scheduled_calls')
                    .update({ 
                        status: isPermanent ? 'failed' : 'pending', 
                        scheduled_for: isPermanent ? task.scheduled_for : new Date(Date.now() + 180000).toISOString(), // Wait 3 min for transients
                        attempts: (task.attempts || 0) + 1,
                        last_error: detail?.slice(0, 500),
                        processing_started_at: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', task.id);
            }
        }
    } catch (err) {
        console.error('[Supabase Scheduler] Error processing calls:', err.message);
    } finally {
        schedulerBusy = false;
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
