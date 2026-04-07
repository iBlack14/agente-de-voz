const axios = require('axios');
const { getActivePrompt, getActiveReminderPrompt } = require('../prompts/promptService');
const { logUsage } = require('../db/repository');

const MODEL = process.env.LLM_MODEL || 'llama-3.1-8b-instant';
const MAX_HISTORY = 10;
const MAX_TOKENS = 150;
const TEMPERATURE = 0.7;

/**
 * Orchestrates LLM requests with dynamic system prompts (Identity or Campaign).
 */
async function askLLM(conversationHistory, callId) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "ERROR: NO API KEY";

  try {
    const [identity, reminder] = await Promise.all([
      getActivePrompt(),
      getActiveReminderPrompt()
    ]);

    let systemPrompt = identity.text || "";
    if (reminder.text?.trim()) {
        systemPrompt += '\n\n' + '=== INSTRUCCIONES DE LA CAMPAÑA ACTUAL ===\n' + reminder.text;
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: MODEL,
        messages: [{ role: 'system', content: systemPrompt }, ...conversationHistory.slice(-MAX_HISTORY)],
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    // LOG USAGE (TOKENS)
    const usage = response.data?.usage;
    if (usage && callId) {
        Promise.all([
            logUsage({ callId, service: 'groq', metric: 'tokens_in', value: usage.prompt_tokens }),
            logUsage({ callId, service: 'groq', metric: 'tokens_out', value: usage.completion_tokens })
        ]).catch(() => {});
    }

    return response.data?.choices?.[0]?.message?.content || 'Lo siento, no pude procesar tu solicitud.';
  } catch (err) {
    console.error(`[Brain Service] Error (${MODEL}):`, err.message);
    return 'Disculpa, tuve un problema procesando tu respuesta. ¿Puedes repetir?';
  }
}

module.exports = { askLLM };
