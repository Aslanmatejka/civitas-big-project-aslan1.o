import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { walletApi } from '../services/api';
import './WalletPage.css';

export default function WalletPage() {
  const [selectedTab, setSelectedTab] = useState('assets');
  const [sendModal, setSendModal] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [nfts, setNfts] = useState([]);
  const [tokens, setTokens] = useState([]);
  const { wallet, balance, isConnected, isLoading, connectWallet, sendCIV, setShowWalletSetup } = useApp();

  // Load transactions when wallet is connected
  useEffect(() => {
    if (wallet?.address && selectedTab === 'transactions') {
      loadTransactions();
    }
  }, [wallet?.address, selectedTab]);

  // Load NFTs when tab is selected
  useEffect(() => {
    if (wallet?.address && selectedTab === 'nfts') {
      loadNFTs();
    }
  }, [wallet?.address, selectedTab]);

  // Load tokens when tab is selected
  useEffect(() => {
    if (wallet?.address && selectedTab === 'assets') {
      loadTokens();
    }
  }, [wallet?.address, selectedTab]);

  const loadTransactions = async () => {
    if (!wallet?.address) return;
    
    setLoadingTransactions(true);
    try {
      const response = await walletApi.getTransactions(wallet.address);
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      // Keep showing empty or use fallback data
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadNFTs = async () => {
    if (!wallet?.address) return;
    
    try {
      const response = await walletApi.getNFTs(wallet.address);
      setNfts(response.data.nfts || []);
    } catch (error) {
      console.error('Failed to load NFTs:', error);
      setNfts([]);
    }
  };

  const loadTokens = async () => {
    if (!wallet?.address) return;
    
    try {
      const response = await walletApi.getTokens(wallet.address);
      setTokens(response.data.tokens || []);
    } catch (error) {
      console.error('Failed to load tokens:', error);
      setTokens([]);
    }
  };

  const handleSend = async () => {
    if (!recipientAddress || !sendAmount) {
      alert('Please fill all fields');
      return;
    }
    
    try {
      await sendCIV(recipientAddress, sendAmount);
      alert('Transaction sent successfully!');
      setSendModal(false);
      setRecipientAddress('');
      setSendAmount('');
      
      // Reload transactions to show the new one
      if (selectedTab === 'transactions') {
        await loadTransactions();
      }
    } catch (error) {
      alert('Transaction failed: ' + error.message);
    }
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const txDate = new Date(timestamp);
    const diffMs = now - txDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const handleCopyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      alert('Address copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="wallet-page">
        <div className="wallet-container">
          <div className="loading">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="wallet-page">
        <div className="wallet-container">
          <div className="not-connected">
            <div className="nc-hero">
              <div className="nc-icon">⚡</div>
              <h2>Your Self-Sovereign Wallet</h2>
              <p>No bank. No middleman. Full control over your digital assets.<br />Works without MetaMask — generate a wallet right here.</p>
            </div>

            <div className="nc-features">
              <div className="nc-feature">
                <span>🔑</span>
                <div>
                  <strong>Your Keys, Your Crypto</strong>
                  <p>Encrypted locally in your browser. CIVITAS never sees your private key.</p>
                </div>
              </div>
              <div className="nc-feature">
                <span>🌍</span>
                <div>
                  <strong>Works Globally</strong>
                  <p>Send CIV to anyone on the CIVITAS network — no borders, no delays.</p>
                </div>
              </div>
              <div className="nc-feature">
                <span>📲</span>
                <div>
                  <strong>No Extensions Needed</strong>
                  <p>Create or import a wallet directly in-platform. MetaMask optional.</p>
                </div>
              </div>
            </div>

            <button className="btn btn-primary nc-cta" onClick={() => setShowWalletSetup(true)}>
              ✨ Get Started — Create or Import Wallet
            </button>

            {!!window.ethereum && (
              <button className="btn btn-secondary nc-metamask" onClick={connectWallet}>
                🦊 Connect MetaMask instead
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-page">
      <div className="wallet-container">
        {/* Header */}
        <div className="wallet-header">
          <h1>Your Wallet</h1>
          <p className="subtitle">Non-custodial • You control your keys</p>
        </div>

        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-main">
            <h3>Total Balance</h3>
            <h1 className="balance-amount">{parseFloat(balance).toFixed(2)} CIV</h1>
            <p className="balance-usd">≈ ${(parseFloat(balance) * 2).toFixed(2)} USD</p>
          </div>
          <div className="balance-actions">
            <button className="action-btn primary" onClick={() => setSendModal(true)}>
              <span>↑</span> Send
            </button>
            <button className="action-btn secondary" onClick={handleCopyAddress}>
              <span>↓</span> Receive
            </button>
            <button className="action-btn secondary">
              <span>↻</span> Swap
            </button>
          </div>
        </div>

        {/* Send Modal */}
        {sendModal && (
          <div className="modal-overlay" onClick={() => setSendModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Send CIV Tokens</h2>
              <div className="form-group">
                <label>Recipient Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Amount (CIV)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setSendModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSend}>
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="wallet-tabs">
          <button
            className={`tab ${selectedTab === 'assets' ? 'active' : ''}`}
            onClick={() => setSelectedTab('assets')}
          >
            Assets
          </button>
          <button
            className={`tab ${selectedTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setSelectedTab('transactions')}
          >
            Transactions
          </button>
          <button
            className={`tab ${selectedTab === 'nfts' ? 'active' : ''}`}
            onClick={() => setSelectedTab('nfts')}
          >
            NFTs
          </button>
        </div>

        {/* Content */}
        {selectedTab === 'assets' && (
          <div className="assets-section">
            {tokens.length === 0 ? (
              <div className="asset-item">
                <div className="asset-icon">🟣</div>
                <div className="asset-info">
                  <h4>CIVITAS Token</h4>
                  <p className="asset-symbol">CIV</p>
                </div>
                <div className="asset-balance">
                  <h4>{parseFloat(balance).toFixed(2)}</h4>
                  <p className="asset-value">${(parseFloat(balance) * 2).toFixed(2)}</p>
                </div>
              </div>
            ) : (
              tokens.map((token, index) => (
                <div key={`${token.symbol}-${index}`} className="asset-item">
                  <div className="asset-icon">
                    {token.isNative ? '🟣' : '💎'}
                  </div>
                  <div className="asset-info">
                    <h4>{token.name}</h4>
                    <p className="asset-symbol">{token.symbol}</p>
                  </div>
                  <div className="asset-balance">
                    <h4>{parseFloat(token.balance || 0).toFixed(2)}</h4>
                    <p className="asset-value">
                      ${(parseFloat(token.balance || 0) * 2).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'transactions' && (
          <div className="transactions-section">
            {loadingTransactions ? (
              <div className="loading-transactions">
                <p>Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="no-transactions">
                <p>No transactions yet</p>
                <p className="subtitle">Your transaction history will appear here</p>
              </div>
            ) : (
              transactions.map((tx, index) => (
                <div key={tx._id || index} className="transaction-item">
                  <div className={`tx-icon ${tx.direction === 'received' ? 'positive' : 'negative'}`}>
                    {tx.direction === 'received' ? '↓' : '↑'}
                  </div>
                  <div className="tx-info">
                    <h4>
                      {tx.direction === 'received' 
                        ? tx.type === 'reward' ? 'Reward' : 'Received from'
                        : tx.type === 'stake' ? 'Staked' : 'Sent to'}
                    </h4>
                    <p className="tx-address">
                      {tx.direction === 'received' ? formatAddress(tx.from) : formatAddress(tx.to)}
                    </p>
                    {tx.status === 'pending' && (
                      <p className="tx-status pending">⏳ Pending</p>
                    )}
                    {tx.status === 'failed' && (
                      <p className="tx-status failed">❌ Failed</p>
                    )}
                  </div>
                  <div className={`tx-amount ${tx.direction === 'received' ? 'positive' : 'negative'}`}>
                    <h4>
                      {tx.direction === 'received' ? '+' : '-'}
                      {parseFloat(tx.amount).toFixed(2)} {tx.tokenSymbol || 'CIV'}
                    </h4>
                    <p className="tx-time">{formatTimestamp(tx.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'nfts' && (
          <div className="nfts-section">
            {nfts.length === 0 ? (
              <div className="no-nfts">
                <p>No NFTs yet</p>
                <p className="subtitle">Your NFT collection will appear here</p>
              </div>
            ) : (
              <div className="nft-grid">
                {nfts.map((nft, index) => (
                  <div key={nft.tokenId || index} className="nft-card">
                    <div className="nft-image">
                      {nft.image ? <img src={nft.image} alt={nft.name} /> : '🎨'}
                    </div>
                    <h4>{nft.name || `NFT #${nft.tokenId}`}</h4>
                    <p>{nft.metadata?.description || 'Digital Collectible'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Security Notice */}
        <div className="security-notice">
          <h4>🔒 Your Keys, Your Crypto</h4>
          <p>
            CIVITAS cannot access your funds. Always keep your recovery phrase secure and never share it with anyone.
          </p>
        </div>
      </div>
    </div>
  );
}
