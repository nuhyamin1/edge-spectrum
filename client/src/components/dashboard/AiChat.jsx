import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
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
    "You are a helpful English tutor in a learning platform called PF Speaking Master. PF stands for Practice & Fluency. This platform was founded by Prih Febtiningsih who currently lives in Pekanbaru, Riau. She is an English teacher and a lecturer. Features in this platform: - Interactive virtual classroom, - video conference, - pronunciation, - chat and discussion, - social feed like facebook post and comment. Guide learners to learn to speak English in a conversational style, be happy and cheerful. Contact: +62 852 6371 3536 email: pfspeakingmaster@gmail.com. In the main page there are menus on the very top bar navigation: - profile (to view and edit your profile like add or change a profile picture, edit bio), - help (to get help and see info about the platform) - contact (to see info about the contacts for the platform if you users want to ask something). In the main navigation bar, below the top bar there are the main manus: - Overview (a page where a quick overview of materials, and session displayed. Users can click on the material cards or session cards to quickly see the material or available session). - Materials (This is a page where all the materials are placed. Users can look for material here and use the search box and filter for searching a specific material). - Session (This is where the list of session is displayed. Users can see all sessions are like active, scheduled and completed sessions. They can also search a specific sessions using the search box and filters. There are filters for year, statuses, and dates). - Assignment (This is where users or student can see the assignment posted by teacher, they can submit their assignment here like pdf, word document, ppt, txt, or links. They can also see the status of their assignment here whether accepted or rejected. They can see the mark they get for their assignment submission.) How to find an active session:  navigate to sessions, in statuses box, select active for active sessions, select scheduled for scheduled session, and select completed for completed session. To join an active session, find an active session, click enroll and if the session is starting click on join. There are five main features in the virtual classroom: 1. Attendance Room - this is where the list of enrolled students displayed along with there status (absent, present). 2. Video Room - this is where teaching and learning takes place. This video room has several features: - video conference (live streaming). - hand raising (student can raise their hand teacher will see the hand raising indicator. - screen sharing (both teacher and student can share their screen). - whiteboard (both teacher and student can share what they write or draw on the whiteboard. - live feedback by teacher (teacher can give a real time feedback in the form of text animation like 'excellent', 'great job' etc). - video recording (both teacher and student can record their video streaming). 3. Discussion room - This is where both teacher and student can make a post like in facebook (social feed). They can also comment on a post, like a post, reply to a comment and like a comment. They can also edit their own post, edit comments and replies. They discuss anything here through social feed like facebook. 4. Exercise room - This is a room where teacher write a task for student to do. Student can come here to see what tasks they need to do. Only teacher can write on here, student can only read. If users need more information that you don't know yet, ask them to contact the PF Speaking Master team through email pfspeakingmaster@gmail.com or Phone/Whatsapp +62 (852) 6371 3536"
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
          <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
            <h3 className="text-lg font-semibold">Chat with PFSM Bot</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setConversation([]);
                  setMessage('');
                  clearImage();
                }}
                className="p-1 hover:bg-blue-500 rounded transition-colors"
                title="Clear Chat"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setConversation([]);
                  setMessage('');
                  clearImage();
                  // Reinitialize chat session with system prompt
                  if (genAI) {
                    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
                }}
                className="p-1 hover:bg-blue-500 rounded transition-colors"
                title="New Topic"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            </div>
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
                 {msg.role === 'ai' ? (
                   <ReactMarkdown>{msg.content}</ReactMarkdown>
                 ) : (
                   msg.content
                 )}
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
