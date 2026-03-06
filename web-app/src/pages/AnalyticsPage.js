import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './AnalyticsPage.css';

export default function AnalyticsPage() {
  const { 
    wallet, 
    isConnected, 
    isLoading,
    getAnalyticsOverview,
    getTransactionTimeSeries,
    getUserTimeSeries,
    getGovernanceTimeSeries,
    getMarketplaceTimeSeries,
    getLeaderboards,
    getCategoryAnalytics,
    getSocialEngagement
  } = useApp();
  
  const [timeframe, setTimeframe] = useState('30d');
  const [overview, setOverview] = useState(null);
  const [leaderboards, setLeaderboards] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [socialEngagement, setSocialEngagement] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isConnected) {
      loadAnalytics();
    }
  }, [isConnected, timeframe]);

  const loadAnalytics = async () => {
    setLoadingData(true);
    try {
      const [overviewData, leaderboardData, categoryAnalytics, socialData] = await Promise.all([
        getAnalyticsOverview(timeframe),
        getLeaderboards(),
        getCategoryAnalytics(),
        getSocialEngagement(timeframe)
      ]);

      setOverview(overviewData);
      setLeaderboards(leaderboardData);
      setCategoryData(categoryAnalytics);
      setSocialEngagement(socialData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 CIV';
    return `${formatNumber(amount)} CIV`;
  };

  if (!isConnected) {
    return (
      <div className="analytics-page">
        <div className="not-connected">
          <h2>Connect Wallet</h2>
          <p>Please connect your wallet to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        <div className="analytics-header">
          <h1>📊 Network Analytics</h1>
          <p className="subtitle">Real-time metrics and insights</p>
          
          <div className="timeframe-selector">
            <button 
              className={timeframe === '7d' ? 'active' : ''}
              onClick={() => setTimeframe('7d')}
            >
              7 Days
            </button>
            <button 
              className={timeframe === '30d' ? 'active' : ''}
              onClick={() => setTimeframe('30d')}
            >
              30 Days
            </button>
            <button 
              className={timeframe === '90d' ? 'active' : ''}
              onClick={() => setTimeframe('90d')}
            >
              90 Days
            </button>
          </div>
        </div>

        {loadingData ? (
          <div className="loading-analytics">
            <div className="spinner"></div>
            <p>Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="analytics-tabs">
              <button 
                className={activeTab === 'overview' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={activeTab === 'leaderboards' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('leaderboards')}
              >
                Leaderboards
              </button>
              <button 
                className={activeTab === 'categories' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('categories')}
              >
                Categories
              </button>
              <button 
                className={activeTab === 'social' ? 'tab active' : 'tab'}
                onClick={() => setActiveTab('social')}
              >
                Social
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="tab-content">
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-icon">👥</div>
                    <div className="metric-value">{formatNumber(overview?.users?.total || 0)}</div>
                    <div className="metric-label">Total Users</div>
                    {overview?.users?.growth !== 0 && (
                      <div className={`metric-growth ${overview?.users?.growth > 0 ? 'positive' : 'negative'}`}>
                        {overview?.users?.growth > 0 ? '↑' : '↓'} {Math.abs(overview?.users?.growth || 0)}%
                      </div>
                    )}
                  </div>
                  <div className="metric-card">
                    <div className="metric-icon">💰</div>
                    <div className="metric-value">{formatCurrency(overview?.transactions?.volume || 0)}</div>
                    <div className="metric-label">Transaction Volume</div>
                    {overview?.transactions?.growth !== 0 && (
                      <div className={`metric-growth ${overview?.transactions?.growth > 0 ? 'positive' : 'negative'}`}>
                        {overview?.transactions?.growth > 0 ? '↑' : '↓'} {Math.abs(overview?.transactions?.growth || 0)}%
                      </div>
                    )}
                  </div>
                  <div className="metric-card">
                    <div className="metric-icon">🗳️</div>
                    <div className="metric-value">{formatNumber(overview?.governance?.proposals || 0)}</div>
                    <div className="metric-label">Governance Proposals</div>
                    {overview?.governance?.growth !== 0 && (
                      <div className={`metric-growth ${overview?.governance?.growth > 0 ? 'positive' : 'negative'}`}>
                        {overview?.governance?.growth > 0 ? '↑' : '↓'} {Math.abs(overview?.governance?.growth || 0)}%
                      </div>
                    )}
                  </div>
                  <div className="metric-card">
                    <div className="metric-icon">🛒</div>
                    <div className="metric-value">{formatNumber(overview?.marketplace?.orders || 0)}</div>
                    <div className="metric-label">Marketplace Orders</div>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>User Engagement</h3>
                    <div className="stat-item">
                      <span>Active Users ({timeframe})</span>
                      <strong>{formatNumber(overview?.users?.active || 0)}</strong>
                    </div>
                    <div className="stat-item">
                      <span>Recent Transactions</span>
                      <strong>{formatNumber(overview?.transactions?.recent || 0)}</strong>
                    </div>
                  </div>
                  <div className="stat-card">
                    <h3>Governance Activity</h3>
                    <div className="stat-item">
                      <span>Total Votes Cast</span>
                      <strong>{formatNumber(overview?.governance?.votes || 0)}</strong>
                    </div>
                    <div className="stat-item">
                      <span>Recent Proposals</span>
                      <strong>{overview?.governance?.recent || 0}</strong>
                    </div>
                  </div>
                  <div className="stat-card">
                    <h3>Marketplace</h3>
                    <div className="stat-item">
                      <span>Active Listings</span>
                      <strong>{formatNumber(overview?.marketplace?.listings || 0)}</strong>
                    </div>
                    <div className="stat-item">
                      <span>Recent Orders</span>
                      <strong>{overview?.marketplace?.recentOrders || 0}</strong>
                    </div>
                  </div>
                  <div className="stat-card">
                    <h3>Social Activity</h3>
                    <div className="stat-item">
                      <span>Total Posts</span>
                      <strong>{formatNumber(overview?.social?.posts || 0)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboards Tab */}
            {activeTab === 'leaderboards' && (
              <div className="tab-content">
                <div className="leaderboards-grid">
                  <div className="leaderboard-card">
                    <h3>🏆 Top by Reputation</h3>
                    <div className="leaderboard-list">
                      {leaderboards?.reputation?.length > 0 ? (
                        leaderboards.reputation.map((user, idx) => (
                          <div key={idx} className="leaderboard-item">
                            <span className="rank">#{idx + 1}</span>
                            <div className="user-info">
                              <div className="user-name">{user.name || user.address}</div>
                              <div className="user-stat">{user.reputation} rep · {user.attestations} attestations</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-data">No data available</p>
                      )}
                    </div>
                  </div>

                  <div className="leaderboard-card">
                    <h3>🗳️ Most Active Voters</h3>
                    <div className="leaderboard-list">
                      {leaderboards?.voters?.length > 0 ? (
                        leaderboards.voters.map((user, idx) => (
                          <div key={idx} className="leaderboard-item">
                            <span className="rank">#{idx + 1}</span>
                            <div className="user-info">
                              <div className="user-name">{user.name || user.address}</div>
                              <div className="user-stat">{user.voteCount} votes · {formatNumber(user.totalVotingPower)} power</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-data">No data available</p>
                      )}
                    </div>
                  </div>

                  <div className="leaderboard-card">
                    <h3>💼 Top Sellers</h3>
                    <div className="leaderboard-list">
                      {leaderboards?.sellers?.length > 0 ? (
                        leaderboards.sellers.map((user, idx) => (
                          <div key={idx} className="leaderboard-item">
                            <span className="rank">#{idx + 1}</span>
                            <div className="user-info">
                              <div className="user-name">{user.name || user.address}</div>
                              <div className="user-stat">{user.salesCount} sales · {formatCurrency(user.totalRevenue)}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-data">No data available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div className="tab-content">
                <div className="categories-grid">
                  <div className="category-card">
                    <h3>Governance by Category</h3>
                    <div className="category-list">
                      {categoryData?.governance?.length > 0 ? (
                        categoryData.governance.map((cat, idx) => (
                          <div key={idx} className="category-item">
                            <div className="category-name">{cat.category || 'Uncategorized'}</div>
                            <div className="category-stats">
                              <span>{cat.count} proposals</span>
                              <span className="pass-rate">{cat.passRate?.toFixed(1)}% pass rate</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-data">No data available</p>
                      )}
                    </div>
                  </div>

                  <div className="category-card">
                    <h3>Marketplace by Category</h3>
                    <div className="category-list">
                      {categoryData?.marketplace?.length > 0 ? (
                        categoryData.marketplace.map((cat, idx) => (
                          <div key={idx} className="category-item">
                            <div className="category-name">{cat.category || 'Other'}</div>
                            <div className="category-stats">
                              <span>{cat.count} listings</span>
                              <span>{formatCurrency(cat.avgPrice)} avg</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="no-data">No data available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Social Tab */}
            {activeTab === 'social' && (
              <div className="tab-content">
                <div className="social-stats-grid">
                  <div className="social-stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-value">{formatNumber(socialEngagement?.posts || 0)}</div>
                    <div className="stat-label">Posts</div>
                  </div>
                  <div className="social-stat-card">
                    <div className="stat-icon">❤️</div>
                    <div className="stat-value">{formatNumber(socialEngagement?.likes || 0)}</div>
                    <div className="stat-label">Likes</div>
                  </div>
                  <div className="social-stat-card">
                    <div className="stat-icon">💬</div>
                    <div className="stat-value">{formatNumber(socialEngagement?.comments || 0)}</div>
                    <div className="stat-label">Comments</div>
                  </div>
                  <div className="social-stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-value">{formatNumber(socialEngagement?.follows || 0)}</div>
                    <div className="stat-label">New Follows</div>
                  </div>
                </div>

                <div className="engagement-metrics">
                  <h3>Engagement Metrics</h3>
                  <div className="metric-row">
                    <span>Average Likes per Post</span>
                    <strong>{socialEngagement?.avgLikesPerPost || '0'}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Average Comments per Post</span>
                    <strong>{socialEngagement?.avgCommentsPerPost || '0'}</strong>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
