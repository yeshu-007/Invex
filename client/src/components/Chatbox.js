import React, { useState, useRef, useEffect } from 'react';
import './Chatbox.css';
import Icon from './Icon';

const Chatbox = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      type: 'assistant',
      text: "Hi! I can help you find components or check stock. Ask me anything about the inventory."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage = {
      type: 'user',
      text: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue
        })
      });

      const data = await response.json();
      
      const assistantMessage = {
        type: 'assistant',
        text: data.response || "I'm here to help! You can ask me about components, availability, or any inventory questions."
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        type: 'assistant',
        text: "I'm having trouble connecting right now. Please try again later or contact support."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbox-container">
      <div className="chatbox-header">
        <div className="chatbox-title">
          <h3>Invex Assistant</h3>
          <span className="status-online">Online</span>
        </div>
        <button className="chatbox-close" onClick={onClose}>×</button>
      </div>

      <div className="chatbox-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.type}`}>
            <div className="message-content">
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <div className="message-content">
              <span className="typing-indicator">...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chatbox-input-form" onSubmit={handleSend}>
        <input
          type="text"
          className="chatbox-input"
          placeholder="Ask about components..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="chatbox-send" disabled={loading || !inputValue.trim()}>
          <Icon name="send" size={20} />
        </button>
      </form>
    </div>
  );
};

export default Chatbox;

