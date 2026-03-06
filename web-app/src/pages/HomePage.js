import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
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
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">{parseFloat(profile.balance || 0).toFixed(2)} CIV</div>
                <div className="stat-label">Balance</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-value">{profile.reputation || 0}</div>
                <div className="stat-label">Reputation</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🗳️</div>
              <div className="stat-content">
                <div className="stat-value">{activity.totalVotes || 0}</div>
                <div className="stat-label">Votes Cast</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📦</div>
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
                    <span className="action-icon">🗳️</span>
                    <div className="action-content">
                      <h3>{pending.proposalsToVote} Proposals</h3>
                      <p>Waiting for your vote</p>
                    </div>
                    <span className="action-arrow">→</span>
                  </div>
                )}
                {pending.ordersToComplete > 0 && (
                  <div className="action-card" onClick={() => navigate('/marketplace')}>
                    <span className="action-icon">📦</span>
                    <div className="action-content">
                      <h3>{pending.ordersToComplete} Orders</h3>
                      <p>Review and complete delivery</p>
                    </div>
                    <span className="action-arrow">→</span>
                  </div>
                )}
                {pending.ordersToDeliver > 0 && (
                  <div className="action-card" onClick={() => navigate('/marketplace')}>
                    <span className="action-icon">🚚</span>
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
                      <span className="activity-icon">🗳️</span>
                      <span>Voted {vote.voteType} on Proposal #{vote.proposalId}</span>
                      <span className="activity-time">
                        {new Date(vote.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {recentOrders.map((order, idx) => (
                    <div key={`order-${idx}`} className="activity-item">
                      <span className="activity-icon">
                        {order.type === 'purchase' ? '🛒' : '💰'}
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
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button className="action-btn" onClick={() => navigate('/wallet')}>
                💸 Send CIV
              </button>
              <button className="action-btn" onClick={() => navigate('/governance')}>
                🗳️ Vote on Proposals
              </button>
              <button className="action-btn" onClick={() => navigate('/marketplace')}>
                📦 Browse Marketplace
              </button>
              <button className="action-btn" onClick={() => navigate('/identity')}>
                🆔 Manage Identity
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
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            Own Your Digital Life
          </h1>
          <p className="hero-subtitle">
            CIVITAS is a decentralized ecosystem empowering global digital sovereignty 
            through self-sovereign identity, non-custodial finance, and community governance.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-large" onClick={handleGetStarted}>
              {isConnected ? 'Go to Wallet' : 'Get Started'}
            </button>
            <button className="btn btn-secondary btn-large" onClick={() => navigate('/docs')}>
              Learn More
            </button>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">All-In-One Digital Ecosystem</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🆔</div>
              <h3>Self-Sovereign Identity</h3>
              <p>
                Control your digital identity with decentralized identifiers (DIDs) 
                and verifiable credentials. No central authority.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Non-Custodial Finance</h3>
              <p>
                Your keys, your crypto. P2P payments, smart escrows, and automated 
                savings without intermediaries.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📦</div>
              <h3>Decentralized Storage</h3>
              <p>
                Encrypted file storage on IPFS. Your data stays private and 
                accessible only to you.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Secure Communication</h3>
              <p>
                End-to-end encrypted messaging and social tools. No surveillance, 
                no data mining.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚙️</div>
              <h3>Smart Automation</h3>
              <p>
                Programmable smart contracts for everyday tasks. Automate payments, 
                alerts, and more.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🗳️</div>
              <h3>DAO Governance</h3>
              <p>
                Community-driven decisions with quadratic voting. Shape the future 
                of CIVITAS together.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="container">
          <h2 className="section-title">Revolutionizing Digital Life Globally</h2>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">10M+</div>
              <div className="stat-label">Target Users by 2030</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">50%</div>
              <div className="stat-label">From Developing Countries</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">60%</div>
              <div className="stat-label">Reduction in Financial Losses</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">100%</div>
              <div className="stat-label">User Data Ownership</div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2>Ready to Take Control?</h2>
            <p>
              Join the digital sovereignty revolution. Build a future where you 
              own your identity, data, and financial freedom.
            </p>
            <button className="btn btn-primary btn-large" onClick={handleGetStarted}>
              {isConnected ? 'Go to Dashboard' : 'Launch App'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
