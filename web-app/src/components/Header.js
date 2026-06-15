import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Home, Wallet, CreditCard, Gift,
  Fingerprint, User, Lock,
  Scale, Landmark, Shield,
  ShoppingCart, Package,
  MessageCircle, Bot, Zap, HardDrive, Network, Radio,
  BarChart2, BookOpen,
  ChevronLeft, ChevronRight, ChevronDown, KeyRound,
  Star,
} from 'lucide-react';

import LanguageSelector from './LanguageSelector';
import './Header.css';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { path: '/',         icon: Home,          label: 'Home'         },
    ]
  },
  {
    label: 'Finance',
    items: [
      { path: '/wallet',       icon: Wallet,        label: 'Wallet'       },
      { path: '/mobile-money', icon: CreditCard,     label: 'Mobile Money' },
      { path: '/airdrop',      icon: Gift,          label: 'Airdrop'      },
    ]
  },
  {
    label: 'Identity',
    items: [
      { path: '/identity',  icon: Fingerprint,   label: 'Identity'   },
      { path: '/profile',   icon: User,          label: 'Profile'    },
      { path: '/datavault', icon: Lock,          label: 'Data Vault' },
    ]
  },
  {
    label: 'Governance',
    items: [
      { path: '/governance',       icon: Scale,     label: 'Governance'       },
      { path: '/community',        icon: Landmark,  label: 'Community'        },
      { path: '/anti-trafficking', icon: Shield,    label: 'Anti-Trafficking' },
    ]
  },
  {
    label: 'Market',
    items: [
      { path: '/marketplace', icon: ShoppingCart,  label: 'Marketplace' },
      { path: '/appstore',    icon: Package,        label: 'App Store'   },
    ]
  },
  {
    label: 'Technology',
    items: [
      { path: '/messaging',     icon: MessageCircle,  label: 'Messaging'     },
      { path: '/ai',            icon: Bot,            label: 'AI Assistant'  },
      { path: '/automation',    icon: Zap,            label: 'Automation'    },
      { path: '/storage',       icon: HardDrive,      label: 'Storage'       },
      { path: '/node',          icon: Network,        label: 'Node'          },
      { path: '/offline-queue', icon: Radio,          label: 'Offline Queue' },
    ]
  },
  {
    label: 'Insights',
    items: [
      { path: '/analytics', icon: BarChart2,  label: 'Analytics' },
      { path: '/docs',      icon: BookOpen,   label: 'Docs'      },
    ]
  },
];

export default function Header() {
  const {
    wallet, isConnected, balance, reputation,
    connectWallet, disconnectWallet, setShowWalletSetup
  } = useApp();

  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const location = useLocation();
  const walletRef = useRef(null);

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const fmt = (addr) => addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';

  // Close wallet dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (walletRef.current && !walletRef.current.contains(e.target)) {
        setShowWalletMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Notify App about collapsed state via body class
  useEffect(() => {
    const main = document.querySelector('.main-content');
    if (main) {
      main.classList.toggle('sidebar-mini', collapsed);
    }
  }, [collapsed]);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button
          className="mobile-toggle-btn"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger ${mobileOpen ? 'open' : ''}`} />
        </button>
        <Link to="/" className="mobile-logo">
          <span className="mobile-logo-icon"><Fingerprint size={18} /></span>
          CIVITAS
        </Link>
        {isConnected ? (
          <button
            className="mobile-wallet-chip"
            onClick={() => { setShowWalletMenu(!showWalletMenu); }}
          >
            <span className="wallet-dot" />
            {fmt(wallet?.address)}
          </button>
        ) : (
          <button
            className="mobile-connect-btn"
            onClick={() => setShowWalletSetup(true)}
          >
            Connect
          </button>
        )}
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>

        {/* Sidebar Header */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <span className="sidebar-logo-icon"><Fingerprint size={20} /></span>
            {!collapsed && <span className="sidebar-logo-text">CIVITAS</span>}
          </Link>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-tooltip={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div className="nav-group" key={group.label}>
              {!collapsed && (
                <span className="nav-group-label">{group.label}</span>
              )}
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                  data-tooltip={collapsed ? item.label : undefined}
                >
                  <span className="sidebar-link-icon"><item.icon size={18} /></span>
                  {!collapsed && (
                    <span className="sidebar-link-label">{item.label}</span>
                  )}
                  {!collapsed && isActive(item.path) && (
                    <span className="sidebar-link-pip" />
                  )}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {!collapsed && <LanguageSelector compact />}

          {isConnected ? (
            <div className="sidebar-wallet" ref={walletRef}>
              <button
                className="sidebar-wallet-btn"
                onClick={() => setShowWalletMenu(!showWalletMenu)}
              >
                <div className="wallet-avatar">
                  {wallet?.address?.slice(2, 4).toUpperCase()}
                </div>
                {!collapsed && (
                  <div className="wallet-meta">
                    <span className="wallet-addr">{fmt(wallet?.address)}</span>
                    <span className="wallet-bal">
                      {parseFloat(balance || 0).toFixed(2)} CIV
                      <span className="wallet-rep"> · <Star size={10} />{reputation}</span>
                    </span>
                  </div>
                )}
                {!collapsed && (
                  <ChevronDown size={14} className={`wallet-chevron ${showWalletMenu ? 'open' : ''}`} />
                )}
              </button>

              {showWalletMenu && (
                <div className="wallet-popover">
                  <div className="wallet-popover-addr">{wallet?.address}</div>
                  <div className="wallet-popover-divider" />
                  <div className="wallet-popover-row">
                    <span>Balance</span>
                    <strong>{parseFloat(balance || 0).toFixed(4)} CIV</strong>
                  </div>
                  <div className="wallet-popover-row">
                    <span>Reputation</span>
                    <strong>⭐ {reputation}</strong>
                  </div>
                  <div className="wallet-popover-divider" />
                  <button
                    className="wallet-popover-disconnect"
                    onClick={() => { disconnectWallet(); setShowWalletMenu(false); }}
                  >
                    Disconnect Wallet
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className={`sidebar-connect-btn ${collapsed ? 'icon-only' : ''}`}
              onClick={() => setShowWalletSetup(true)}
            >
              <KeyRound size={16} />
              {!collapsed && <span>Connect Wallet</span>}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
