const express = require('express');
const router = express.Router();
const axios = require('axios');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
const ELEVENLABS_MODEL = process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5';

const DIALECTS = {
  'en-US': {
    label: 'American English',
    voice: process.env.ELEVENLABS_VOICE_EN_US || 'EXAVITQu4vr4xnSDxMaL',
    voiceName: 'Sarah'
  },
  'en-GB': {
    label: 'British English',
    voice: process.env.ELEVENLABS_VOICE_EN_GB || 'Xb7hH8MSUJpSbSDYk0k2',
    voiceName: 'Alice'
  }
};
const MAX_CACHE_ITEMS = 200;
const pronunciationCache = new Map();

const sendPronunciation = (req, res, audioBuffer, dialectCode, dialect, cached = false) => {
  const acceptsAudio = req.get('Accept')
    ?.split(',')
    .some((type) => type.trim().toLowerCase().startsWith('audio/mpeg'));

  if (acceptsAudio) {
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'private, max-age=3600',
      'X-Pronunciation-Dialect': dialectCode,
      'X-Pronunciation-Voice': dialect.voice
    });
    return res.send(audioBuffer);
  }

  return res.json({
    audio: audioBuffer.toString('base64'),
    provider: 'elevenlabs',
    dialect: dialectCode,
    voice: dialect.voice,
    voiceName: dialect.voiceName,
    label: dialect.label,
    ...(cached && { cached: true })
  });
};

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

    if (!ELEVENLABS_API_KEY) {
      return res.status(500).json({
        error: 'ElevenLabs is not configured',
        details: 'Set ELEVENLABS_API_KEY in the server environment.'
      });
    }

    const selectedDialect = DIALECTS[dialect] || DIALECTS['en-US'];
    const selectedDialectCode = DIALECTS[dialect] ? dialect : 'en-US';
    const cacheKey = `${selectedDialectCode}:${trimmedText.toLowerCase()}`;
    const cachedAudio = pronunciationCache.get(cacheKey);

    if (cachedAudio) {
      return sendPronunciation(
        req,
        res,
        cachedAudio,
        selectedDialectCode,
        selectedDialect,
        true
      );
    }

    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${selectedDialect.voice}`,
      params: {
        output_format: 'mp3_44100_128'
      },
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      data: {
        text: trimmedText,
        model_id: ELEVENLABS_MODEL,
        language_code: 'en',
        voice_settings: {
          stability: 0.65,
          similarity_boost: 0.8,
          style: 0,
          use_speaker_boost: true
        }
      },
      responseType: 'arraybuffer'
    });

    const audioBuffer = Buffer.from(response.data);

    if (pronunciationCache.size >= MAX_CACHE_ITEMS) {
      pronunciationCache.delete(pronunciationCache.keys().next().value);
    }
    pronunciationCache.set(cacheKey, audioBuffer);

    return sendPronunciation(req, res, audioBuffer, selectedDialectCode, selectedDialect);
  } catch (error) {
    console.error('Error calling ElevenLabs API:', getErrorDetails(error));
    res.status(500).json({ 
      error: 'Failed to get pronunciation',
      details: getErrorDetails(error)
    });
  }
});

module.exports = router;
