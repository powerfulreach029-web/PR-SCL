
import React, { useState, useRef, useEffect } from 'react';
import { useSchool } from '../../App';
import { sendMessageToGemini } from '../../services/geminiService';
import { Cycle } from '../../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const ChatBot: React.FC = () => {
  const { students, grades, cycles, settings } = useSchool();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', text: 'Bonjour ! Je suis l\'assistant PR-SCL. Comment puis-je vous aider ?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  const getContext = () => {
    const studentCount = students.length;
    const gradeCount = grades.length;
    const cycleNames = Object.values(cycles).map((c: Cycle) => c.name).join(', ');
    
    return `
      Nom de l'école: ${settings.appName}
      Nombre d'élèves: ${studentCount}
      Nombre de notes: ${gradeCount}
      Cycles actifs: ${cycleNames}
      
      Dernier élève inscrit: ${students[students.length - 1]?.nom || 'Aucun'}
    `;
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const context = getContext();
    
    const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    const responseText = await sendMessageToGemini(userMessage.text, context, history);
    
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: responseText }]);
    setIsLoading(false);
  };

  // Simple Markdown Parser for Text Formatting
  const formatText = (text: string) => {
      // 1. Bold: **text** -> <strong>text</strong>
      let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // 2. Lists: - item -> <ul><li>item</li></ul> (basic implementation)
      // This basic replace handles single bullet points well enough for simple chat
      formatted = formatted.replace(/^\s*-\s+(.*)$/gm, '• $1');

      // 3. Newlines
      return formatted.split('\n').map((line, i) => (
          <React.Fragment key={i}>
              <span dangerouslySetInnerHTML={{ __html: line }} />
              <br />
          </React.Fragment>
      ));
  };

  return (
    <>
      {/* Floating Action Button (FAB) - FIXED POSITION */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 focus:outline-none bg-[var(--primary-color)] text-white neon-button flex items-center justify-center`}
        style={{ position: 'fixed', bottom: '24px', right: '24px' }}
        title="Assistant IA"
      >
        {isOpen ? <i className="fas fa-times text-2xl"></i> : <i className="fas fa-robot text-2xl animate-pulse"></i>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-white dark:bg-slate-900/80 dark:glass-card rounded-2xl shadow-2xl z-[9998] flex flex-col overflow-hidden border border-gray-200 dark:border-white/10 h-[500px] animate-fade-in-up transition-colors duration-200">
          {/* Header */}
          <div className="p-4 bg-[var(--primary-color)] text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <i className="fas fa-robot"></i>
              </div>
              <div>
                  <h3 className="font-bold text-sm">Assistant PR-SCL</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_5px_#4ade80]"></span>
                      <span className="text-xs opacity-90">En ligne - Gemini AI</span>
                  </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-transparent">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 {msg.role === 'model' && (
                     <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0 mr-2 flex items-center justify-center text-xs text-white shadow-sm">
                         <i className="fas fa-sparkles"></i>
                     </div>
                 )}
                 <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-[var(--primary-color)] text-white rounded-br-sm' 
                    : 'bg-white dark:bg-white/10 border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 rounded-bl-sm backdrop-blur-sm'
                 }`}>
                   {formatText(msg.text)}
                 </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                   <div className="bg-white dark:bg-white/10 border dark:border-white/5 rounded-2xl p-3 shadow-sm flex items-center gap-1 backdrop-blur-sm">
                       <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                       <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                       <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                   </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-transparent border-t dark:border-white/10 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Posez une question..."
              className="flex-1 bg-gray-100 dark:bg-slate-800/50 dark:text-white border-0 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] dark:placeholder-gray-400 transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[var(--primary-color)] text-white w-9 h-9 rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50 shadow-md transition-all neon-button"
            >
              <i className="fas fa-paper-plane text-xs"></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
};
