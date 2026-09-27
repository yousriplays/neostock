import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import api from '../api';

const AIChat = () => {
  const [messages, setMessages] = useState([
    { 
      role: 'ai', 
      content: '🇹🇳 Bonjour ! Je suis l\'assistant IA de **neostock**. Posez-moi vos questions sur :\n\n• Stock et réapprovisionnement\n• Préparation Ramadan / été\n• Marges et prix\n• Fournisseurs\n• Prévisions de demande',
      sources: ['Google Gemini 2.5 Flash', 'neostock RAG']
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userMessage });
      const data = res.data;
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: data.response || data.message || "Pas de réponse disponible.",
        sources: data.sources || [],
        model: data.model_used || '',
        matched: data.matched_products || 0
      }]);
    } catch (error) {
      console.error("Chat API error:", error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: "⚠️ Erreur de connexion au serveur. Vérifiez que le backend est actif sur le port 8000.",
        sources: []
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick suggestions
  const suggestions = [
    "Comment préparer mon stock pour le Ramadan ?",
    "Quel produit est en rupture ?",
    "Analyse des marges",
    "Fournisseurs et commandes"
  ];

  const handleSuggestion = (text) => {
    setInput(text);
  };

  // Simple markdown-like rendering for bold text
  const renderContent = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      // Handle newlines
      return part.split('\n').map((line, j) => (
        <React.Fragment key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </React.Fragment>
      ));
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <img src="/logo.png" alt="neostock" className="w-5 h-5 object-contain" />
          Assistant IA neostock
          <span className="text-[10px] font-bold px-2 py-0.5 bg-white border border-green-200 rounded-full text-green-700 ml-auto">
            Gemini 2.5 Flash
          </span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">Chat IA contextuel — données en temps réel</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50" style={{ minHeight: '300px', maxHeight: '500px' }}>
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[90%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-gray-200' : 'bg-primary text-white'}`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div>
                <div className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-white border border-gray-200 text-gray-800 rounded-tr-none' : 'bg-primary text-white rounded-tl-none'}`}>
                  {renderContent(msg.content)}
                </div>
                {/* Sources badge for AI messages */}
                {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && index > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5 ml-1">
                    {msg.sources.map((s, i) => (
                      <span key={i} className="text-[9px] font-semibold px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded-full text-gray-500">
                        {s}
                      </span>
                    ))}
                    {msg.model && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-600">
                        🤖 {msg.model}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-2 flex-row max-w-[85%]">
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                <Bot size={14} />
              </div>
              <div className="p-3 rounded-2xl bg-primary text-white rounded-tl-none flex items-center gap-2 text-sm">
                <Loader2 size={14} className="animate-spin" /> Analyse en cours...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions (show only when no conversation yet) */}
      {messages.length <= 1 && (
        <div className="px-4 py-2 bg-white border-t border-gray-50 flex flex-wrap gap-1.5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestion(s)}
              className="text-[11px] font-medium px-2.5 py-1 bg-green-50 border border-green-200 rounded-full text-green-700 hover:bg-green-100 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="p-3 bg-white border-t border-gray-100 rounded-b-xl">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: Dois-je commander de la harissa ?"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-primary text-white p-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
