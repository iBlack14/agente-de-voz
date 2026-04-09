// Shared State for Active Calls
const processedCalls = new Set();
const inflightOutbound = new Set();

module.exports = { processedCalls, inflightOutbound };
