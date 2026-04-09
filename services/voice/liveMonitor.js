/**
 * Live Monitor Service
 * Allows the dashboard to listen to active calls in real-time.
 * Audio is broadcast from the voice session to connected monitors.
 */

const monitorClients = new Map(); // callId -> Set<WebSocket>

module.exports = {
  /**
   * Register a dashboard WebSocket to listen to a specific call
   */
  addMonitor: (callId, ws) => {
    if (!monitorClients.has(callId)) monitorClients.set(callId, new Set());
    monitorClients.get(callId).add(ws);
    console.log(`[LiveMonitor] 👁️ Dashboard listener joined call ${callId.slice(-8)} (${monitorClients.get(callId).size} listeners)`);
    
    // Send history to the new listener
    const sessionMeta = module.exports.activeSessions.get(callId);
    if (sessionMeta && Array.isArray(sessionMeta.transcriptLog)) {
      sessionMeta.transcriptLog.forEach(log => {
        if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'transcript', role: log.role, text: log.text }));
      });
    }

    ws.on('close', () => {
      const set = monitorClients.get(callId);
      if (set) { set.delete(ws); if (set.size === 0) monitorClients.delete(callId); }
    });
  },

  /**
   * Broadcast an audio chunk + text event to all monitors of a call
   */
  broadcastToMonitors: (callId, event) => {
    const listeners = monitorClients.get(callId);
    if (!listeners || listeners.size === 0) return;
    
    const msg = JSON.stringify(event);
    listeners.forEach(ws => {
      if (ws.readyState === 1) ws.send(msg);
    });
  },

  /**
   * Get list of calls being monitored
   */
  getMonitoredCalls: () => Array.from(monitorClients.keys()),

  /**
   * Get active call IDs that have sessions
   */
  activeSessions: new Map(), // callId -> { from, to, startedAt }

  registerActiveSession: (callId, meta) => {
    module.exports.activeSessions.set(callId, meta);
  },

  unregisterActiveSession: (callId) => {
    module.exports.activeSessions.delete(callId);
    monitorClients.delete(callId);
  }
};
