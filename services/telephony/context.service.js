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
  getCallContext: (callId) => contexts.get(callId) || {}
};
