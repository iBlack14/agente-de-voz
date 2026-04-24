const contexts = new Map();

/**
 * Stores and retrieves transient call metadata based on Telnyx call IDs.
 */
module.exports = {
  setCallContext: (callId, context) => {
    if (!callId) return;
    contexts.set(callId, { ...context, timestamp: Date.now() });
    // Garbage collection for older contexts
    if (contexts.size > 200) {
      const oldest = Array.from(contexts.keys())[0];
      contexts.delete(oldest);
    }
  },
  getCallContext: (callId) => contexts.get(callId) || {},
  updateCallContext: (callId, partial) => {
    if (!callId) return {};
    const current = contexts.get(callId) || {};
    const next = { ...current, ...partial, timestamp: Date.now() };
    contexts.set(callId, next);
    return next;
  }
};
