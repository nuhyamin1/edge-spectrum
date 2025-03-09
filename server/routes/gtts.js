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

// Clean up old TTS files (older than 1 hour)
const cleanupOldFiles = () => {
  fs.readdir(ttsDir, (err, files) => {
    if (err) {
      console.error('Error reading TTS directory:', err);
      return;
    }

    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(ttsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('Error getting file stats:', err);
          return;
        }

        // Remove files older than 1 hour
        if (now - stats.mtime.getTime() > 3600000) {
          fs.unlink(filePath, err => {
            if (err) console.error('Error deleting old file:', err);
          });
        }
      });
    });
  });
};

// Run cleanup every hour
setInterval(cleanupOldFiles, 3600000);

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
    
    // Verify the file was created and is not empty
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      throw new Error('Failed to generate audio file');
    }
    
    // Create a URL for the file
    const fileUrl = `/tts/${filename}`;
    
    // Set appropriate headers
    res.set({
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json'
    });
    
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