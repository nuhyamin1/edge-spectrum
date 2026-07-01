const express = require('express');
const router = express.Router();
const axios = require('axios');

const DICTIONARY_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const TRANSLATION_API_URL = 'https://api.mymemory.translated.net/get';

const decodeHtmlEntities = (value = '') => (
  value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
);

const formatDictionaryEntry = (entry) => ({
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
  })),
  language: 'en'
});

const formatTranslationEntry = (word, language, translatedText, matches = []) => {
  const normalizedTranslation = decodeHtmlEntities(translatedText).trim();
  const alternatives = matches
    .map(match => decodeHtmlEntities(match.translation || '').trim())
    .filter(translation => (
      translation
      && translation !== normalizedTranslation
      && !translation.includes('\n')
    ))
    .slice(0, 5);

  return {
    word,
    phonetic: '',
    phonetics: [],
    meanings: [{
      partOfSpeech: 'translation',
      definitions: [{
        definition: normalizedTranslation,
        example: '',
        synonyms: [...new Set(alternatives)]
      }]
    }],
    language
  };
};

router.post('/', async (req, res) => {
  try {
    const { word, language = 'en' } = req.body;
    const trimmedWord = word?.trim();
    
    if (!trimmedWord) {
      return res.status(400).json({ error: 'Word is required' });
    }

    if (language === 'id-en' || language === 'id') {
      const langPair = language === 'id-en' ? 'en|id' : 'id|en';
      const response = await axios.get(TRANSLATION_API_URL, {
        params: {
          q: trimmedWord,
          langpair: langPair
        }
      });

      const translatedText = response.data?.responseData?.translatedText;

      if (!translatedText || response.data?.responseStatus >= 400) {
        return res.status(404).json({ error: 'Word not found in dictionary' });
      }

      return res.json(formatTranslationEntry(
        trimmedWord,
        language,
        translatedText,
        response.data?.matches || []
      ));
    }

    // Call the Free Dictionary API for English definitions.
    const response = await axios.get(`${DICTIONARY_API_URL}/${encodeURIComponent(trimmedWord)}`);
    
    if (!response.data || response.data.length === 0) {
      return res.status(404).json({ error: 'Word not found in dictionary' });
    }

    res.json(formatDictionaryEntry(response.data[0]));
  } catch (error) {
    console.error('Error calling dictionary service:', error);
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
