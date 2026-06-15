import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { aiApi } from '../services/api';
import { Bot, Zap, DollarSign, Lock, BarChart2, Settings, User } from 'lucide-react';
import './AIPage.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export default function AIPage() {
  const { isConnected, isLoading, connectWallet, wallet } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [llmEnabled, setLlmEnabled] = useState(false);
  const [llmModel, setLlmModel] = useState(null);
  const messagesEndRef = useRef(null);

  // Load conversation history on mount
  useEffect(() => {
    if (wallet?.address) {
      loadConversation();
      loadSuggestions();
    }
    // Check LLM status regardless of wallet
    fetch(`${API_BASE}/ai/status`)
      .then(r => r.json())
      .then(d => { setLlmEnabled(d.llm); setLlmModel(d.model); })
      .catch(() => {});
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
      if (response.data.llm !== undefined) setLlmEnabled(response.data.llm);
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
          <div className="ai-header-left">
            <h1><Bot size={24} /> AI Assistant</h1>
            <p className="subtitle">Get personalized advice and insights</p>
          </div>
          <div className="ai-header-right">
            {llmEnabled
              ? <span className="ai-llm-badge ai-llm-badge--on"><Zap size={12} /> {llmModel || 'LLM'} active</span>
              : <span className="ai-llm-badge ai-llm-badge--off">Rule engine — set OPENAI_API_KEY to enable LLM</span>
            }
            <button className="btn btn-secondary" onClick={handleClearConversation}>Clear Chat</button>
          </div>
        </div>

        <div className="ai-features">
          <div className="feature-chip"><DollarSign size={13} /> Transaction Advice</div>
          <div className="feature-chip"><Lock size={13} /> Security Tips</div>
          <div className="feature-chip"><BarChart2 size={13} /> Market Insights</div>
          <div className="feature-chip"><Settings size={13} /> Smart Contracts</div>
        </div>

        {suggestions.length > 0 && messages.length <= 1 && (
          <div className="suggestions-section">
            <p className="suggestions-label">Try asking:</p>
            <div className="suggestions-list">
              {suggestions.slice(0, 4).map((suggestion, idx) => (
                <button
                  key={idx}
                  className="btn btn-secondary suggestion-btn"
                  onClick={() => handleSend(suggestion)}
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
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="message-content">
                  {msg.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="message assistant">
                <div className="message-avatar"><Bot size={16} /></div>
                <div className="message-content">
                  <span className="ai-thinking">
                    <span /><span /><span />
                  </span>
                </div>
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
