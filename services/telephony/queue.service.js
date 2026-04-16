/**
 * Simple Async Task Queue to handle concurrency limits (Telnyx D1).
 */
const { inflightOutbound, isInflightOutboundStale, removeInflightOutbound } = require('../callState');

class CallQueue {
  constructor(concurrency = 1) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
    this.cleanupInterval = setInterval(() => this.cleanupStale(), 60000);
  }

  /**
   * Adds a task to the queue and returns a promise for its completion.
   */
  async add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.next();
    });
  }

  cleanupStale() {
    for (const callId of inflightOutbound.keys()) {
      if (isInflightOutboundStale(callId)) {
        removeInflightOutbound(callId);
        console.log(`[Queue] Removed stale call from tracking: ${callId}`);
      }
    }
  }

  getActiveCallCount() {
    let active = 0;
    for (const callId of inflightOutbound.keys()) {
      if (!isInflightOutboundStale(callId)) {
        active++;
      }
    }
    return active;
  }

  async next() {
    if (this.queue.length === 0) {
      return;
    }

    const activeCalls = this.getActiveCallCount();
    
    // Check BEFORE starting new task to avoid exceeding limit
    if (activeCalls + this.running >= this.concurrency) {
      setTimeout(() => this.next(), 2000);
      return;
    }

    const { task, resolve, reject } = this.queue.shift();
    this.running++;

    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      setTimeout(() => this.next(), 1000);
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Single instance for the whole application
// Set default safe limit to 2 to avoid D1 errors on basic Telnyx accounts
const callQueue = new CallQueue(parseInt(process.env.MAX_CONCURRENT_CALLS) || 2);

module.exports = { callQueue };
