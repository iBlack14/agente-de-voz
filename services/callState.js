// Shared State for Active Calls with timestamp tracking
const processedCalls = new Map();
const inflightOutbound = new Map();
const callIntervals = new Map();
const STALE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// Clear everything on startup to avoid stale blocks
inflightOutbound.clear();
processedCalls.clear();
callIntervals.clear();

function addProcessedCall(callId) {
  processedCalls.set(callId, Date.now());
}

function removeProcessedCall(callId) {
  processedCalls.delete(callId);
}

function isProcessedCallStale(callId) {
  const ts = processedCalls.get(callId);
  return !ts || (Date.now() - ts > STALE_TIMEOUT_MS);
}

function addInflightOutbound(callId) {
  inflightOutbound.set(callId, Date.now());
}

function removeInflightOutbound(callId) {
  inflightOutbound.delete(callId);
}

function isInflightOutboundStale(callId) {
  const ts = inflightOutbound.get(callId);
  return !ts || (Date.now() - ts > STALE_TIMEOUT_MS);
}

function clearStaleProcessedCalls() {
  for (const [callId, ts] of processedCalls) {
    if (Date.now() - ts > STALE_TIMEOUT_MS) {
      processedCalls.delete(callId);
    }
  }
}

function clearStaleInflightOutbound() {
  for (const [callId, ts] of inflightOutbound) {
    if (Date.now() - ts > STALE_TIMEOUT_MS) {
      inflightOutbound.delete(callId);
    }
  }
}

function clearStaleCalls() {
  clearStaleProcessedCalls();
  clearStaleInflightOutbound();
}

module.exports = { 
  processedCalls, 
  inflightOutbound,
  addProcessedCall,
  removeProcessedCall,
  isProcessedCallStale,
  addInflightOutbound,
  removeInflightOutbound,
  isInflightOutboundStale,
  clearStaleCalls
};
