import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  SparklesIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const legacyGreetingContent = "Hi, I'm PFSM Bot. How can I help today?";
const CHAT_STORAGE_KEY = 'pfsm-ai-chat-conversation';
const WELCOME_BUBBLE_STORAGE_KEY = 'pfsm-ai-chat-welcome-bubble';

const getFirstName = (user) => {
  const fallback = user?.role === 'teacher' ? 'Teacher' : 'there';
  return user?.name?.trim().split(/\s+/)[0] || fallback;
};

const createInitialGreeting = (user) => ({
  role: 'ai',
  content: `Welcome back, ${getFirstName(user)}! I'm PFSM Bot. I can help you find pages, understand lessons, review assignments, or answer questions about the website.`,
  isGreeting: true
});

const isGreeting = (entry) => (
  entry?.role === 'ai' && (entry?.isGreeting || entry?.content === legacyGreetingContent)
);

const loadStoredConversation = (initialGreeting) => {
  try {
    const storedConversation = sessionStorage.getItem(CHAT_STORAGE_KEY);
    const parsedConversation = storedConversation ? JSON.parse(storedConversation) : null;

    if (Array.isArray(parsedConversation) && parsedConversation.length > 0) {
      if (parsedConversation.length === 1 && isGreeting(parsedConversation[0])) {
        return [initialGreeting];
      }

      return parsedConversation;
    }
  } catch (error) {
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
  }

  return [initialGreeting];
};

const AiChat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const initialGreeting = useMemo(() => createInitialGreeting(user), [user]);
  const userWelcomeKey = `${WELCOME_BUBBLE_STORAGE_KEY}:${user?._id || user?.id || user?.email || 'guest'}`;
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState(() => loadStoredConversation(initialGreeting));
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(false);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [conversation, loading, isOpen]);

  useEffect(() => {
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(conversation));
  }, [conversation]);

  useEffect(() => {
    setConversation((currentConversation) => (
      currentConversation.length === 1 && isGreeting(currentConversation[0])
        ? [initialGreeting]
        : currentConversation
    ));
  }, [initialGreeting]);

  useEffect(() => {
    if (!user) return;

    setShowWelcomeBubble(sessionStorage.getItem(userWelcomeKey) !== 'dismissed');
  }, [user, userWelcomeKey]);

  const dismissWelcomeBubble = () => {
    setShowWelcomeBubble(false);
    sessionStorage.setItem(userWelcomeKey, 'dismissed');
  };

  const handleToggleChat = () => {
    setIsOpen((open) => {
      const nextOpen = !open;

      if (nextOpen) {
        dismissWelcomeBubble();
      }

      return nextOpen;
    });
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetChat = () => {
    setConversation([initialGreeting]);
    setMessage('');
    clearImage();
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const fileToBase64 = (file) => (
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        resolve(result.split(',')[1] || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    })
  );

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if ((!trimmedMessage && !imageFile) || loading) return;

    const userEntry = {
      role: 'user',
      content: trimmedMessage || 'Please look at this image.',
      image: imagePreview
    };
    const history = conversation.filter((entry) => !isGreeting(entry));

    setConversation((prev) => [...prev, userEntry]);
    setMessage('');
    setLoading(true);

    try {
      const image = imageFile
        ? {
            data: await fileToBase64(imageFile),
            mimeType: imageFile.type
          }
        : null;

      const response = await axios.post('/api/ai-chat', {
        message: trimmedMessage,
        conversation: history,
        image
      });

      setConversation((prev) => [
        ...prev,
        {
          role: 'ai',
          content: response.data.reply
        }
      ]);

      clearImage();
    } catch (error) {
      setConversation((prev) => [
        ...prev,
        {
          role: 'ai',
          content: error.response?.data?.error || 'Sorry, I could not get an answer right now.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markdownComponents = {
    a: ({ href, children, ...props }) => {
      const isInternalLink = href?.startsWith('/');

      return (
        <a
          href={href}
          className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-800"
          target={isInternalLink ? undefined : '_blank'}
          rel={isInternalLink ? undefined : 'noreferrer'}
          onClick={(event) => {
            if (!isInternalLink) return;

            event.preventDefault();
            navigate(href);
            setIsOpen(false);
          }}
          {...props}
        >
          {children}
        </a>
      );
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <section
          className="fixed bottom-20 right-3 flex h-[min(76vh,620px)] w-[calc(100vw-1.5rem)] max-w-[440px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:right-4 sm:h-[600px]"
          aria-label="AI chat"
        >
          <header className="flex items-center justify-between border-b border-slate-200 bg-slate-950 px-4 py-3 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500">
                <SparklesIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold">PFSM Bot</h3>
                <p className="truncate text-xs text-slate-300">English tutor and app helper</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={resetChat}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                title="New chat"
                aria-label="New chat"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setConversation([initialGreeting])}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                title="Clear messages"
                aria-label="Clear messages"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                title="Close chat"
                aria-label="Close chat"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div
            ref={messagesContainerRef}
            className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4"
          >
            {conversation.map((entry, index) => (
              <div
                key={`${entry.role}-${index}`}
                className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    entry.role === 'user'
                      ? 'rounded-br-md bg-blue-600 text-white'
                      : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  {entry.image && (
                    <img
                      src={entry.image}
                      alt=""
                      className="mb-3 max-h-44 w-full rounded-xl object-cover"
                    />
                  )}
                  {entry.role === 'ai' ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
                      <ReactMarkdown components={markdownComponents}>{entry.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{entry.content}</p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {imagePreview && (
            <div className="border-t border-slate-200 bg-white px-4 py-3">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200">
                <img src={imagePreview} alt="Selected upload" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white"
                  title="Remove image"
                  aria-label="Remove image"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-end gap-2">
              <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <PhotoIcon className="h-5 w-5" />
                <span className="sr-only">Attach image</span>
              </label>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSendMessage(event);
                  }
                }}
                rows={1}
                placeholder="Ask anything..."
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="submit"
                disabled={loading || (!message.trim() && !imageFile)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                title="Send"
                aria-label="Send"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </form>
        </section>
      )}

      {!isOpen && showWelcomeBubble && (
        <div className="absolute bottom-16 right-0 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-700 shadow-2xl shadow-blue-950/15">
          <button
            type="button"
            onClick={dismissWelcomeBubble}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            title="Dismiss greeting"
            aria-label="Dismiss greeting"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleToggleChat}
            className="block w-full pr-7 text-left"
            aria-label="Open AI chat"
          >
            <span className="block font-semibold text-slate-950">Hi, {getFirstName(user)}!</span>
            <span className="mt-1 block leading-relaxed">
              Welcome back. I'm here if you need help finding lessons, assignments, or anything on PF Speaking Master.
            </span>
          </button>
          <span className="absolute bottom-[-7px] right-6 h-4 w-4 rotate-45 border-b border-r border-blue-100 bg-white" aria-hidden="true" />
        </div>
      )}

      <button
        type="button"
        onClick={handleToggleChat}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-900/20 transition-transform hover:scale-105 hover:bg-blue-700"
        aria-label={isOpen ? 'Close AI chat' : 'Open AI chat'}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <ChatBubbleLeftRightIcon className="h-7 w-7" />
        )}
      </button>
    </div>
  );
};

export default AiChat;
