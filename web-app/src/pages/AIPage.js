import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { aiApi } from '../services/api';
import './AIPage.css';

export default function AIPage() {
  const { isConnected, isLoading, connectWallet, wallet } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSending, setIsSending] = useState(false);

  // Load conversation history on mount
  useEffect(() => {
    if (wallet?.address) {
      loadConversation();
      loadSuggestions();
    }
  }, [wallet?.address]);

  const loadConversation = async () => {
    try {
      const response = await aiApi.getConversation(wallet.address);
      const formattedMessages = response.data.messages.map(msg => ({
        id: msg._id || Date.now(),
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await aiApi.getSuggestions();
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleSend = async (messageText = null) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isSending) return;
    
    setIsSending(true);
    const userMessage = { 
      id: 'temp-' + Date.now(), 
      role: 'user', 
      content: textToSend,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    try {
      const response = await aiApi.sendMessage(wallet.address, textToSend);
      
      const aiResponse = {
        id: Date.now(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearConversation = async () => {
    if (!window.confirm('Clear conversation history?')) return;
    
    try {
      await aiApi.clearConversation(wallet.address);
      await loadConversation();
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="ai-page">
        <div className="ai-container">
          <div className="not-connected">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="ai-page">
        <div className="ai-container">
          <div className="not-connected">
            <h2>Wallet Not Connected</h2>
            <p>Please connect your wallet to use the AI assistant.</p>
            <button className="btn btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-page">
      <div className="ai-container">
        <div className="ai-header">
          <h1>🤖 AI Assistant</h1>
          <p className="subtitle">Get personalized advice and insights</p>
          <button 
            className="btn btn-secondary" 
            onClick={handleClearConversation}
            style={{ marginLeft: 'auto' }}
          >
            Clear Chat
          </button>
        </div>

        <div className="ai-features">
          <div className="feature-chip">💰 Transaction Advice</div>
          <div className="feature-chip">🔒 Security Tips</div>
          <div className="feature-chip">📊 Market Insights</div>
          <div className="feature-chip">⚙️ Smart Contracts</div>
        </div>

        {suggestions.length > 0 && messages.length <= 1 && (
          <div className="suggestions-section">
            <p style={{ marginBottom: '10px', color: '#666' }}>Try asking:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {suggestions.slice(0, 3).map((suggestion, idx) => (
                <button
                  key={idx}
                  className="btn btn-secondary"
                  onClick={() => handleSend(suggestion)}
                  style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="chat-container">
          <div className="messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div className="message-content" style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">Thinking...</div>
              </div>
            )}
          </div>

          <div className="input-area">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSend()}
              disabled={isSending}
            />
            <button 
              className="btn btn-primary" 
              onClick={() => handleSend()}
              disabled={isSending || !input.trim()}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
