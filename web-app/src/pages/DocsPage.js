import React, { useState, useEffect } from 'react';
import './DocsPage.css';

/* ─── Sidebar navigation structure ─────────────── */
const NAV = [
  {
    group: 'Overview',
    items: [
      { id: 'what-is-civitas', icon: '🏛️', label: 'What is CIVITAS?' },
      { id: 'goals',           icon: '🎯', label: 'Goals & Vision' },
      { id: 'architecture',    icon: '🔧', label: 'How It Works' },
      { id: 'getting-started', icon: '🚀', label: 'Getting Started' },
    ],
  },
  {
    group: 'Core Features',
    items: [
      { id: 'wallet',      icon: '💼', label: 'Wallet' },
      { id: 'identity',    icon: '🪪', label: 'Identity' },
      { id: 'messaging',   icon: '💬', label: 'Messaging' },
      { id: 'governance',  icon: '🗳️', label: 'Governance' },
      { id: 'marketplace', icon: '🛒', label: 'Marketplace' },
    ],
  },
  {
    group: 'Data & Storage',
    items: [
      { id: 'data-vault', icon: '🔐', label: 'Data Vault' },
      { id: 'storage',    icon: '☁️', label: 'Storage' },
      { id: 'offline',    icon: '📶', label: 'Offline Queue' },
    ],
  },
  {
    group: 'Network',
    items: [
      { id: 'node',      icon: '🖥️', label: 'Node / Validator' },
      { id: 'analytics', icon: '📊', label: 'Analytics' },
      { id: 'community', icon: '🌐', label: 'Community' },
    ],
  },
  {
    group: 'Tools',
    items: [
      { id: 'mobile-money', icon: '📱', label: 'Mobile Money' },
      { id: 'airdrop',      icon: '🪂', label: 'Airdrop' },
      { id: 'automation',   icon: '⚙️', label: 'Automation' },
      { id: 'ai',           icon: '🤖', label: 'AI Assistant' },
    ],
  },
  {
    group: 'Reference',
    items: [
      { id: 'tech-stack', icon: '🧱', label: 'Tech Stack' },
      { id: 'faq',        icon: '❓', label: 'FAQ' },
    ],
  },
];

/* ─── Scroll-spy ─────────────────────────────────── */
function useActiveSection() {
  const [active, setActive] = useState('what-is-civitas');
  useEffect(() => {
    const ids = NAV.flatMap(g => g.items.map(i => i.id));
    const handler = () => {
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i]);
        if (el && el.getBoundingClientRect().top <= 110) {
          setActive(ids[i]);
          return;
        }
      }
      setActive(ids[0]);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return [active, setActive];
}

function scrollTo(id, setActive) {
  const el = document.getElementById(id);
  if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setActive(id); }
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function DocsPage() {
  const [active, setActive] = useActiveSection();

  return (
    <div className="docs-layout">

      {/* ── Sidebar ── */}
      <aside className="docs-sidebar">
        <div className="docs-sidebar-title">Documentation</div>
        {NAV.map(g => (
          <div className="docs-nav-group" key={g.group}>
            <div className="docs-nav-group-label">{g.group}</div>
            {g.items.map(item => (
              <button
                key={item.id}
                className={`docs-nav-link${active === item.id ? ' active' : ''}`}
                onClick={() => scrollTo(item.id, setActive)}
              >
                <span className="docs-nav-link-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* ── Content ── */}
      <main className="docs-content">

        {/* ════════════════ WHAT IS CIVITAS ════════════════ */}
        <section className="docs-section" id="what-is-civitas">
          <div className="docs-section-header">
            <div className="docs-section-icon">🏛️</div>
            <div>
              <h2 className="docs-section-title">What is CIVITAS?</h2>
              <p className="docs-section-subtitle">A decentralized civic infrastructure platform</p>
            </div>
          </div>
          <p className="docs-lead">
            <span className="docs-highlight">CIVITAS</span> is a full-stack, decentralized platform that lets anyone — regardless of location, banking access, or technical background — participate in a sovereign digital economy.
          </p>
          <p className="docs-body">
            Built on a local Ethereum-compatible blockchain (Hardhat / EVM), CIVITAS combines on-chain smart contracts, encrypted decentralized storage (IPFS), end-to-end encrypted peer-to-peer messaging, and a React web application into one unified platform. The system removes traditional financial gatekeepers and replaces them with transparent, community-governed smart contracts.
          </p>
          <p className="docs-body">
            Every user controls their own cryptographic identity, wallet, and data. There are no centralized servers that store your private keys or personal information. Transactions are settled on-chain, messages are relayed through an E2E-encrypted messaging layer, and files are pinned to IPFS so they persist as long as at least one node is live.
          </p>
          <div className="docs-card-grid">
            {[
              { icon: '🔑', title: 'Self-Sovereign Identity',   desc: 'Own your DID, credentials, and wallet. No central authority can revoke access.' },
              { icon: '🌍', title: 'Financial Inclusion',       desc: 'Works without a traditional bank account. Mobile money and crypto bridges built-in.' },
              { icon: '🗳️', title: 'Community Governance',     desc: 'All protocol parameters are governed by token holders through on-chain proposals and votes.' },
              { icon: '🔒', title: 'Privacy First',             desc: 'End-to-end encrypted messaging, zero-knowledge credentials, and local-first data storage.' },
              { icon: '📶', title: 'Offline Capable',           desc: 'Transactions queue locally when offline and sync automatically when connectivity returns.' },
              { icon: '⚡', title: 'Low Fees',                  desc: 'Runs on a local EVM chain, keeping gas costs near-zero. Configurable for any EVM network.' },
            ].map(c => (
              <div className="docs-card" key={c.title}>
                <div className="docs-card-icon">{c.icon}</div>
                <div className="docs-card-title">{c.title}</div>
                <div className="docs-card-desc">{c.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════ GOALS ════════════════ */}
        <section className="docs-section" id="goals">
          <div className="docs-section-header">
            <div className="docs-section-icon">🎯</div>
            <div>
              <h2 className="docs-section-title">Goals &amp; Vision</h2>
              <p className="docs-section-subtitle">Why CIVITAS exists</p>
            </div>
          </div>
          <p className="docs-lead">
            CIVITAS was conceived to solve a single core problem: <span className="docs-highlight">billions of people are excluded from the global financial system</span> not because of capability, but because of geography, documentation, or institutional gatekeeping.
          </p>
          <div className="docs-layers">
            {[
              { n: '1', name: 'Financial Sovereignty',    desc: 'Give every person a self-custodied digital wallet they fully control — no bank required to open, freeze, or close it.',                                                     tags: ['Wallet', 'Smart Contract', 'EVM'] },
              { n: '2', name: 'Verifiable Identity',      desc: 'Issue tamper-proof, privacy-preserving credentials so users can prove who they are without revealing unnecessary personal information.',                                     tags: ['DID', 'Credentials', 'Social Recovery'] },
              { n: '3', name: 'Decentralized Commerce',   desc: 'Enable peer-to-peer trade of goods, services, and digital assets without a central marketplace taking large cuts or censoring listings.',                                   tags: ['Marketplace', 'Escrow', 'Smart Contracts'] },
              { n: '4', name: 'Democratic Governance',    desc: 'Let communities self-govern platform rules, treasury allocation, and protocol upgrades through transparent on-chain voting.',                                              tags: ['DAO', 'Proposals', 'Treasury'] },
              { n: '5', name: 'Universal Connectivity',   desc: 'Support offline-first usage, mobile money bridges, and low-bandwidth environments so that network connectivity is not a barrier.',                                         tags: ['Offline Queue', 'Mobile Money', 'IPFS'] },
              { n: '6', name: 'Open Ecosystem',           desc: 'Provide APIs, smart contract interfaces, and an app store layer so third-party developers can build on top of CIVITAS.',                                                   tags: ['App Store', 'REST API', 'AI Tools'] },
            ].map(l => (
              <div className="docs-layer" key={l.n}>
                <div className="docs-layer-number">{l.n}</div>
                <div className="docs-layer-body">
                  <div className="docs-layer-name">{l.name}</div>
                  <div className="docs-layer-desc">{l.desc}</div>
                  <div className="docs-layer-tags">{l.tags.map(t => <span className="docs-tag" key={t}>{t}</span>)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════ ARCHITECTURE ════════════════ */}
        <section className="docs-section" id="architecture">
          <div className="docs-section-header">
            <div className="docs-section-icon">🔧</div>
            <div>
              <h2 className="docs-section-title">How It Works</h2>
              <p className="docs-section-subtitle">System architecture overview</p>
            </div>
          </div>
          <p className="docs-lead">CIVITAS is a four-layer system. Each layer is independently replaceable and communicates through well-defined interfaces.</p>
          <div className="docs-flow">
            <div className="docs-flow-step"><strong>Layer 1</strong>Blockchain (EVM)</div>
            <div className="docs-flow-arrow">→</div>
            <div className="docs-flow-step"><strong>Layer 2</strong>Smart Contracts</div>
            <div className="docs-flow-arrow">→</div>
            <div className="docs-flow-step"><strong>Layer 3</strong>Backend / IPFS</div>
            <div className="docs-flow-arrow">→</div>
            <div className="docs-flow-step"><strong>Layer 4</strong>React Web App</div>
          </div>
          <div className="docs-layers">
            {[
              { n: '1', name: 'Blockchain Layer — Hardhat EVM (port 8545)',   desc: 'Local Ethereum-compatible chain. Produces blocks, validates transactions, and stores all on-chain state. Can be swapped for any EVM network by changing the RPC URL.', tags: ['Hardhat', 'EVM', 'Chain ID 31337'] },
              { n: '2', name: 'Smart Contract Layer',                          desc: 'Solidity contracts handle token balances, identity DIDs, credential issuance, governance proposals, marketplace escrow, treasury multisig, and node staking. Deployed once; interacted with via ethers.js.', tags: ['Solidity', 'ethers v6', 'OpenZeppelin'] },
              { n: '3', name: 'Backend Layer — Express (port 3001)',           desc: 'Handles peer-to-peer messaging relay and IPFS file pinning. Lightweight message broker over WebSockets. Content is E2E encrypted before leaving the client — the server never sees plaintext.', tags: ['Node.js', 'Express', 'IPFS', 'WebSocket'] },
              { n: '4', name: 'Frontend Layer — React / Vite (port 3002)',    desc: 'Single-page application with full wallet management, all feature screens, and real-time blockchain event subscriptions. Uses ethers.js directly in the browser; no backend proxy for on-chain calls.', tags: ['React 18', 'Vite', 'ethers v6', 'CSS'] },
            ].map(l => (
              <div className="docs-layer" key={l.n}>
                <div className="docs-layer-number">{l.n}</div>
                <div className="docs-layer-body">
                  <div className="docs-layer-name">{l.name}</div>
                  <div className="docs-layer-desc">{l.desc}</div>
                  <div className="docs-layer-tags">{l.tags.map(t => <span className="docs-tag" key={t}>{t}</span>)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="docs-callout">
            <div className="docs-callout-icon">ℹ️</div>
            <div className="docs-callout-body">
              <strong>No MetaMask required</strong>
              CIVITAS includes a built-in wallet engine. Users can generate a new wallet or import an existing one using a seed phrase or private key, entirely within the platform. Wallets are AES-256 encrypted with a user-chosen password and stored locally in the browser.
            </div>
          </div>
        </section>

        {/* ════════════════ GETTING STARTED ════════════════ */}
        <section className="docs-section" id="getting-started">
          <div className="docs-section-header">
            <div className="docs-section-icon">🚀</div>
            <div>
              <h2 className="docs-section-title">Getting Started</h2>
              <p className="docs-section-subtitle">First steps for a new user</p>
            </div>
          </div>
          <p className="docs-lead">You can be fully set up in under two minutes. No prior blockchain experience required.</p>
          <div className="docs-layers">
            {[
              { n: '1', name: 'Open the Platform',    desc: 'Navigate to http://localhost:3002 in any modern browser (Chrome, Firefox, Edge, Brave). No extensions or plugins needed.' },
              { n: '2', name: 'Create Your Wallet',   desc: 'Click "Connect Wallet" in the top-right header. Choose "Create New Wallet", note your 12-word seed phrase, set a strong password, and confirm.' },
              { n: '3', name: 'Claim Your Identity',  desc: 'Go to the Identity page and register your Decentralized Identifier (DID) on-chain. This links your wallet address to a verifiable identity profile.' },
              { n: '4', name: 'Fund Your Wallet',     desc: "Use Hardhat's pre-funded test accounts or claim free tokens via the Airdrop page on the local development chain." },
              { n: '5', name: 'Explore Features',     desc: 'You now have full access to all screens: send/receive funds, trade on the marketplace, message peers, vote on proposals, store files, and more.' },
            ].map(l => (
              <div className="docs-layer" key={l.n}>
                <div className="docs-layer-number">{l.n}</div>
                <div className="docs-layer-body">
                  <div className="docs-layer-name">{l.name}</div>
                  <div className="docs-layer-desc">{l.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════ WALLET ════════════════ */}
        <section className="docs-section" id="wallet">
          <div className="docs-section-header">
            <div className="docs-section-icon">💼</div>
            <div>
              <h2 className="docs-section-title">Feature Guide</h2>
              <p className="docs-section-subtitle">Every screen explained</p>
            </div>
          </div>
          <div className="docs-page-entry">
            <div className="docs-page-header">
              <div className="docs-page-icon">💼</div>
              <div>
                <div className="docs-page-title">Wallet</div>
                <span className="docs-page-route">/wallet</span>
              </div>
            </div>
            <p className="docs-page-desc">Your financial hub. Shows token balance, transaction history, send/receive actions, and a QR code for receiving payments. All balances are fetched live from the blockchain.</p>
            <ul className="docs-feature-list">
              <li>View native token balance and USD-equivalent estimate</li>
              <li>Send tokens to any address with custom amount and optional memo</li>
              <li>Display your QR code for receiving payments</li>
              <li>Full on-chain transaction history with timestamps and status</li>
              <li>Create or import a wallet without leaving the platform</li>
              <li>Encrypt wallet with a password — stored only in your browser</li>
            </ul>
            <div className="docs-interact-box">
              <div className="docs-interact-label">How to interact</div>
              <ol className="docs-interact-steps">
                <li>Click <strong>Connect Wallet</strong> in the header if not already connected.</li>
                <li>Choose <em>Create New Wallet</em> or <em>Import</em> via seed phrase or private key.</li>
                <li>Set an encryption password — your wallet is saved locally.</li>
                <li>To send: enter the recipient address, amount, and click <strong>Send</strong>.</li>
                <li>To receive: click <strong>Receive</strong> and share your address or QR code.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ════════════════ IDENTITY ════════════════ */}
        <section className="docs-section" id="identity">
          <div className="docs-page-entry">
            <div className="docs-page-header">
              <div className="docs-page-icon">🪪</div>
              <div>
                <div className="docs-page-title">Identity</div>
                <span className="docs-page-route">/identity</span>
              </div>
            </div>
            <p className="docs-page-desc">Your self-sovereign identity layer. CIVITAS issues W3C-compatible Decentralized Identifiers (DIDs) anchored to your wallet address. Credentials (e.g. "Verified Trader") are issued by trusted parties and stored with your DID. Social recovery lets trusted contacts help you regain access if you lose your wallet.</p>
            <ul className="docs-feature-list">
              <li>Register a DID tied to your wallet address</li>
              <li>Issue and display verifiable credentials</li>
              <li>Set up social recovery with up to 5 guardian addresses</li>
              <li>Initiate or approve a recovery request if a wallet is lost</li>
              <li>View your complete on-chain identity profile</li>
            </ul>
            <div className="docs-interact-box">
              <div className="docs-interact-label">How to interact</div>
              <ol className="docs-interact-steps">
                <li>Connect your wallet and navigate to <strong>Identity</strong>.</li>
                <li>Click <strong>Register DID</strong> — writes your identifier on-chain (one-time).</li>
                <li>Add guardian addresses under <em>Social Recovery</em>.</li>
                <li>If you lose access, guardians co-sign a recovery transaction to restore your DID.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ════════════════ MESSAGING ════════════════ */}
        <section className="docs-section" id="messaging">
          <div className="docs-page-entry">
            <div className="docs-page-header">
              <div className="docs-page-icon">💬</div>
              <div>
                <div className="docs-page-title">Messaging</div>
                <span className="docs-page-route">/messaging</span>
              </div>
            </div>
            <p className="docs-page-desc">End-to-end encrypted peer-to-peer messaging. Messages are encrypted in the browser before being relayed through the backend. The server never sees plaintext content. Conversations are stored locally and on IPFS.</p>
            <ul className="docs-feature-list">
              <li>Send encrypted text messages to any wallet address</li>
              <li>Real-time delivery over WebSocket connection</li>
              <li>Attach files — encrypted and stored on IPFS</li>
              <li>Conversation list with unread indicators</li>
              <li>Message history persisted locally (no server-side logs)</li>
              <li>Group channel support for community discussions</li>
            </ul>
            <div className="docs-interact-box">
              <div className="docs-interact-label">How to interact</div>
              <ol className="docs-interact-steps">
                <li>Navigate to <strong>Messaging</strong> and connect your wallet if prompted.</li>
                <li>Click <strong>New Conversation</strong> and enter the recipient's wallet address.</li>
                <li>Type your message and press Enter or click <strong>Send</strong>.</li>
                <li>Attach files using the paperclip icon — uploaded to IPFS and linked in the message.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ════════════════ GOVERNANCE ════════════════ */}
        <section className="docs-section" id="governance">
          <div className="docs-page-entry">
            <div className="docs-page-header">
              <div className="docs-page-icon">🗳️</div>
              <div>
                <div className="docs-page-title">Governance</div>
                <span className="docs-page-route">/governance</span>
              </div>
            </div>
            <p className="docs-page-desc">The CIVITAS DAO. Any token holder can create or vote on proposals that affect platform parameters, treasury spending, and protocol upgrades. Votes are cast on-chain, fully transparent, and executed automatically when quorum is reached and the time-lock expires.</p>
            <ul className="docs-feature-list">
              <li>Browse open, passed, and failed proposals</li>
              <li>Create a new proposal with title, description, and on-chain action</li>
              <li>Cast For / Against / Abstain votes weighted by token balance</li>
              <li>Treasury panel: view balance and propose ETH or token transfers</li>
              <li>Time-lock enforcement — proposals execute only after a safe delay</li>
              <li>Real-time quorum tracking with live vote counts</li>
            </ul>
            <div className="docs-interact-box">
              <div className="docs-interact-label">How to interact</div>
              <ol className="docs-interact-steps">
                <li>Hold CVT governance tokens (claim via Airdrop or earn through staking).</li>
                <li>Navigate to <strong>Governance</strong> and browse active proposals.</li>
                <li>Click a proposal, select your vote, and confirm on-chain.</li>
                <li>To create: click <strong>New Proposal</strong>, fill in the form, and submit.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ════════════════ MARKETPLACE ════════════════ */}
        <section className="docs-section" id="marketplace">
          <div className="docs-page-entry">
            <div className="docs-page-header">
              <div className="docs-page-icon">🛒</div>
              <div>
                <div className="docs-page-title">Marketplace</div>
                <span className="docs-page-route">/marketplace</span>
              </div>
            </div>
            <p className="docs-page-desc">Decentralized peer-to-peer commerce. List physical goods, digital services, or freelance work. Payments are held in smart contract escrow and released automatically when both parties confirm delivery. No middleman, no censorship.</p>
            <ul className="docs-feature-list">
              <li>Browse listings filtered by category, price, and location</li>
              <li>Create a listing with title, description, price, and images (IPFS-hosted)</li>
              <li>Smart contract escrow protects both buyer and seller</li>
              <li>Dispute resolution through community arbitration</li>
              <li>On-chain reputation system — ratings tied to wallet address</li>
            </ul>
            <div className="docs-interact-box">
              <div className="docs-interact-label">How to interact</div>
              <ol className="docs-interact-steps">
                <li>Navigate to <strong>Marketplace</strong> and browse available listings.</li>
                <li>Click an item and select <strong>Buy</strong> — funds are locked in escrow on-chain.</li>
                <li>Once the seller delivers, click <strong>Confirm Receipt</strong> to release payment.</li>
                <li>To sell: click <strong>Create Listing</strong>, fill in details, upload images, and submit.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ════════════════ DATA VAULT ════════════════ */}
        <section className="docs-section" id="data-vault">
          <div className="docs-page-entry">
            <div className="docs-page-header">
              <div className="docs-page-icon">🔐</div>
              <div>
                <div className="docs-page-title">Data Vault</div>
                <span className="docs-page-route">/data-vault</span>
              </div>
            </div>
            <p className="docs-page-desc">Your personal encrypted cloud. Upload any file — documents, images, credentials, contracts — and it is encrypted client-side before being stored on IPFS. Only you hold the decryption key. File CIDs are optionally registered on-chain for tamper-proof integrity verification.</p>
            <ul className="docs-feature-list">
              <li>Client-side AES-256 encryption before upload</li>
              <li>IPFS persistence — files survive as long as one node pins them</li>
              <li>Optional on-chain CID registration for integrity proofs</li>
              <li>Selective sharing — grant read access to specific wallet addresses</li>
              <li>File browser with categories, tags, and search</li>
            </ul>
            <div className="docs-interact-box">
              <div className="docs-interact-label">How to interact</div>
              <ol className="docs-interact-steps">
                <li>Navigate to <strong>Data Vault</strong>.</li>
                <li>Click <strong>Upload</strong> and select a file — encrypted locally first.</li>
                <li>The IPFS CID is shown after upload; save it for future reference.</li>
                <li>To share: enter a recipient wallet address and grant read permission.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ════════════════ STORAGE ════════════════ */}
        <section className="docs-section" id="storage">
          <div className="docs-page-entry">
            <div className="docs-page-header">
              <div className="docs-page-icon">☁️</div>
              <div>
                <div className="docs-page-title">Storage</div>
                <span className="docs-page-route">/storage</span>
              </div>
            </div>
            <p className="docs-page-desc">General-purpose decentralized file storage. Unlike the Data Vault (private + encrypted), Storage can hold publicly accessible files and media — images for marketplace listings, governance attachments, or community resources.</p>
            <ul className="docs-feature-list">
              <li>Upload files directly to IPFS via the backend pinning service</li>
              <li>Choose public or encrypted storage mode</li>
              <li>Manage pinned files — view, rename, and unpin</li>
              <li>Copy IPFS gateway links for sharing or embedding</li>
            </ul>
            <div className="docs-interact-box">
              <div className="docs-interact-label">How to interact</div>
              <ol className="docs-interact-steps">
                <li>Go to <strong>Storage</strong> and click <strong>Upload File</strong>.</li>
                <li>Select public or private mode and choose your file.</li>
                <li>After upload, copy the IPFS link to share or embed anywhere.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ════════════════ OFFLINE QUEUE ════════════════ */}
        <section className="docs-section" id="offline">
          <div className="docs-page-entry">
            <div className="docs-page-header">
              <div className="docs-page-icon">📶</div>
              <div>
                <div className="docs-page-title">Offline Queue</div>
                <span className="docs-page-route">/offline-queue</span>
              </div>
            </div>
            <p className="docs-page-desc">Designed for low-connectivity environments. When your device is offline, any action you initiate (send payment, create listing, cast vote) is saved to a local queue. When connectivity resumes, the queue processes automatically in order.</p>
            <ul className="docs-feature-list">
              <li>Automatic offline detection and action queuing</li>
              <li>Queue persists across page reloads via localStorage</li>
              <li>Manual sync trigger — process on demand</li>
              <li>Review and cancel individual queued items</li>
              <li>Visual status: Pending → Broadcasting → Confirmed</li>
            </ul>
            <div className="docs-interact-box">
              <div className="docs-interact-label">How to interact</div>
              <ol className="docs-interact-steps">
                <li>Actions taken while offline are automatically routed here.</li>
                <li>Navigate to <strong>Offline Queue</strong> to see pending items.</li>
                <li>Click <strong>Sync Now</strong> when back online to broadcast all queued transactions.</li>
                <li>Delete any item you no longer want to broadcast before syncing.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ════════════════ NODE ════════════════ */}
        <section className="docs-section" id="node">
          <div className="docs-page-entry">
            <div className="docs-page-header">
              <div className="docs-page-icon">🖥️</div>
              <div>
                <div className="docs-page-title">Node / Validator</div>
                <span className="docs-page-route">/node</span>
              </div>
            </div>
            <p className="docs-page-desc">Earn rewards by contributing infrastructure. Stake tokens to register as a validator node. Your node confirms transactions, replicates data, and contributes bandwidth to the network. Rewards are distributed proportionally to uptime and stake weight.</p>
            <ul className="docs-feature-list">
              <li>Register your node with a stake deposit</li>
              <li>Live dashboard: uptime, block count, reward accrual</li>
              <li>Claim accumulated staking rewards on demand</li>
              <li>Unstake and exit validator set with a cooling-off period</li>
              <li>Network-wide validator leaderboard</li>
              <li>Node health diagnostics and alert panel</li>
            </ul>
            <div className="docs-interact-box">
              <div className="docs-interact-label">How to interact</div>
              <ol className="docs-interact-steps">
                <li>Ensure you have enough CVT tokens to meet the minimum stake requirement.</li>
                <li>Navigate to <strong>Node</strong> and click <strong>Register Node</strong>.</li>
                <li>Enter your stake amount and confirm the on-chain transaction.</li>
                <li>Monitor your dashboard and click <strong>Claim Rewards</strong> when balance accrues.</li>
                <li>To exit: click <strong>Unstake</strong> and wait for the cooling-off period.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ════════════════ ANALYTICS ════════════════ */}
        <section className="docs-section" id="analytics">
          <div className="docs-page-entry">
            <div className="docs-page-header">
              <div className="docs-page-icon">📊</div>
              <div>
                <div className="docs-page-title">Analytics</div>
                <span className="docs-page-route">/analytics</span>
              </div>
            </div>
            <p className="docs-page-desc">Real-time network and personal analytics. Charts and tables give you a live view of on-chain activity, token circulation, governance participation, marketplace volume, and your own portfolio performance over time.</p>
            <ul className="docs-feature-list">
              <li>Live transaction throughput and block time charts</li>
              <li>Token price, volume, and market cap over selectable time ranges</li>
              <li>Governance participation rates and vote breakdowns</li>
              <li>Marketplace trade volume by category</li>
              <li>Personal portfolio performance and P&amp;L history</li>
              <li>Export data as CSV for external analysis</li>
            </ul>
            <div className="docs-interact-box">
              <div className="docs-interact-label">How to interact</div>
              <ol className="docs-interact-steps">
                <li>Navigate to <strong>Analytics</strong>.</li>
                <li>Toggle between <em>Network</em> and <em>Personal</em> views using the tab bar.</li>
                <li>Adjust the time range (24h / 7d / 30d / All) with the selector.</li>
                <li>Hover over chart points for exact values; click <strong>Export CSV</strong> to download.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ════════════════ COMMUNITY ════════════════ */}
        <section className="docs-section" id="community">
          <div className="docs-page-entry">
            <div className="docs-page-header">
              <div className="docs-page-icon">🌐</div>
              <div>
                <div className="docs-page-title">Community</div>
                <span className="docs-page-route">/community</span>
              </div>
            </div>
            <p className="docs-page-desc">The social layer of CIVITAS. Join or create communities that live on-chain. Memberships are tied to your DID. Post discussions, vote on community proposals, and coordinate with users across the globe.</p>
            <ul className="docs-feature-list">
              <li>Browse and join communities by interest or geography</li>
              <li>Post text, images, and links — stored on IPFS</li>
              <li>Community-level governance with elected moderators</li>
              <li>Member directory with reputation scores</li>
              <li>Events calendar with on-chain RSVP</li>
            </ul>
            <div className="docs-interact-box">
              <div className="docs-interact-label">How to interact</div>
              <ol className="docs-interact-steps">
                <li>Navigate to <strong>Community</strong> and browse the list.</li>
                <li>Click <strong>Join</strong> on any community — membership recorded on-chain.</li>
                <li>Use <strong>New Post</strong> to share content visible to all members.</li>
                <li>Click <strong>Create Community</strong> to start your own group.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ════════════════ MOBILE MONEY ════════════════ */}
        <section className="docs-section" id="mobile-money">
          <div className="docs-page-entry">
            <div className="docs-page-header">
              <div className="docs-page-icon">📱</div>
              <div>
                <div className="docs-page-title">Mobile Money</div>
                <span className="docs-page-route">/mobile-money</span>
              </div>
            </div>
            <p className="docs-page-desc">Bridge between traditional mobile money (M-Pesa, GCash, PayMaya, bKash, Wave, etc.) and the CIVITAS blockchain. Deposit fiat via mobile money and receive equivalent CVT tokens. Withdraw back to mobile money at any time.</p>
            <ul className="docs-feature-list">
              <li>Connect mobile money accounts from supported providers</li>
              <li>On-ramp: convert fiat to CVT at current oracle rate</li>
              <li>Off-ramp: convert CVT back to fiat and withdraw to mobile wallet</li>
              <li>Live exchange rate display with full fee breakdown</li>
              <li>Transaction history for all mobile money operations</li>
            </ul>
            <div className="docs-interact-box">
              <div className="docs-interact-label">How to interact</div>
              <ol className="docs-interact-steps">
                <li>Navigate to <strong>Mobile Money</strong> and select your provider.</li>
                <li>Enter your mobile money phone number to link the account.</li>
                <li>To deposit: enter an amount and confirm — tokens arrive in seconds.</li>
                <li>To withdraw: enter the amount and confirm — fiat is sent to your mobile wallet.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ════════════════ AIRDROP ════════════════ */}
        <section className="docs-section" id="airdrop">
          <div className="docs-page-entry">
            <div className="docs-page-header">
              <div className="docs-page-icon">🪂</div>
              <div>
                <div className="docs-page-title">Airdrop</div>
                <span className="docs-page-route">/airdrop</span>
              </div>
            </div>
            <p className="docs-page-desc">Token distribution campaigns. Admins can schedule airdrops that send tokens to eligible addresses — early adopters, active voters, marketplace traders. Check eligibility, view upcoming campaigns, and claim tokens in one click.</p>
            <ul className="docs-feature-list">
              <li>Browse active and upcoming airdrop campaigns</li>
              <li>Check wallet eligibility before claiming</li>
              <li>One-click claim — tokens transferred directly on-chain</li>
              <li>Merkle proof verification ensures fairness and prevents double-claiming</li>
              <li>Admin panel to create and configure new campaigns</li>
            </ul>
            <div className="docs-interact-box">
              <div className="docs-interact-label">How to interact</div>
              <ol className="docs-interact-steps">
                <li>Navigate to <strong>Airdrop</strong> with your wallet connected.</li>
                <li>Browse listed campaigns and check the <em>Eligible</em> status next to each.</li>
                <li>Click <strong>Claim</strong> on any eligible campaign and confirm the transaction.</li>
                <li>Tokens are sent immediately to your connected wallet.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ════════════════ AUTOMATION ════════════════ */}
        <section className="docs-section" id="automation">
          <div className="docs-page-entry">
            <div className="docs-page-header">
              <div className="docs-page-icon">⚙️</div>
              <div>
                <div className="docs-page-title">Automation</div>
                <span className="docs-page-route">/automation</span>
              </div>
            </div>
            <p className="docs-page-desc">Smart workflow automation. Create rules that trigger on-chain or off-chain actions automatically — recurring payments, event-based alerts, or conditional contract calls. Powered by on-chain time-lock contracts and blockchain event watchers.</p>
            <ul className="docs-feature-list">
              <li>Rule builder: trigger + condition + action interface</li>
              <li>Recurring payment schedules</li>
              <li>Blockchain event watchers (new proposal, price alert, etc.)</li>
              <li>Webhook integration for external notifications</li>
              <li>Active rule list with enable/disable toggles</li>
              <li>Full execution history log per rule</li>
            </ul>
            <div className="docs-interact-box">
              <div className="docs-interact-label">How to interact</div>
              <ol className="docs-interact-steps">
                <li>Navigate to <strong>Automation</strong> and click <strong>New Rule</strong>.</li>
                <li>Select a trigger (time, event, price), add an optional condition, and choose an action.</li>
                <li>Click <strong>Save &amp; Activate</strong> — the rule runs automatically from now on.</li>
                <li>Monitor executions in the history panel; pause any rule by toggling it off.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ════════════════ AI ════════════════ */}
        <section className="docs-section" id="ai">
          <div className="docs-page-entry">
            <div className="docs-page-header">
              <div className="docs-page-icon">🤖</div>
              <div>
                <div className="docs-page-title">AI Assistant</div>
                <span className="docs-page-route">/ai</span>
              </div>
            </div>
            <p className="docs-page-desc">An AI-powered assistant embedded in the platform. Ask questions about your balance, get governance summaries, draft marketplace listings, or analyze transaction history. The assistant has read access to your on-chain data but <strong>never executes transactions without your explicit approval</strong>.</p>
            <ul className="docs-feature-list">
              <li>Natural language queries about your wallet and activity</li>
              <li>Governance proposal summaries and voting recommendations</li>
              <li>Marketplace listing drafts from simple descriptions</li>
              <li>Transaction history analysis and spending insights</li>
              <li>Smart contract explainer — paste an ABI and get plain-English descriptions</li>
            </ul>
            <div className="docs-interact-box">
              <div className="docs-interact-label">How to interact</div>
              <ol className="docs-interact-steps">
                <li>Navigate to <strong>AI</strong> and type a question or command in the chat input.</li>
                <li>The assistant responds with analysis, drafts, or step-by-step guidance.</li>
                <li>If it suggests a transaction, review it and click <strong>Approve</strong> to execute.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ════════════════ TECH STACK ════════════════ */}
        <section className="docs-section" id="tech-stack">
          <div className="docs-section-header">
            <div className="docs-section-icon">🧱</div>
            <div>
              <h2 className="docs-section-title">Tech Stack</h2>
              <p className="docs-section-subtitle">Libraries, protocols, and ports</p>
            </div>
          </div>
          <p className="docs-body">Every major dependency in the CIVITAS system:</p>
          <div className="docs-stack-row">
            {[
              ['Frontend',              'React 18 + Vite'],
              ['Blockchain lib',        'ethers v6'],
              ['Smart contracts',       'Solidity + Hardhat'],
              ['Local chain',           'Hardhat EVM  (port 8545)'],
              ['Backend',               'Node.js + Express  (port 3001)'],
              ['Realtime transport',    'WebSocket'],
              ['Decentralised storage', 'IPFS  (port 5001)'],
              ['Web app URL',           'http://localhost:3002'],
              ['Wallet encryption',     'AES-256 keystore (ethers)'],
              ['Identity standard',     'W3C DID spec'],
              ['Governance contracts',  'OpenZeppelin Governor'],
              ['Token standard',        'ERC-20 (CVT)'],
            ].map(([label, value]) => (
              <div className="docs-stack-chip" key={label}>
                <span className="docs-stack-chip-label">{label}:</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
          <div className="docs-callout">
            <div className="docs-callout-icon">🔧</div>
            <div className="docs-callout-body">
              <strong>Running the full system</strong>
              Four services must be running: Hardhat node (8545), messaging backend (3001), IPFS daemon (5001), and the Vite dev server (3002). Start them individually in separate terminals or use the provided startup scripts.
            </div>
          </div>
        </section>

        {/* ════════════════ FAQ ════════════════ */}
        <section className="docs-section" id="faq">
          <div className="docs-section-header">
            <div className="docs-section-icon">❓</div>
            <div>
              <h2 className="docs-section-title">FAQ</h2>
              <p className="docs-section-subtitle">Common questions answered</p>
            </div>
          </div>
          {[
            { q: 'Do I need MetaMask or any browser extension?',
              a: 'No. CIVITAS includes a built-in wallet engine. You can create a new wallet or import an existing one (via seed phrase or private key) directly in the platform. Your keys are encrypted with your password and stored only in your browser\'s local storage.' },
            { q: 'Are my private keys ever sent to a server?',
              a: 'Never. Private keys and seed phrases are generated and encrypted entirely in your browser using ethers.js. The backend server only relays encrypted messages and stores IPFS content. It never receives, stores, or logs private key material.' },
            { q: 'What happens to my data if I clear my browser storage?',
              a: 'Your encrypted wallet keystore will be deleted from local storage. You can restore your wallet at any time using the 12-word seed phrase shown during wallet creation. Always back up your seed phrase in a secure offline location.' },
            { q: 'Can I use CIVITAS on a real blockchain network?',
              a: 'Yes. Change the RPC URL in web3Service.js from http://127.0.0.1:8545 to any EVM-compatible network (Polygon, BSC, Ethereum, Arbitrum, etc.) and deploy the smart contracts there. The rest of the application works without code changes.' },
            { q: 'What is a DID and why do I need one?',
              a: 'A Decentralized Identifier (DID) is a W3C-standard identifier anchored on-chain. It links your wallet address to a verifiable identity profile — useful for reputation, credential issuance, and platform permissions. Registration is optional but unlocks Identity, Governance, and Marketplace reputation features.' },
            { q: 'How does the offline queue work?',
              a: 'When your browser loses connectivity, any action you attempt is serialised and saved to localStorage. When connectivity returns, the queue is processed automatically in order. You can also trigger sync manually from the Offline Queue page.' },
            { q: 'How are marketplace payments kept safe?',
              a: 'Buyer funds are transferred to a smart contract escrow at purchase time. The seller cannot access them until the buyer confirms delivery. If a dispute arises, community arbitrators can vote to direct the escrow.' },
            { q: 'What token does CIVITAS use?',
              a: 'CVT (CIVITAS Token) is the native ERC-20 governance and utility token. It is used for staking, governance voting, marketplace fees, and airdrop distributions. On the local development chain, tokens can be claimed for free via the Airdrop page.' },
          ].map(({ q, a }) => (
            <div className="docs-faq-item" key={q}>
              <div className="docs-faq-q">{q}</div>
              <div className="docs-faq-a">{a}</div>
            </div>
          ))}
        </section>

      </main>
    </div>
  );
}
