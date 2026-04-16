const { query } = require('../db/postgres.service');
const { makeOutboundCall } = require('./telnyxClient');
const { setCallContext } = require('./context.service');
const { logCall } = require('../db/repository');
const { callQueue } = require('./queue.service');
const { addInflightOutbound } = require('../callState');

/**
 * Periodically checks for scheduled calls and triggers them if due.
 */
async function recoverStuckScheduledCalls(maxMinutes = 3) {
    try {
        const { rowCount } = await query(
            `UPDATE scheduled_calls
             SET status = 'pending',
                 scheduled_for = NOW(),
                 processing_started_at = NULL,
                 updated_at = NOW(),
                 last_error = COALESCE(last_error, 'Recuperado automáticamente tras reinicio/timeout')
             WHERE status = 'processing'
               AND (
                 processing_started_at IS NULL
                 OR processing_started_at < NOW() - ($1 || ' minutes')::INTERVAL
               )`,
            [String(maxMinutes)]
        );
        if (rowCount > 0) {
            console.warn(`[Scheduler] Recovery: ${rowCount} tarea(s) en processing fueron liberadas a pending.`);
        }
    } catch (err) {
        console.error('[Scheduler] Error recovering stuck calls:', err.message);
    }
}

async function processScheduledCalls() {
    try {
        await recoverStuckScheduledCalls(3);
        const now = new Date().toISOString();
        const { rows } = await query(
            `UPDATE scheduled_calls 
             SET status = 'processing',
                 processing_started_at = NOW(),
                 attempts = attempts + 1,
                 updated_at = NOW(),
                 last_error = NULL
             WHERE status = 'pending' AND scheduled_for <= $1 
             RETURNING *`,
            [now]
        );

        for (const task of rows) {
            console.log(`[Scheduler] Triggering scheduled call to ${task.to_number}`);
            
            try {
                await callQueue.add(async () => {
                    const result = await makeOutboundCall(task.to_number, task.domain, { 
                        mode: 'reminder', 
                        customGreeting: task.greeting, 
                        customInstructions: task.instructions 
                    });
                    
                    const callId = result.data?.call_control_id;
                    if (callId) {
                        addInflightOutbound(callId);
                        setCallContext(callId, { 
                            domain: task.domain, 
                            mode: 'reminder', 
                            customGreeting: task.greeting, 
                            customInstructions: task.instructions,
                            retry_interval: task.retry_interval_hours,
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
                
                await query(
                  `UPDATE scheduled_calls
                   SET status = 'completed',
                       processing_started_at = NULL,
                       updated_at = NOW()
                   WHERE id = $1`,
                  [task.id]
                );
            } catch (err) {
                console.error(`[Scheduler] Failed to trigger call ${task.id}:`, err.message);
                await query(
                  `UPDATE scheduled_calls
                   SET status = 'pending',
                       scheduled_for = NOW() + INTERVAL '2 minutes',
                       processing_started_at = NULL,
                       updated_at = NOW(),
                       last_error = $2
                   WHERE id = $1`,
                  [task.id, err.message?.slice(0, 500) || 'Error desconocido']
                );
            }
        }
    } catch (err) {
        console.error('[Scheduler] Error processing scheduled calls:', err.message);
    }
}

// Check every 60 seconds
function startScheduler() {
    recoverStuckScheduledCalls(1).catch(() => {});
    setInterval(processScheduledCalls, 60000);
    setInterval(() => recoverStuckScheduledCalls(3), 120000);
    console.log('[Scheduler] Scheduled Calls Service: STARTED');
}

module.exports = { startScheduler, recoverStuckScheduledCalls };
