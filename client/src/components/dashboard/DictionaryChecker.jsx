import React, { useState } from 'react';
import axios from '../../utils/axios';
import { BookOpenIcon } from '@heroicons/react/24/outline';

const DictionaryChecker = () => {
  const [word, setWord] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [definition, setDefinition] = useState(null);

  const handleLookup = async () => {
    if (!word.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setDefinition(null);
    
    try {
      const response = await axios.post('/api/dictionary', { word });
      setDefinition(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Word not found in dictionary. Please check the spelling.');
      } else {
        setError('Failed to get definition. Please try again.');
      }
      console.error('Dictionary error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-blue-500/5 border border-blue-400 hover:bg-blue-500/15 hover:shadow-lg transition-all duration-200 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-4">Dictionary</h2>
      <div className="flex flex-col space-y-4">
        <input
          type="text"
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter a word to look up..."
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
        />
        <div className="flex items-center justify-between">
          <button
            onClick={handleLookup}
            disabled={isLoading || !word.trim()}
            className={`flex items-center px-4 py-2 rounded-lg text-white ${
              isLoading || !word.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z" />
                </svg>
                Loading...
              </>
            ) : (
              <>
                <BookOpenIcon className="h-5 w-5 mr-2" />
                Look Up
              </>
            )}
          </button>
          <span className="text-sm text-gray-500">Powered by Free Dictionary API</span>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        {definition && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-gray-800">{definition.word}</h3>
              {definition.phonetic && (
                <span className="text-gray-500 text-sm">{definition.phonetic}</span>
              )}
            </div>
            
            {definition.meanings && definition.meanings.map((meaning, index) => (
              <div key={index} className="mb-4">
                <h4 className="font-semibold text-blue-600 capitalize mb-2">
                  {meaning.partOfSpeech}
                </h4>
                {meaning.definitions.map((def, defIndex) => (
                  <div key={defIndex} className="ml-4 mb-3">
                    <p className="text-gray-700">
                      <span className="font-medium">{defIndex + 1}.</span> {def.definition}
                    </p>
                    {def.example && (
                      <p className="text-gray-500 text-sm italic mt-1">
                        Example: "{def.example}"
                      </p>
                    )}
                    {def.synonyms && def.synonyms.length > 0 && (
                      <p className="text-gray-600 text-sm mt-1">
                        <span className="font-medium">Synonyms:</span> {def.synonyms.slice(0, 5).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DictionaryChecker;
