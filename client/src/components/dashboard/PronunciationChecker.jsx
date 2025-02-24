import React, { useState } from 'react';
import axios from '../../utils/axios';
import { SpeakerWaveIcon } from '@heroicons/react/24/outline';

const PronunciationChecker = () => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePronounce = async () => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/pronounce', { text });
      
      // Create an audio element and play the returned audio
      const audio = new Audio(`data:audio/mpeg;base64,${response.data.audio}`);
      audio.play();
    } catch (err) {
      setError('Failed to get pronunciation. Please try again.');
      console.error('Pronunciation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-orange-500/5 border border-orange-400 hover:bg-orange-500/15 hover:shadow-lg transition-all duration-200 rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-4">Pronunciation Checker</h2>
      <div className="flex flex-col space-y-4">
        <textarea
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Enter text to hear pronunciation..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
        <div className="flex items-center justify-between">
          <button
            onClick={handlePronounce}
            disabled={isLoading || !text.trim()}
            className={`flex items-center px-4 py-2 rounded-lg text-white ${
              isLoading || !text.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-orange-600 hover:bg-orange-700'
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
                <SpeakerWaveIcon className="h-5 w-5 mr-2" />
                Pronounce
              </>
            )}
          </button>
          <span className="text-sm text-gray-500">Powered by ElevenLabs</span>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default PronunciationChecker;
