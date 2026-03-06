import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import LanguageSelector from './LanguageSelector';
import './Header.css';

export default function Header() {
  const { wallet, isConnected, balance, reputation, connectWallet, disconnectWallet, setShowWalletSetup } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const location = useLocation();

  const handleConnectWallet = () => {
    setShowWalletSetup(true);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setShowDropdown(false);
  };

  const isActive = (path) => location.pathname === path;

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          🏛️ CIVITAS
        </Link>
        
        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          ☰
        </button>

        {/* Navigation */}
        <nav className={`nav ${showMobileMenu ? 'mobile-show' : ''}`}>
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/wallet" className={`nav-link ${isActive('/wallet') ? 'active' : ''}`}>
            Wallet
          </Link>
          <Link to="/identity" className={`nav-link ${isActive('/identity') ? 'active' : ''}`}>
            Identity
          </Link>
          <Link to="/governance" className={`nav-link ${isActive('/governance') ? 'active' : ''}`}>
            Governance
          </Link>
          <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
            Profile
          </Link>
          <Link to="/marketplace" className={`nav-link ${isActive('/marketplace') ? 'active' : ''}`}>
            Marketplace
          </Link>
          <Link to="/analytics" className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}>
            Analytics
          </Link>
          <Link to="/community" className={`nav-link ${isActive('/community') ? 'active' : ''}`}>
            Community
          </Link>
          <Link to="/node" className={`nav-link ${isActive('/node') ? 'active' : ''}`}>
            Node
          </Link>
          <Link to="/automation" className={`nav-link ${isActive('/automation') ? 'active' : ''}`}>
            Automation
          </Link>
          <Link to="/ai" className={`nav-link ${isActive('/ai') ? 'active' : ''}`}>
            AI
          </Link>
          <Link to="/storage" className={`nav-link ${isActive('/storage') ? 'active' : ''}`}>
            Storage
          </Link>
          <Link to="/messaging" className={`nav-link ${isActive('/messaging') ? 'active' : ''}`}>
            Messaging
          </Link>
          <Link to="/offline-queue" className={`nav-link ${isActive('/offline-queue') ? 'active' : ''}`}>
            Offline Queue
          </Link>
          <Link to="/docs" className={`nav-link ${isActive('/docs') ? 'active' : ''}`}>
            Docs
          </Link>
          <Link to="/appstore" className={`nav-link ${isActive('/appstore') ? 'active' : ''}`}>
            App Store
          </Link>
          <Link to="/datavault" className={`nav-link ${isActive('/datavault') ? 'active' : ''}`}>
            Data Vault
          </Link>
          <Link to="/airdrop" className={`nav-link ${isActive('/airdrop') ? 'active' : ''}`}>
            Airdrop
          </Link>
          <Link to="/mobile-money" className={`nav-link ${isActive('/mobile-money') ? 'active' : ''}`}>
            Mobile Money
          </Link>
        </nav>
        
        {/* Language Selector */}
        <LanguageSelector />
        
        {/* Wallet Connection */}
        <div className="wallet-section">
          {isConnected ? (
            <div className="wallet-connected">
              <div className="wallet-info">
                <div className="wallet-balance">{parseFloat(balance).toFixed(2)} CIV</div>
                <div className="wallet-reputation">⭐ {reputation}</div>
              </div>
              <button 
                className="wallet-address-btn"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {formatAddress(wallet?.address)}
                <span className="dropdown-arrow">▼</span>
              </button>
              
              {showDropdown && (
                <div className="wallet-dropdown">
                  <div className="dropdown-item wallet-full-address">
                    {wallet?.address}
                  </div>
                  <div className="dropdown-divider" />
                  <button 
                    className="dropdown-item disconnect-btn"
                    onClick={handleDisconnect}
                  >
                    Disconnect Wallet
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              className="connect-wallet-btn" 
              onClick={handleConnectWallet}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
