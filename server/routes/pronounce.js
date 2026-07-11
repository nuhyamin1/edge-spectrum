const express = require('express');
const router = express.Router();
const axios = require('axios');

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY || process.env.SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || process.env.SPEECH_REGION;

const DIALECTS = {
  'en-US': {
    label: 'American English',
    voice: process.env.AZURE_SPEECH_VOICE_EN_US || 'en-US-JennyNeural',
    gender: 'Female'
  },
  'en-GB': {
    label: 'British English',
    voice: process.env.AZURE_SPEECH_VOICE_EN_GB || 'en-GB-SoniaNeural',
    gender: 'Female'
  }
};
const MAX_CACHE_ITEMS = 200;
const pronunciationCache = new Map();

const escapeSsml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const getErrorDetails = (error) => {
  if (Buffer.isBuffer(error.response?.data)) {
    return error.response.data.toString('utf8');
  }

  return error.response?.data || error.message;
};

router.post('/', async (req, res) => {
  try {
    const { text, dialect = 'en-US' } = req.body;
    const trimmedText = typeof text === 'string' ? text.trim() : '';
    
    if (!trimmedText) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
      return res.status(500).json({
        error: 'Azure Speech is not configured',
        details: 'Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in the server environment.'
      });
    }

    const selectedDialect = DIALECTS[dialect] || DIALECTS['en-US'];
    const selectedDialectCode = DIALECTS[dialect] ? dialect : 'en-US';
    const cacheKey = `${selectedDialectCode}:${trimmedText.toLowerCase()}`;
    const cachedAudio = pronunciationCache.get(cacheKey);

    if (cachedAudio) {
      return res.json({
        audio: cachedAudio,
        provider: 'azure',
        dialect: selectedDialectCode,
        voice: selectedDialect.voice,
        label: selectedDialect.label,
        cached: true
      });
    }

    const ssml = `
      <speak version="1.0" xml:lang="${selectedDialectCode}">
        <voice xml:lang="${selectedDialectCode}" xml:gender="${selectedDialect.gender}" name="${selectedDialect.voice}">
          <prosody rate="-8%">${escapeSsml(trimmedText)}</prosody>
        </voice>
      </speak>
    `.trim();

    const response = await axios({
      method: 'POST',
      url: `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/ssml+xml',
        'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
        'User-Agent': 'PF Speaking Master'
      },
      data: ssml,
      responseType: 'arraybuffer'
    });

    const audioBase64 = Buffer.from(response.data).toString('base64');

    if (pronunciationCache.size >= MAX_CACHE_ITEMS) {
      pronunciationCache.delete(pronunciationCache.keys().next().value);
    }
    pronunciationCache.set(cacheKey, audioBase64);
    
    res.json({
      audio: audioBase64,
      provider: 'azure',
      dialect: selectedDialectCode,
      voice: selectedDialect.voice,
      label: selectedDialect.label
    });
  } catch (error) {
    console.error('Error calling Azure Speech API:', error);
    res.status(500).json({ 
      error: 'Failed to get pronunciation',
      details: getErrorDetails(error)
    });
  }
});

module.exports = router;
