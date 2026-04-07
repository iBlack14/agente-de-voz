/**
 * Simple Async Task Queue to handle concurrency limits (Telnyx D1).
 */
class CallQueue {
  constructor(concurrency = 1) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
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

  async next() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
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
      // Small cooldown between tasks to let the channel fully release
      setTimeout(() => this.next(), 1000);
    }
  }
}

// Single instance for the whole application
const callQueue = new CallQueue(parseInt(process.env.MAX_CONCURRENT_CALLS) || 1);

module.exports = { callQueue };
