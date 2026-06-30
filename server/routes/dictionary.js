const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/', async (req, res) => {
  try {
    const { word } = req.body;
    
    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    // Call the Free Dictionary API
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    
    if (!response.data || response.data.length === 0) {
      return res.status(404).json({ error: 'Word not found in dictionary' });
    }

    // Extract relevant information from the first entry
    const entry = response.data[0];
    const wordData = {
      word: entry.word,
      phonetic: entry.phonetic || entry.phonetics?.[0]?.text || '',
      phonetics: entry.phonetics || [],
      meanings: entry.meanings.map(meaning => ({
        partOfSpeech: meaning.partOfSpeech,
        definitions: meaning.definitions.slice(0, 3).map(def => ({
          definition: def.definition,
          example: def.example || '',
          synonyms: def.synonyms || []
        }))
      }))
    };

    res.json(wordData);
  } catch (error) {
    console.error('Error calling Dictionary API:', error);
    if (error.response && error.response.status === 404) {
      res.status(404).json({ error: 'Word not found in dictionary' });
    } else {
      res.status(500).json({ 
        error: 'Failed to get definition',
        details: error.message 
      });
    }
  }
});

module.exports = router;
