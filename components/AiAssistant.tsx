
import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Loader2, Sparkles, Minimize2, MessageSquare } from 'lucide-react';
import { aiService } from '../lib/aiService';
import { supabase } from '../lib/supabase';
import { Project } from '../types';

const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      supabase.from('project_dashboard').select('*').then(({ data }) => {
        setProjects(data || []);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMsg = message.trim();
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const aiResponse = await aiService.chatWithAssistant(userMsg, projects);
      setChatHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Chyba komunikace. Zkuste to prosím později." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-24 right-8 z-[100] md:bottom-8">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#5B9AAD] text-white rounded-full flex items-center justify-center shadow-xl hover:bg-[#4A8A9D] transition-all hover:scale-110 group relative"
          aria-label="Otevřít AI asistenta"
        >
          <Sparkles className="animate-pulse" size={24} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#10B981] rounded-full border-2 border-white"></span>
          <div className="absolute right-16 bg-[#0F172A] text-white text-xs py-2 px-3 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold">
            JK AI Asistent
          </div>
        </button>
      ) : (
        <div className="w-[350px] sm:w-[400px] h-[550px] bg-[#FAFBFC] border border-[#E2E5E9] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
          {/* Header */}
          <div className="bg-[#5B9AAD] p-5 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="font-bold text-base leading-none">JK AI Asistent</h3>
                <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1 font-bold">Online Poradce</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Minimize2 size={20} />
            </button>
          </div>

          {/* Chat Body */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 blueprint-grid">
            {chatHistory.length === 0 && (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-[#E1EFF3] rounded-2xl flex items-center justify-center mx-auto text-[#5B9AAD]">
                  <MessageSquare size={32} />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-[#0F172A]">Dobrý den!</p>
                  <p className="text-sm text-[#475569]">Jsem váš AI asistent pro JK Stavby. Ptejte se na stavbu, rozpočty nebo efektivitu portfolia.</p>
                </div>
                <div className="grid grid-cols-1 gap-2 pt-4">
                  <button onClick={() => setMessage("Která stavba má největší čerpání?")} className="text-[11px] font-bold text-[#5B9AAD] bg-white border border-[#E2E5E9] py-2 px-3 rounded-xl hover:border-[#5B9AAD] transition-all">"Která stavba má největší čerpání?"</button>
                  <button onClick={() => setMessage("Analyzuj rizika aktuálních projektů.")} className="text-[11px] font-bold text-[#5B9AAD] bg-white border border-[#E2E5E9] py-2 px-3 rounded-xl hover:border-[#5B9AAD] transition-all">"Analyzuj rizika projektů"</button>
                </div>
              </div>
            )}
            
            {chatHistory.map((chat, i) => (
              <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                  chat.role === 'user' 
                  ? 'bg-[#5B9AAD] text-white rounded-tr-none' 
                  : 'bg-white border border-[#E2E5E9] text-[#0F172A] rounded-tl-none shadow-sm'
                }`}>
                  {chat.text}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#E2E5E9] p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-[#5B9AAD]" />
                  <span className="text-xs font-bold text-[#475569] animate-pulse">AI přemýšlí...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <div className="p-4 bg-white border-t border-[#E2E5E9]">
            <div className="relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Napište svůj dotaz..."
                className="w-full pl-4 pr-12 py-3 bg-[#F8F9FA] border border-[#E2E5E9] rounded-2xl text-sm focus:outline-none focus:border-[#5B9AAD] transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#5B9AAD] text-white rounded-xl flex items-center justify-center hover:bg-[#4A8A9D] transition-colors disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
