'use strict';
const express = require('express');
const router  = express.Router();
const store   = require('../services/store');

// ── Config ────────────────────────────────────────────────────────────────────
// Supports any OpenAI-compatible endpoint (OpenAI, Azure OpenAI, Ollama, LM Studio, etc.)
//
// Required env vars to enable LLM mode:
//   OPENAI_API_KEY   — your API key (or "ollama" / "lmstudio" for local models)
//   OPENAI_BASE_URL  — optional, defaults to https://api.openai.com/v1
//   OPENAI_MODEL     — optional, defaults to gpt-4o-mini
//
// Without OPENAI_API_KEY the route falls back to the built-in rule engine.

const OPENAI_API_KEY  = process.env.OPENAI_API_KEY  || '';
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const OPENAI_MODEL    = process.env.OPENAI_MODEL     || 'gpt-4o-mini';
const LLM_ENABLED     = !!OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are CIVITAS AI, an intelligent assistant built into the CIVITAS decentralized civic infrastructure platform.

CIVITAS is a full-stack Web3 platform that provides:
- A self-custodied crypto wallet (CIV / CVT tokens on an EVM chain)
- W3C Decentralized Identifiers (DIDs) and verifiable credentials
- End-to-end encrypted peer-to-peer messaging (XMTP-based)
- On-chain governance (DAO proposals, treasury, time-lock)
- Peer-to-peer marketplace with smart contract escrow
- Decentralized file storage (IPFS)
- Mobile money bridges (M-Pesa, GCash, bKash, Wave, etc.)
- Community forums, analytics, node/validator management, automation rules, and an app store

Your role:
- Help users understand and use all CIVITAS features
- Give security advice specific to self-custody and Web3
- Explain on-chain concepts in plain language
- Provide governance guidance (how to vote, create proposals)
- Assist with marketplace and trading questions
- Give actionable, concise answers — use bullet points and markdown where helpful
- If you don't know something specific to the user's wallet or chain state, say so clearly rather than guessing

Tone: helpful, direct, knowledgeable. You may use relevant emoji sparingly.`;

// ── Persisted conversations ───────────────────────────────────────────────────
const conversations = store.collection('aiConversations');

const WELCOME = "Hello! I'm your CIVITAS AI assistant. I can help you with:\n\n💰 Transaction advice and optimization\n🔒 Security recommendations\n📊 Market insights and analysis\n⚙️ Smart contract guidance\n🗳️ Governance and voting\n🌍 Mobile money bridges\n\nHow can I assist you today?";

function getOrCreate(addr) {
  const key = addr.toLowerCase();
  if (!conversations[key]) {
    conversations[key] = {
      walletAddress: addr,
      messages: [{ role: 'assistant', content: WELCOME, timestamp: new Date().toISOString() }],
      lastActive: new Date().toISOString(),
      llm: LLM_ENABLED
    };
  }
  return conversations[key];
}

// ── Rule-based fallback (used when OPENAI_API_KEY is not set) ─────────────────
function ruleBasedResponse(message) {
  const m = message.toLowerCase();
  if (m.includes('transaction') || m.includes('transfer') || m.includes('send'))
    return "💰 **Transactions**\n\n1. **Gas Fees** — lowest during off-peak hours\n2. **Verify Address** — always double-check before sending\n3. **Large Transfers** — consider splitting to reduce risk\n4. **Offline Queue** — transactions queue automatically when you're offline\n\nNeed help with a specific transaction?";
  if (m.includes('security') || m.includes('safe') || m.includes('protect') || m.includes('hack'))
    return "🔒 **Security Best Practices**\n\n1. Never share your private key or seed phrase with anyone\n2. CIVITAS never asks for your seed phrase\n3. Verify smart contract addresses before interacting\n4. Use the Data Vault to store sensitive documents encrypted on IPFS\n5. Set up Social Recovery guardians on the Identity page — they can help recover your wallet if lost\n\nAnything specific you'd like to secure?";
  if (m.includes('market') || m.includes('price') || m.includes('trade') || m.includes('buy') || m.includes('sell'))
    return "📊 **Marketplace & Trading**\n\n- The CIVITAS Marketplace supports P2P trade with smart contract escrow\n- Payments are locked until both buyer and seller confirm delivery\n- Dispute resolution is community-governed\n- Check the Analytics page for volume and trend data\n\nWant tips on creating or finding listings?";
  if (m.includes('smart contract') || m.includes('contract') || m.includes('deploy') || m.includes('solidity'))
    return "⚙️ **Smart Contracts**\n\nCIVITAS uses Solidity contracts for:\n- Token (ERC-20 CIV / CVT)\n- Identity & DID registry\n- Governance (proposals, voting, time-lock)\n- Marketplace escrow\n- Node staking & rewards\n- Airdrop distributor (Merkle proofs)\n\nAll contracts are deployed on the local EVM chain (Hardhat, Chain ID 31337). Want to know how a specific contract works?";
  if (m.includes('govern') || m.includes('vote') || m.includes('proposal') || m.includes('dao'))
    return "🗳️ **Governance**\n\nCIVITAS is a DAO. Any CVT token holder can:\n1. **Create proposals** — describe an on-chain action with title, description, and target\n2. **Vote** — For / Against / Abstain, weighted by token balance\n3. **Track** — live quorum progress and time-lock countdown\n4. **Treasury** — propose ETH or token transfers from the community treasury\n\nNavigate to the Governance page and connect your wallet to participate.";
  if (m.includes('reward') || m.includes('earn') || m.includes('stake') || m.includes('yield') || m.includes('apy'))
    return "💎 **Earning on CIVITAS**\n\n1. **Node / Validator** — stake CVT to run a validator node and earn block rewards\n2. **Governance** — active participation earns reputation bonuses\n3. **Marketplace** — earn CIV by selling goods or services\n4. **Airdrop** — periodic token distributions to active users\n\nGo to the Node page to start staking, or check the Airdrop page for current campaigns.";
  if (m.includes('identity') || m.includes('did') || m.includes('credential') || m.includes('kyc'))
    return "🪪 **Identity & Credentials**\n\nCIVITAS uses W3C Decentralized Identifiers (DIDs):\n- Your DID is anchored to your wallet address on-chain\n- Credentials (e.g. 'Verified Trader') are issued by trusted parties\n- Social Recovery lets up to 5 guardians help restore access if you lose your wallet\n- Privacy settings let you control what's visible on-chain\n\nGo to the Identity page to register your DID.";
  if (m.includes('mobile money') || m.includes('mpesa') || m.includes('gcash') || m.includes('bkash') || m.includes('fiat'))
    return "📱 **Mobile Money Bridges**\n\nCIVITAS connects to M-Pesa, GCash, PayMaya, bKash, Wave, and more:\n- **On-ramp**: deposit fiat via mobile money, receive CIV tokens instantly\n- **Off-ramp**: convert CIV back to fiat and withdraw to your mobile wallet\n- Live exchange rates and full fee breakdown shown before confirming\n\nNavigate to Mobile Money to get started.";
  if (m.includes('ipfs') || m.includes('storage') || m.includes('file') || m.includes('upload') || m.includes('vault'))
    return "☁️ **Decentralized Storage**\n\n- **Storage page**: upload public or encrypted files to IPFS — get shareable CIDs\n- **Data Vault**: private encrypted storage — files are AES-256 encrypted client-side before upload\n- Files persist as long as at least one IPFS node is pinning them\n- Selectively share files with specific wallet addresses\n\nWhich storage feature can I help you with?";
  if (m.includes('offline') || m.includes('queue') || m.includes('connectivity') || m.includes('sync'))
    return "📶 **Offline Queue**\n\nCIVITAS works in low-connectivity environments:\n- Any action taken while offline is saved to a local queue\n- The queue persists across page reloads\n- When you reconnect, click **Sync Now** or wait for automatic sync\n- Review and cancel individual items before broadcasting\n\nNavigate to Offline Queue to manage pending transactions.";
  return "I can help with any CIVITAS feature:\n\n💼 Wallet & Transactions\n🪪 Identity & DIDs\n💬 Messaging\n🗳️ Governance & DAO\n🛒 Marketplace\n☁️ Storage & Data Vault\n📱 Mobile Money\n🖥️ Node & Staking\n📊 Analytics\n🪂 Airdrop\n⚙️ Automation\n\nWhat would you like to know more about?";
}

// ── LLM call via fetch ────────────────────────────────────────────────────────
async function callLLM(historyMessages) {
  // Build messages array: system prompt + last 20 turns to stay within context limits
  const recent = historyMessages.slice(-20);
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...recent.map(m => ({ role: m.role, content: m.content }))
  ];

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      max_tokens: 600,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`LLM API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /conversation
router.get('/conversation', (req, res) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  const conv = getOrCreate(walletAddress);
  conv.llm = LLM_ENABLED;
  res.json(conv);
});

// POST /chat
router.post('/chat', async (req, res) => {
  const { walletAddress, message } = req.body;
  if (!walletAddress || !message) return res.status(400).json({ error: 'walletAddress and message required' });

  const conv = getOrCreate(walletAddress);
  conv.messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
  conv.lastActive = new Date().toISOString();

  let aiResponse;
  if (LLM_ENABLED) {
    try {
      aiResponse = await callLLM(conv.messages);
    } catch (err) {
      console.error('[AI] LLM call failed, falling back to rule engine:', err.message);
      aiResponse = ruleBasedResponse(message);
    }
  } else {
    aiResponse = ruleBasedResponse(message);
  }

  conv.messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() });
  conv.llm = LLM_ENABLED;

  res.json({ response: aiResponse, conversation: conv, llm: LLM_ENABLED });
});

// DELETE /conversation
router.delete('/conversation', (req, res) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  const key = walletAddress.toLowerCase();
  conversations[key] = {
    walletAddress,
    messages: [{ role: 'assistant', content: WELCOME, timestamp: new Date().toISOString() }],
    lastActive: new Date().toISOString(),
    llm: LLM_ENABLED
  };
  res.json({ message: 'Conversation cleared' });
});

// GET /suggestions
router.get('/suggestions', (_req, res) => {
  res.json([
    "What are the best security practices for my wallet?",
    "How can I optimize my transaction fees?",
    "Explain how smart contracts work in CIVITAS",
    "How do I set up social recovery for my identity?",
    "How do I earn rewards on CIVITAS?",
    "What are the current governance proposals?",
    "How does the Mobile Money bridge work?",
    "How do I store files privately on IPFS?"
  ]);
});

// GET /status — lets the frontend know if LLM is active
router.get('/status', (_req, res) => {
  res.json({
    llm: LLM_ENABLED,
    model: LLM_ENABLED ? OPENAI_MODEL : null,
    baseUrl: LLM_ENABLED ? OPENAI_BASE_URL : null
  });
});

module.exports = router;
