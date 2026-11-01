import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { sound } from '../utils/soundEffects';

const CHEF_PERSONAS = [
  {
    id: 'auguste',
    name: 'Auguste',
    title: 'Michelin Master',
    avatar: '👨‍🍳',
    color: '#10b981',
    welcome: 'Bonjour! Chef Auguste here. Let us craft gourmet perfection with flawless technique. What shall we prepare?',
    prompts: [
      '🍷 Best wine pairing for steak?',
      '🧈 How to make a velvet pan sauce?',
      '🔪 Essential knife cut techniques?'
    ]
  },
  {
    id: 'nonna',
    name: 'Nonna Rosa',
    title: 'Italian Comfort',
    avatar: '👵',
    color: '#f59e0b',
    welcome: 'Ciao tesoro mio! Nonna Rosa is here! Sit, eat, enjoy. What delicious homestyle recipe can I share from my kitchen?',
    prompts: [
      '🍝 Secret to rich Sunday bolognese?',
      '🧄 How to fix over-salted sauce?',
      '🥖 Quick homemade garlic focaccia?'
    ]
  },
  {
    id: 'marcus',
    name: 'Coach Marcus',
    title: 'Fitness & Macros',
    avatar: '🏋️',
    color: '#3b82f6',
    welcome: "Let's crush those goals! Coach Marcus ready to dial in your macros. Need 40g+ protein ideas or clean meal prep?",
    prompts: [
      '💪 50g protein dinner in 20 mins?',
      '🥑 Healthy high-calorie clean fats?',
      '🍗 Best juicy chicken breast marinade?'
    ]
  },
  {
    id: 'sam',
    name: 'Speedy Sam',
    title: '15-Min Quick',
    avatar: '⚡',
    color: '#ec4899',
    welcome: "Yo! Speedy Sam here. Zero wasted time, minimal dirty pans, maximum flavor. What's in your fridge right now?",
    prompts: [
      '🥚 5-minute chili crisp scrambled eggs',
      '💨 Top air fryer hacks for weeknights',
      '🍜 Upgrade instant ramen like a pro'
    ]
  }
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activePersona, setActivePersona] = useState('auguste');
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: CHEF_PERSONAS[0].welcome,
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);

  const currentPersona = CHEF_PERSONAS.find(p => p.id === activePersona) || CHEF_PERSONAS[0];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSelectPersona = (personaId) => {
    sound.playClick();
    setActivePersona(personaId);
    const persona = CHEF_PERSONAS.find(p => p.id === personaId);
    if (persona) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: `*Switched to **${persona.name}** (${persona.title})* ${persona.avatar}\n\n${persona.welcome}`,
          sources: []
        }
      ]);
    }
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    sound.playClick();
    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await api.post('/ai/rag-chat', {
        message: query,
        history: historyPayload,
        persona: activePersona
      });

      sound.playChime();
      const assistantMsg = {
        sender: 'assistant',
        text: res.data.response || 'Sorry, I could not generate a response.',
        sources: res.data.sources || []
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('RAG Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: '⚠️ I encountered a temporary connection glitch. Please try asking again!',
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice recognition is not supported in your browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      toast('Listening to your cooking question...', { icon: '🎙️' });
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error('Could not recognize voice input');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
      {/* Slide-Up Chat Panel */}
      {isOpen && (
        <div className="animate-scaleIn" style={{
          position: 'absolute',
          bottom: 76,
          right: 0,
          width: '390px',
          maxWidth: 'calc(100vw - 32px)',
          height: '560px',
          maxHeight: 'calc(100vh - 120px)',
          background: 'rgba(15,22,36,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 24,
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '14px 18px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20
              }}>
                {currentPersona.avatar}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                  {currentPersona.name} • <span style={{ fontSize: 12, opacity: 0.9 }}>{currentPersona.title}</span>
                </h4>
                <span style={{ fontSize: 11, opacity: 0.85 }}>🔍 Grounded with your cookbook</span>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setIsOpen(false);
              }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                width: 28,
                height: 28,
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>

          {/* AI Chef Persona Selector Tabs */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '8px 12px',
            display: 'flex',
            gap: 6,
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}>
            {CHEF_PERSONAS.map(p => {
              const active = p.id === activePersona;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPersona(p.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    padding: '6px 4px',
                    borderRadius: 10,
                    border: `1px solid ${active ? p.color : 'transparent'}`,
                    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: active ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 11.5,
                    fontWeight: active ? 700 : 500,
                    transition: 'all 0.2s'
                  }}
                  title={p.title}
                >
                  <span>{p.avatar}</span>
                  <span>{p.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Persona Suggested Quick Prompts */}
          <div style={{
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            scrollbarWidth: 'none'
          }}>
            {currentPersona.prompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '4px 10px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#cbd5e1',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div style={{
            flex: 1,
            padding: 16,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: m.sender === 'user'
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(255,255,255,0.06)',
                  color: m.sender === 'user' ? 'white' : '#f1f5f9',
                  borderRadius: 16,
                  padding: '12px 16px',
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  border: m.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                {m.sources?.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: 11, opacity: 0.85 }}>
                    📚 Recipe library references: {m.sources.join(', ')}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.06)', padding: '10px 16px', borderRadius: 16, fontSize: 13, color: '#94a3b8' }}>
                {currentPersona.avatar} {currentPersona.name} is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer */}
          <div style={{
            padding: 12,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(11,17,29,0.85)',
            display: 'flex',
            gap: 8,
            alignItems: 'center'
          }}>
            <button
              onClick={handleVoiceInput}
              style={{
                background: isListening ? '#ef4444' : 'rgba(255,255,255,0.08)',
                border: 'none',
                color: 'white',
                width: 38,
                height: 38,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16
              }}
              title="Voice Input"
            >
              🎙️
            </button>
            <input
              className="input-field"
              placeholder={`Ask ${currentPersona.name}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{ flex: 1, padding: '10px 14px', fontSize: 13.5, borderRadius: 14 }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="btn-primary"
              style={{ padding: '10px 16px', borderRadius: 14, fontSize: 13 }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => {
          sound.playClick();
          setIsOpen(!isOpen);
        }}
        className="animate-pulse-glow hover-lift"
        style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 30px rgba(16,185,129,0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)'
        }}
        title="Open ChefAI Assistant"
      >
        {isOpen ? '✕' : currentPersona.avatar}
      </button>
    </div>
  );
}
