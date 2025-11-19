import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, AppConfig } from '../types';
import { GeminiChatService } from '../services/gemini';

interface Props {
  config: AppConfig;
  onBack: () => void;
}

export const ChatInterface: React.FC<Props> = ({ config, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatServiceRef = useRef<GeminiChatService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat
  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      try {
        chatServiceRef.current = new GeminiChatService();
        const initialResponse = await chatServiceRef.current.startChat(config);
        if (initialResponse) {
            setMessages([{ role: 'model', text: initialResponse, timestamp: Date.now() }]);
        }
      } catch (error) {
        console.error("Failed to start chat", error);
        setMessages([{ role: 'model', text: "Désolé, une erreur s'est produite. Veuillez réessayer.", timestamp: Date.now() }]);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, [config]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !chatServiceRef.current || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: inputValue, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await chatServiceRef.current.sendMessage(userMsg.text);
      if (responseText) {
          setMessages(prev => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
      }
    } catch (error) {
      console.error("Send failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 max-w-3xl mx-auto shadow-2xl">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <div>
                <h2 className="font-bold text-slate-800">French Tutor ({config.level})</h2>
                <p className="text-xs text-slate-500 truncate max-w-[200px]">{config.topic}</p>
            </div>
        </div>
        <div className="flex flex-wrap gap-1 justify-end max-w-[30%]">
            {config.words.slice(0, 3).map((w, i) => (
                <span key={i} className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{w}</span>
            ))}
            {config.words.length > 3 && <span className="text-[10px] text-slate-400">+{config.words.length - 3}</span>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm
              ${msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}
            `}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 p-4 pb-8 sm:pb-4">
        <div className="flex gap-2 items-end relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type in French..."
            className="w-full bg-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={`p-3 rounded-xl transition-all ${
              !inputValue.trim() || isLoading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
