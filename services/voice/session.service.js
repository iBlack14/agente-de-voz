const WebSocket = require('ws');
const { transcribeAudio } = require('../ai/stt.service');
const { askLLM } = require('../ai/brain.service');
const { textToSpeech } = require('../ai/tts.service');
const { hangupCall } = require('../telephony/telnyxClient');
const { logCall } = require('../db/repository');
const { getCallContext } = require('../telephony/context.service');
const { getActivePrompt, getActiveReminderPrompt } = require('../prompts/promptService');
const { broadcastToMonitors, registerActiveSession, unregisterActiveSession } = require('./liveMonitor');

const readyGreetings = new Map();

const TIMEZONE_OFFSET = parseInt(process.env.TIMEZONE_OFFSET) || -5;
const DOMAIN_PLACEHOLDERS = [
  '{DOMAIN}', '{DOMINIO}', '{CLIENTE}', '{DATOS}',
  'aqui ira el dominio', '......', '...',
  '[dominio]', '(dominio)', '[datos]', '(datos)'
];

function getLocalTime() {
  return new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * TIMEZONE_OFFSET));
}

function getTimeGreeting() {
  const now = getLocalTime();
  const h = now.getHours();
  return h >= 5 && h < 12 ? 'Buenos días' : (h >= 12 && h < 19 ? 'Buenas tardes' : 'Buenas noches');
}

function replacePlaceholders(text, domainData) {
  let result = text
    .replace(/Buenas \(\)/gi, getTimeGreeting())
    .replace(/\(\)/g, getTimeGreeting());
  
  for (const placeholder of DOMAIN_PLACEHOLDERS) {
    result = result.split(placeholder).join(domainData);
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), domainData);
  }
  
  return result.trim();
}

/**
 * Orchestrates a complete voice AI session over WebSocket.
 */
function createSession(ws) {
  let callId = null;
  let streamId = null;
  let sessionActive = true;
  let isReminderCall = false;
  let conversationHistory = [];
  let isProcessing = false;
  let audioBuffer = Buffer.alloc(0);
  let abortController = null;
  let fullTranscript = '';
  let silenceCount = 0;
  let idleCount = 0;

  const meta = { startedAt: new Date().toISOString(), from: null, to: null, direction: 'inbound', transcriptLog: [], turnCount: 0 };

  const endSession = async (reason) => {
    if (!sessionActive) return;
    sessionActive = false;
    unregisterActiveSession(callId);
    try { require('../callState').removeInflightOutbound(callId); } catch(e){}
    broadcastToMonitors(callId, { type: 'session_end', reason });
    const endedAt = new Date().toISOString();
    const durationSec = Math.round((new Date(endedAt) - new Date(meta.startedAt)) / 1000);
    await logCall({ callId: callId || 'unknown', startedAt: meta.startedAt, endedAt, durationSec, turnCount: meta.turnCount, transcript: meta.transcriptLog, status: reason });
  };

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.event === 'start') {
        callId = msg.start?.call_control_id || msg.start?.stream_sid;
        streamId = msg.start?.stream_id || msg.stream_id;
        console.log(`[Session] Stream started: callId=${callId}, streamId=${streamId}`);
        registerActiveSession(callId, meta);
        const context = getCallContext(callId);
        isReminderCall = context?.mode === 'reminder';
        await sendGreeting();
      } else if (msg.event === 'stop') {
        await endSession('stop_event');
        ws.close();
      } else if (msg.event === 'media' && sessionActive) {
        if (msg.media.track === 'outbound') return;
        audioBuffer = Buffer.concat([audioBuffer, Buffer.from(msg.media.payload, 'base64')]);
        if (audioBuffer.length >= 6400) {
          const chunk = audioBuffer.subarray(0, 6400);
          audioBuffer = audioBuffer.subarray(6400);
          await handleAudioChunk(chunk);
        }
      }
    } catch (e) {
      console.error(`[Session] Unhandled error in ws message:`, e);
    }
  });

  ws.on('close', () => endSession('ws_close'));

  async function handleAudioChunk(chunk) {
    const userFragment = await transcribeAudio(chunk, callId);
    if (userFragment?.trim().length > 3) {
      fullTranscript += ' ' + userFragment;
      silenceCount = 0; idleCount = 0;
      if (isProcessing && abortController && !isReminderCall) {
        abortController.abort(); abortController = null; isProcessing = false;
      }
    } else { silenceCount++; idleCount++; }

    // Silencio Prolongado: auto-hangup
    if (idleCount >= 30 && conversationHistory.length <= 1 && !isReminderCall) {
      await speakText('No detecto a nadie en la línea. Hasta luego.');
      if (callId) await hangupCall(callId);
      return endSession('idle_timeout');
    }

    if (silenceCount >= 2 && fullTranscript.trim().length > 1 && !isProcessing) {
      const text = fullTranscript.trim(); fullTranscript = ''; silenceCount = 0;
      if (!isReminderCall) await processUserInput(text);
    }
  }

  async function processUserInput(userText) {
    isProcessing = true;
    conversationHistory.push({ role: 'user', content: userText });
    meta.turnCount++; meta.transcriptLog.push({ role: 'user', text: userText, at: new Date().toISOString() });
    broadcastToMonitors(callId, { type: 'transcript', role: 'user', text: userText });

    const aiResponse = await askLLM(conversationHistory, callId);
    conversationHistory.push({ role: 'assistant', content: aiResponse });
    meta.transcriptLog.push({ role: 'assistant', text: aiResponse, at: new Date().toISOString() });
    broadcastToMonitors(callId, { type: 'transcript', role: 'assistant', text: aiResponse });

    console.log(`[AI Answer] "${aiResponse}"`);
    await speakText(aiResponse);
    isProcessing = false;
  }

  async function speakText(text, preloadedStream = null) {
      if (!text || ws.readyState !== WebSocket.OPEN) {
          console.warn(`[SpeakText] Skipped: text=${!!text}, wsState=${ws.readyState}`);
          return 0;
      }
      abortController = new AbortController();
      let bytesSent = 0;
      try {
          console.log(`[SpeakText] Generating TTS for ${text.length} chars...`);
          const stream = preloadedStream || await textToSpeech(text, callId);
          if (!stream) {
              console.error('[SpeakText] TTS returned null stream!');
              return 0;
          }
          console.log(`[SpeakText] Got stream, sending chunks (streamId=${streamId})...`);
          for await (const chunk of stream) {
              if (abortController.signal.aborted) break;
              if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ event: 'media', stream_id: streamId, media: { payload: chunk.toString('base64') } }));
                  bytesSent += chunk.length;
              }
              await new Promise(r => setImmediate(r));
          }
          console.log(`[SpeakText] ✅ Sent ${bytesSent} bytes of audio`);
      } catch (e) {
          console.error('[SpeakText] ❌ Error:', e.message);
      } finally { abortController = null; }
      return bytesSent;
  }

  async function sendGreeting() {
    isProcessing = true;
    const context = getCallContext(callId);
    let greeting;
    let preStream = readyGreetings.get(callId);
    let preLoadedStream = null;

    if (preStream) {
      greeting = preStream.greeting; preLoadedStream = preStream.stream; readyGreetings.delete(callId);
    } else {
      if (context?.customGreeting) {
          greeting = `${context.customGreeting || ''} ${context.customInstructions || ''}`.trim();
      } else {
          const [identity, reminder] = await Promise.all([getActivePrompt(), getActiveReminderPrompt()]);
          greeting = isReminderCall ? `${reminder.greeting || ''} ${reminder.text || ''}`.trim() : identity.greeting;
      }
    }

    let domainData = context?.domain || 'su sitio web';
    
    if (domainData && domainData !== 'su sitio web') {
        const domains = domainData.split(/[,\s]+/).filter(d => d.trim().length > 0);
        if (domains.length > 0) {
            const list = domains.join(' y ');
            domainData = domains.length === 1 ? `${list}, repito, ${list}` : `${list}. Repito los dominios: ${list}`;
        }
    }
    
    greeting = replacePlaceholders(greeting, domainData);

    conversationHistory.push({ role: 'assistant', content: greeting });
    meta.transcriptLog.push({ role: 'assistant', text: greeting, at: new Date().toISOString() });

    console.log(`[Greeting] "${greeting}"`);
    broadcastToMonitors(callId, { type: 'transcript', role: 'assistant', text: greeting });
    const bytes = await speakText(greeting, preLoadedStream);

    if (isReminderCall) {
        // Cálculo exacto del tiempo de habla para no cortar el audio antes de tiempo
        const dur = (bytes / 160) * 20; 
        console.log(`[Recordatorio] Esperando ${Math.round(dur/1000)}s a que termine el audio...`);
        await new Promise(r => setTimeout(r, dur + 1500)); 
        
        console.log(`[Recordatorio] Mensaje entregado. Colgando llamada...`);
        if (callId) await hangupCall(callId);
        endSession('reminder_completed');
        return;
    }

    isProcessing = false;
  }
}

async function precomputeGreeting(callId) {
    if (!callId) return;
    try {
        const [identity, reminder] = await Promise.all([getActivePrompt(), getActiveReminderPrompt()]);
        const context = getCallContext(callId);
        let greeting = context?.customGreeting ? `${context.customGreeting} ${context.customInstructions}`.trim() : (context?.mode === 'reminder' ? `${reminder.greeting} ${reminder.text}`.trim() : identity.greeting);
        
        let domainData = context?.domain || 'su sitio web';
        if (domainData && domainData !== 'su sitio web') {
            const domains = domainData.split(/[,\s]+/).filter(d => d.trim().length > 0);
            if (domains.length > 0) {
                const list = domains.join(' y ');
                domainData = domains.length === 1 ? `${list}, repito, ${list}` : `${list}. Repito los dominios: ${list}`;
            }
        }
        
        greeting = replacePlaceholders(greeting, domainData);

        const stream = await textToSpeech(greeting, callId);
        if (stream) readyGreetings.set(callId, { stream, greeting });
    } catch (e) {}
}

module.exports = { createSession, precomputeGreeting };
