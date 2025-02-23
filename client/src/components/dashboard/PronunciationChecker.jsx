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
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-4">Pronunciation Checker</h2>
      <div className="flex flex-col space-y-4">
        <textarea
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <SpeakerWaveIcon className="h-5 w-5 mr-2" />
            {isLoading ? 'Loading...' : ''}
          </button>
          <span className="text-sm text-gray-500">
            Powered by ElevenLabs Text-to-Speech
          </span>
        </div>
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
};

export default PronunciationChecker;
