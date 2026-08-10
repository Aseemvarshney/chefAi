import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hello! 👨‍🍳 I am your **ChefAI Live Assistant**. Ask me any cooking questions or recipe advice!',
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);

  const quickPrompts = [
    '🥚 What can I cook with eggs & tomatoes?',
    '⏱️ Give me a 15-min healthy recipe',
    '🧂 How to balance an over-salted curry?'
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      // Format history for backend
      const historyPayload = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await api.post('/ai/rag-chat', {
        message: query,
        history: historyPayload
      });

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
          text: '⚠️ Ouch! I ran into an issue connecting to the AI engine. Please try again.',
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
      toast('Listening...', { icon: '🎙️' });
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
          width: '380px',
          maxWidth: 'calc(100vw - 32px)',
          height: '520px',
          maxHeight: 'calc(100vh - 120px)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '16px 20px',
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
                👨‍🍳
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>ChefAI Assistant</h4>
                <span style={{ fontSize: 11, opacity: 0.85 }}>🔍 Grounded with your recipes</span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                width: 28,
                height: 28,
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>

          {/* Quick Prompts */}
          <div style={{
            padding: '10px 14px',
            background: 'rgba(0,0,0,0.03)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: 6,
            overflowX: 'auto'
          }}>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '5px 10px',
                  borderRadius: 14,
                  border: '1px solid rgba(16,185,129,0.3)',
                  background: 'rgba(16,185,129,0.1)',
                  color: '#10b981',
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
                  maxWidth: '85%'
                }}
              >
                <div style={{
                  padding: '12px 16px',
                  borderRadius: m.sender === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                  background: m.sender === 'user'
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(255,255,255,0.05)',
                  color: m.sender === 'user' ? 'white' : 'var(--text-main)',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--border)',
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {m.text}
                </div>

                {/* RAG Sources Citation Badge */}
                {m.sources && m.sources.length > 0 && (
                  <div style={{
                    marginTop: 6,
                    fontSize: 11,
                    color: '#10b981',
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 10,
                    padding: '4px 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span>🔍 Based on saved recipe library:</span>
                    <strong>{m.sources.join(', ')}</strong>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Dots Animation */}
            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '12px 16px',
                borderRadius: '18px 18px 18px 2px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span className="animate-pulse" style={{ fontSize: 16 }}>🍳</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ChefAI is thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer */}
          <div style={{
            padding: 12,
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-card)',
            display: 'flex',
            gap: 8,
            alignItems: 'center'
          }}>
            <button
              onClick={handleVoiceInput}
              title="Voice Input"
              style={{
                background: isListening ? '#ef4444' : 'rgba(16,185,129,0.1)',
                color: isListening ? 'white' : '#10b981',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 10,
                width: 38,
                height: 38,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16
              }}
            >
              🎙️
            </button>

            <input
              type="text"
              placeholder="Ask ChefAI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: 13.5
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="hover-scale"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '0 16px',
                height: 38,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Floating Hat Button Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover-scale animate-heartbeat"
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28
        }}
      >
        {isOpen ? '✕' : '👨‍🍳'}
      </button>
    </div>
  );
}
