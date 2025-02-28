import React, { useState, useEffect } from 'react';
import { ChatBubbleLeftIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/solid';
import { GoogleGenerativeAI } from '@google/generative-ai';

const AiChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [genAI, setGenAI] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful English tutor. Guide learners in a conversational style, providing text-based responses only, without using markdown or any special formatting characters like asterisks."
  );
  // Add a chat session to maintain history
  const [chatSession, setChatSession] = useState(null);

  useEffect(() => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenerativeAI(apiKey);
      setGenAI(ai);
      
      // Initialize the chat session
      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
      const newChatSession = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: systemPrompt }]
          },
          {
            role: "model",
            parts: [{ text: "I understand. I'll act as a helpful English tutor and provide conversational guidance without special formatting." }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        },
      });
      
      setChatSession(newChatSession);
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && !imageFile) return;
    if (!genAI || !chatSession) {
      setConversation((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            "API key not configured or chat session not initialized. Please check your environment settings.",
        },
      ]);
      return;
    }

    const userMessage = message;
    setMessage('');
    setLoading(true);

    // Add user message to conversation
    setConversation((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        image: imagePreview,
      },
    ]);

    try {
      let result;
      
      if (imageFile) {
        // Convert image to Uint8Array
        const imageData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(new Uint8Array(reader.result));
          reader.readAsArrayBuffer(imageFile);
        });

        // For images, we need to use a different approach since chat history doesn't support images easily
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        // Prepare content with previous conversation context
        const historyContext = conversation.map(msg => 
          `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`
        ).join('\n');
        
        const prompt = [
          {
            text: `${systemPrompt}\n\nConversation history:\n${historyContext}\n\nNow the user has sent an image with this message: "${userMessage || "What's in this image?"}"`,
          },
          {
            inlineData: {
              data: Array.from(imageData),
              mimeType: imageFile.type,
            },
          },
        ];

        result = await model.generateContent(prompt);
      } else {
        // For text-only messages, use the chat session to maintain context
        result = await chatSession.sendMessage(userMessage);
      }

      const response = await result.response;
      const aiResponse = response.text();

      // Add AI response to conversation
      setConversation((prev) => [...prev, { role: "ai", content: aiResponse }]);

      // Clear image after sending
      clearImage();
    } catch (error) {
      console.error('Detailed error:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      if (error.message && error.message.includes('API key not valid')) {
        errorMessage = 'API key error. Please check the environment configuration.';
      }

      setConversation((prev) => [...prev, {
        role: 'ai',
        content: errorMessage
      }]);
    }

    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg flex items-center justify-center"
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <ChatBubbleLeftIcon className="h-6 w-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-96 h-[500px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg">
            <h3 className="text-lg font-semibold">Chat with AI (Gemini 2.0 Flash)</h3>
          </div>

          {/* Messages */}
         <div className="flex-1 p-4 overflow-y-auto space-y-4">
           {conversation.map((msg, index) => (
             <div
               key={index}
               className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
             >
               {msg.image && (
                 <div className="mb-2 rounded-lg overflow-hidden max-w-[200px]">
                   <img src={msg.image} alt="Uploaded content" className="w-full h-auto" />
                 </div>
               )}
               <div
                 className={`max-w-[80%] rounded-lg px-4 py-2 ${
                   msg.role === 'user'
                     ? 'bg-blue-600 text-white'
                     : 'bg-gray-100 text-gray-800'
                 }`}
               >
                 {msg.content}
               </div>
             </div>
           ))}
           {loading && (
             <div className="flex justify-start">
               <div className="bg-gray-100 text-gray-800 rounded-lg px-4 py-2">
                 Thinking...
               </div>
             </div>
           )}
         </div>

         {/* Image Preview */}
         {imagePreview && (
           <div className="px-4 pt-2">
             <div className="relative inline-block">
               <img
                 src={imagePreview}
                 alt="Preview"
                 className="h-20 w-auto rounded-lg"
               />
               <button
                 onClick={clearImage}
                 className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
               >
                 <XMarkIcon className="h-4 w-4" />
               </button>
             </div>
           </div>
         )}

         {/* Input */}
         <form onSubmit={handleSendMessage} className="border-t p-4">
           <div className="flex space-x-2">
             <input
               type="text"
               value={message}
               onChange={(e) => setMessage(e.target.value)}
               placeholder="Type your message..."
               className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
             />
             <label className="cursor-pointer">
               <input
                 type="file"
                 accept="image/*"
                 onChange={handleImageChange}
                 className="hidden"
               />
               <PhotoIcon className="h-10 w-10 text-blue-600 hover:text-blue-700 p-2" />
             </label>
             <button
               type="submit"
               disabled={loading}
               className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
             >
               Send
             </button>
           </div>
         </form>
        </div>
      )}
    </div>
  );
};

export default AiChat;