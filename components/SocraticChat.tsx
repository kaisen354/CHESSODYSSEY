
import React, { useRef, useEffect, useState } from 'react';
import { Send, Bot, User, BrainCircuit, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';

interface SocraticChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isThinking: boolean;
}

const SocraticChat: React.FC<SocraticChatProps> = ({ messages, onSendMessage, isThinking }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    onSendMessage(input);
    setInput('');
  };

  // Helper to parse simple Markdown (**bold**)
  const formatMessage = (text: string) => {
    // Split by **text** patterns
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="text-amber-400 font-bold not-italic">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-white/5 bg-slate-900/20 backdrop-blur-md flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shadow-lg relative overflow-hidden group">
            <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <BrainCircuit className="w-4 h-4 text-amber-500 relative z-10" />
          </div>
          <div>
            <h3 className="cinematic-text text-sm font-bold text-slate-100 tracking-wide">Caissa's Shadow</h3>
            <p className="text-[10px] text-amber-500/80 uppercase tracking-widest font-bold">Grandmaster AI</p>
          </div>
        </div>
        <div className="flex gap-1.5 items-center">
             <span className="text-[10px] text-slate-500 font-mono">ONLINE</span>
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin relative z-0" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60 animate-in fade-in duration-1000">
            <div className="w-16 h-16 rounded-full bg-slate-900/50 flex items-center justify-center mb-4 border border-white/5">
                <Sparkles size={24} className="text-amber-500/50" />
            </div>
            <p className="text-sm text-center max-w-[200px] font-serif italic text-slate-500">
                "The board is a mirror of the mind. Speak your plan."
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} group animate-in slide-in-from-bottom-2 duration-500`}
          >
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg border ${
              msg.role === 'user' 
                ? 'bg-slate-800 border-slate-600 text-slate-300' 
                : 'bg-gradient-to-br from-amber-950 to-slate-950 border-amber-900/30 text-amber-500'
            }`}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            
            <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed backdrop-blur-md shadow-md font-serif relative overflow-hidden border ${
                msg.role === 'user'
                  ? 'bg-slate-800/80 text-slate-100 rounded-tr-sm border-white/10'
                  : 'bg-black/40 text-slate-300 rounded-tl-sm border-white/5'
              }`}>
                {msg.role === 'model' && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/30"></div>}
                
                {/* Render Formatted Text */}
                <span>{formatMessage(msg.text)}</span>
              </div>
              
              {/* Validation Status Badge */}
              {msg.moveValidity && (
                <div className={`mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
                  msg.moveValidity === 'valid' 
                    ? 'text-emerald-400 bg-emerald-950/30 border-emerald-500/20' 
                    : 'text-red-400 bg-red-950/30 border-red-500/20'
                }`}>
                  {msg.moveValidity === 'valid' ? (
                    <>
                      <CheckCircle2 size={10} /> Valid Move
                    </>
                  ) : (
                    <>
                      <XCircle size={10} /> Illegal Move
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-950 border border-amber-500/20 flex items-center justify-center">
              <Bot size={14} className="text-amber-500" />
            </div>
            <div className="bg-slate-900/50 p-4 rounded-2xl rounded-tl-sm border border-white/5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-amber-500/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-amber-500/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-amber-500/60 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-gradient-to-t from-slate-950 to-slate-950/0 backdrop-blur-lg border-t border-white/5 relative z-10">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-purple-500/5 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Discuss strategy..."
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-3.5 pl-5 pr-14 text-sm text-slate-200 focus:outline-none focus:border-amber-500/30 focus:ring-1 focus:ring-amber-500/20 placeholder-slate-500 transition-all font-serif shadow-inner"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isThinking}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SocraticChat;
