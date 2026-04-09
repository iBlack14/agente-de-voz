const { query } = require('../db/postgres.service');
const { makeOutboundCall } = require('./telnyxClient');
const { setCallContext } = require('./context.service');
const { logCall } = require('../db/repository');
const { callQueue } = require('./queue.service');
const { inflightOutbound } = require('../callState');

/**
 * Periodically checks for scheduled calls and triggers them if due.
 */
async function processScheduledCalls() {
    try {
        const now = new Date().toISOString();
        const { rows } = await query(
            `UPDATE scheduled_calls 
             SET status = 'processing' 
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
                        inflightOutbound.add(callId);
                        setCallContext(callId, { 
                            domain: task.domain, 
                            mode: 'reminder', 
                            customGreeting: task.greeting, 
                            customInstructions: task.instructions,
                            retry_interval: task.retry_interval_hours 
                        });
                        
                        await logCall({ 
                            callId, 
                            from: process.env.TELNYX_PHONE_NUMBER || '+5114682421', 
                            to: task.to_number, 
                            direction: 'outbound', 
                            startedAt: new Date().toISOString(), 
                            status: 'queued' 
                        });
                    }
                });
                
                await query(`UPDATE scheduled_calls SET status = 'completed' WHERE id = $1`, [task.id]);
            } catch (err) {
                console.error(`[Scheduler] Failed to trigger call ${task.id}:`, err.message);
                await query(`UPDATE scheduled_calls SET status = 'failed' WHERE id = $1`, [task.id]);
            }
        }
    } catch (err) {
        console.error('[Scheduler] Error processing scheduled calls:', err.message);
    }
}

// Check every 60 seconds
function startScheduler() {
    setInterval(processScheduledCalls, 60000);
    console.log('[Scheduler] Scheduled Calls Service: STARTED');
}

module.exports = { startScheduler };
