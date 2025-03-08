const express = require('express');
const router = express.Router();
const gTTS = require('better-node-gtts');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure the TTS directory exists
const ttsDir = path.join(__dirname, '../public/tts');
if (!fs.existsSync(ttsDir)) {
  fs.mkdirSync(ttsDir, { recursive: true });
}

router.post('/', async (req, res) => {
  try {
    const { text, lang = 'en' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Generate a unique filename
    const filename = `${uuidv4()}.mp3`;
    const filePath = path.join(ttsDir, filename);
    
    // Generate speech using better-node-gtts
    await gTTS.save(filePath, text, lang);
    
    // Create a URL for the file
    const fileUrl = `/tts/${filename}`;
    
    res.json({ audio: fileUrl });
  } catch (error) {
    console.error('Error generating speech with better-node-gtts:', error);
    res.status(500).json({ 
      error: 'Failed to generate speech',
      details: error.message 
    });
  }
});

module.exports = router;