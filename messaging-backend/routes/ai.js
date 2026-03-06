'use strict';
const express = require('express');
const router  = express.Router();
const store   = require('../services/store');

// Persisted conversations: { [walletAddress]: { messages: [], lastActive } }
const conversations = store.collection('aiConversations');

const WELCOME = "Hello! I'm your CIVITAS AI assistant. I can help you with:\n\n💰 Transaction advice and optimization\n🔒 Security recommendations\n📊 Market insights and analysis\n⚙ Smart contract guidance\n🎯 Investment strategies\n\nHow can I assist you today?";

function getOrCreate(addr) {
  if (!conversations[addr]) {
    conversations[addr] = {
      walletAddress: addr,
      messages: [{ role: 'assistant', content: WELCOME, timestamp: new Date().toISOString() }],
      lastActive: new Date().toISOString()
    };
  }
  return conversations[addr];
}

function generateAIResponse(message) {
  const m = message.toLowerCase();
  if (m.includes('transaction') || m.includes('transfer') || m.includes('send'))
    return "💰 For transactions:\n\n1. **Check Gas Fees**: Optimal during off-peak hours\n2. **Verify Address**: Always double-check recipient\n3. **Limit Orders**: Break up large transfers\n4. **Notifications**: Enable alerts\n\nNeed help with a specific transaction?";
  if (m.includes('security') || m.includes('safe') || m.includes('protect'))
    return "🔒 Security Best Practices:\n\n1. **Never share private keys**\n2. **Enable 2FA** where available\n3. **Verify contracts** before interacting\n4. **Hardware wallets** for large amounts\n5. **Regular backups** of seed phrase\n\nWallet security score: 85/100.";
  if (m.includes('market') || m.includes('price') || m.includes('trade'))
    return "📊 Market Insights:\n\n**Trends:**\n- CIV Token: Bullish (+12% this week)\n- Network Activity: 150k+ daily transactions\n- Gas Fees: 12-18 gwei average\n\n**Tip:** Consider DCA for long-term positions.";
  if (m.includes('smart contract') || m.includes('contract') || m.includes('deploy'))
    return "⚙ Smart Contract Guidance:\n\n- Immutable once deployed\n- Gas fees vary by complexity\n- Always audit before deployment\n\n**Templates:** ERC-20, ERC-721, Multi-sig, AMM, Governance.";
  if (m.includes('govern') || m.includes('vote') || m.includes('proposal'))
    return "🗳 Governance:\n\n**3 active proposals** open for voting.\n- CIP-001: Treasury allocation\n- CIP-002: Fee reduction\n- CIP-003: Marketplace features\n\nVoting power based on CIV holdings + reputation.";
  if (m.includes('reward') || m.includes('earn') || m.includes('stake') || m.includes('yield'))
    return "💎 Earning Opportunities:\n\n1. **Staking**: 8-12% APY\n2. **Liquidity**: 15-25% APY\n3. **Node Operation**: Block rewards\n4. **Governance**: Participation bonuses\n\nBased on your holdings: ~45 CIV/month potential.";
  if (m.includes('help') || m.includes('how') || m.includes('what'))
    return "🤖 I can assist with:\n\n✅ Transaction Management\n✅ Security Audits\n✅ Market Analysis\n✅ Smart Contracts\n✅ Governance\n✅ Earning Strategies\n\nAsk anything specific!";
  return "I understand your question. CIVITAS tools cover:\n\n🎯 Transaction Management\n🔐 Security & Privacy\n📈 Markets\n⚙ Smart Contracts\n🗳 Governance\n💰 Earnings\n\nCould you be more specific?";
}

// GET /conversation
router.get('/conversation', (req, res) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  res.json(getOrCreate(walletAddress));
});

// POST /chat
router.post('/chat', (req, res) => {
  const { walletAddress, message } = req.body;
  if (!walletAddress || !message) return res.status(400).json({ error: 'walletAddress and message required' });
  const conv = getOrCreate(walletAddress);
  conv.messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
  const aiResponse = generateAIResponse(message);
  conv.messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() });
  conv.lastActive = new Date().toISOString();
  res.json({ response: aiResponse, conversation: conv });
});

// DELETE /conversation
router.delete('/conversation', (req, res) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  conversations[walletAddress] = {
    walletAddress,
    messages: [{ role: 'assistant', content: 'Hello! I\'m your CIVITAS AI assistant. How can I help you today?', timestamp: new Date().toISOString() }],
    lastActive: new Date().toISOString()
  };
  res.json({ message: 'Conversation cleared' });
});

// GET /suggestions
router.get('/suggestions', (_req, res) => {
  res.json([
    "What are the best security practices for my wallet?",
    "How can I optimize my transaction fees?",
    "Explain how smart contracts work",
    "What are the current market trends?",
    "How do I earn rewards on CIVITAS?",
    "What are the governance voting options?"
  ]);
});

module.exports = router;
