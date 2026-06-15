import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Coins, Star, Vote, Package, ShoppingCart, Truck,
  Fingerprint, Wallet, HardDrive, MessageCircle, RefreshCw, Scale,
  Send, ArrowUpRight,
} from 'lucide-react';
import './HomePage.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { isConnected, isLoading, connectWallet, getUserDashboard, getPlatformStats } = useApp();
  const [dashboardData, setDashboardData] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadDashboard();
    } else {
      loadPublicStats();
    }
  }, [isConnected]);

  const loadDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const [userDash, platStats] = await Promise.all([
        getUserDashboard(),
        getPlatformStats()
      ]);
      setDashboardData(userDash);
      setPlatformStats(platStats);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const loadPublicStats = async () => {
    try {
      const stats = await getPlatformStats();
      setPlatformStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleGetStarted = async () => {
    if (!isConnected) {
      await connectWallet();
    }
    navigate('/wallet');
  };

  // Show dashboard if connected
  if (isConnected && dashboardData) {
    const profile     = dashboardData?.profile     || {};
    const activity    = dashboardData?.activity    || {};
    const pending     = dashboardData?.pending     || {};
    const recentVotes = dashboardData?.recentActivity?.votes  || [];
    const recentOrders= dashboardData?.recentActivity?.orders || [];

    return (
      <div className="home-page dashboard-view">
        <div className="container">
          <div className="dashboard-header">
            <div>
              <h1>Welcome back, {profile.name || 'User'}!</h1>
              <p className="dashboard-subtitle">Here's your CIVITAS overview</p>
            </div>
            {profile.verified && (
              <span className="verified-badge">✓ Verified</span>
            )}
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-icon"><Coins size={20} /></div>
              <div className="stat-content">
                <div className="stat-value">{parseFloat(profile.balance || 0).toFixed(2)} CIV</div>
                <div className="stat-label">Balance</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Star size={20} /></div>
              <div className="stat-content">
                <div className="stat-value">{profile.reputation || 0}</div>
                <div className="stat-label">Reputation</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Vote size={20} /></div>
              <div className="stat-content">
                <div className="stat-value">{activity.totalVotes || 0}</div>
                <div className="stat-label">Votes Cast</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Package size={20} /></div>
              <div className="stat-content">
                <div className="stat-value">{activity.totalListings || 0}</div>
                <div className="stat-label">Listings</div>
              </div>
            </div>
          </div>

          {/* Pending Actions */}
          {(pending.proposalsToVote > 0 || 
            pending.ordersToComplete > 0 || 
            pending.ordersToDeliver > 0) && (
            <div className="pending-actions">
              <h2>Pending Actions</h2>
              <div className="action-cards">
                {pending.proposalsToVote > 0 && (
                  <div className="action-card" onClick={() => navigate('/governance')}>
                    <span className="action-icon"><Vote size={20} /></span>
                    <div className="action-content">
                      <h3>{pending.proposalsToVote} Proposals</h3>
                      <p>Waiting for your vote</p>
                    </div>
                    <span className="action-arrow">→</span>
                  </div>
                )}
                {pending.ordersToComplete > 0 && (
                  <div className="action-card" onClick={() => navigate('/marketplace')}>
                    <span className="action-icon"><Package size={20} /></span>
                    <div className="action-content">
                      <h3>{pending.ordersToComplete} Orders</h3>
                      <p>Review and complete delivery</p>
                    </div>
                    <span className="action-arrow">→</span>
                  </div>
                )}
                {pending.ordersToDeliver > 0 && (
                  <div className="action-card" onClick={() => navigate('/marketplace')}>
                    <span className="action-icon"><Truck size={20} /></span>
                    <div className="action-content">
                      <h3>{pending.ordersToDeliver} Sales</h3>
                      <p>Deliver to buyers</p>
                    </div>
                    <span className="action-arrow">→</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Activity & Platform Stats */}
          <div className="dashboard-grid">
            <div className="recent-activity-section">
              <h2>Recent Activity</h2>
              {recentVotes.length === 0 && 
               recentOrders.length === 0 ? (
                <p className="empty-message">No recent activity</p>
              ) : (
                <div className="activity-list">
                  {recentVotes.map((vote, idx) => (
                    <div key={`vote-${idx}`} className="activity-item">
                      <span className="activity-icon"><Vote size={16} /></span>
                      <span>Voted {vote.voteType} on Proposal #{vote.proposalId}</span>
                      <span className="activity-time">
                        {new Date(vote.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {recentOrders.map((order, idx) => (
                    <div key={`order-${idx}`} className="activity-item">
                      <span className="activity-icon">
                        {order.type === 'purchase' ? <ShoppingCart size={16} /> : <Coins size={16} />}
                      </span>
                      <span>
                        {order.type === 'purchase' ? 'Purchased' : 'Sold'}: {order.title}
                      </span>
                      <span className="activity-time">
                        {new Date(order.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {platformStats && (
              <div className="platform-stats-section">
                <h2>Platform Stats</h2>
                <div className="platform-stats-list">
                  <div className="platform-stat">
                    <span className="stat-label">Total Users</span>
                    <span className="stat-value">{(platformStats?.platform?.totalUsers || 0).toLocaleString()}</span>
                  </div>
                  <div className="platform-stat">
                    <span className="stat-label">Active Proposals</span>
                    <span className="stat-value">{platformStats?.governance?.activeProposals || 0}</span>
                  </div>
                  <div className="platform-stat">
                    <span className="stat-label">Marketplace Listings</span>
                    <span className="stat-value">{platformStats?.marketplace?.activeListings || 0}</span>
                  </div>
                  <div className="platform-stat">
                    <span className="stat-label">Transaction Volume</span>
                    <span className="stat-value">{parseFloat(platformStats?.transactions?.volume || 0).toLocaleString()} CIV</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h2 className="section-title">Quick Actions</h2>
            <div className="action-buttons">
              <button className="btn btn-secondary" onClick={() => navigate('/wallet')}>
                <Send size={14} /> Send CIV
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/governance')}>
                <Vote size={14} /> Vote on Proposals
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/marketplace')}>
                <ShoppingCart size={14} /> Browse Marketplace
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/identity')}>
                <Fingerprint size={14} /> Manage Identity
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show landing page if not connected
  return (
    <div className="home-page">

      {/* ─── Hero ─── */}
      <section className="hero">
        {/* Large background identity icon */}
        <div className="hero-bg-icon" aria-hidden="true">
          <Fingerprint size={640} strokeWidth={0.35} />
        </div>
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Decentralized · Sovereign · Open
          </div>
          <h1 className="hero-title">
            Own Your<br />
            <span className="gradient-text">Digital Life</span>
          </h1>
          <p className="hero-subtitle">
            CIVITAS is a decentralized ecosystem empowering global digital sovereignty
            through self-sovereign identity, non-custodial finance, and community governance.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={handleGetStarted}>
              {isConnected ? 'Go to Wallet' : 'Get Started Free'}
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate('/docs')}>
              Read the Docs
            </button>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">10M+</div>
              <div className="hero-stat-label">Target Users</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">100%</div>
              <div className="hero-stat-label">Data Ownership</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">0</div>
              <div className="hero-stat-label">Middlemen</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">E2E</div>
              <div className="hero-stat-label">Encrypted</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="features-section">
        <div className="features-section section-eyebrow">Everything you need</div>
        <h2 className="features-section section-heading">All-In-One Digital Ecosystem</h2>

        <div className="features-grid">
          {[
            { Icon: Fingerprint, title: 'Self-Sovereign Identity', desc: 'Control your digital identity with decentralized identifiers (DIDs) and verifiable credentials. No central authority.' },
            { Icon: Wallet,      title: 'Non-Custodial Finance',   desc: 'Your keys, your crypto. P2P payments, smart escrows, and automated savings without intermediaries.' },
            { Icon: HardDrive,   title: 'Decentralized Storage',   desc: 'Encrypted file storage on IPFS. Your data stays private and accessible only to you.' },
            { Icon: MessageCircle, title: 'Secure Messaging',      desc: 'End-to-end encrypted messaging via XMTP. No surveillance, no data mining, no servers.' },
            { Icon: RefreshCw,   title: 'Smart Automation',        desc: 'Programmable smart contracts for everyday tasks. Automate payments, alerts, and more.' },
            { Icon: Scale,       title: 'DAO Governance',          desc: 'Community-driven decisions with quadratic voting. Shape the future of CIVITAS together.' },
          ].map(({ Icon, title, desc }) => (
            <div className="feature-card" key={title}>
              <div className="feature-icon-wrap"><Icon size={28} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">10M+</div>
            <div className="stat-label">Target Users by 2030</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">50%</div>
            <div className="stat-label">From Developing Countries</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">60%</div>
            <div className="stat-label">Reduction in Financial Loss</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">100%</div>
            <div className="stat-label">User Data Ownership</div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="cta-section">
        <div className="cta-card">
          <h2>Ready to Take Control?</h2>
          <p>
            Join the digital sovereignty revolution. Build a future where you
            own your identity, data, and financial freedom.
          </p>
          <div className="cta-btn-group">
            <button className="btn btn-primary btn-lg" onClick={handleGetStarted}>
              {isConnected ? 'Go to Dashboard' : 'Launch App'}
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/community')}>
              Join Community
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
