const express = require('express');
const router = express.Router();
const axios = require('axios');

// You'll need to set this in your environment variables
const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
// Using the "Rachel" voice ID which is one of ElevenLabs' default voices
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_LABS_API_KEY
      },
      data: {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75
        }
      },
      responseType: 'arraybuffer'
    });

    // Convert the audio buffer to base64
    const audioBase64 = Buffer.from(response.data).toString('base64');
    
    res.json({ audio: audioBase64 });
  } catch (error) {
    console.error('Error calling ElevenLabs API:', error);
    res.status(500).json({ 
      error: 'Failed to get pronunciation',
      details: error.response?.data || error.message 
    });
  }
});

module.exports = router;
