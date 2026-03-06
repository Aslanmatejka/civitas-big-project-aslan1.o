import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './ProfilePage.css';

export default function ProfilePage() {
  const { wallet, isConnected, isLoading, getAggregatedProfile } = useApp();
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isConnected && wallet?.address) {
      loadProfileData();
    }
  }, [wallet?.address, isConnected]);

  const loadProfileData = async () => {
    setLoadingProfile(true);
    setError(null);
    try {
      const data = await getAggregatedProfile();
      if (data) {
        setProfileData(data);
      } else {
        // Use mock data when API fails
        setProfileData(getMockProfileData());
        setError('Using demo data - backend unavailable');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfileData(getMockProfileData());
      setError('Using demo data - backend unavailable');
    } finally {
      setLoadingProfile(false);
    }
  };

  const getMockProfileData = () => ({
    profile: {
      walletAddress: wallet?.address,
      name: wallet?.address?.substring(0, 10) + '...',
      about: 'Demo profile',
      avatar: null,
      createdAt: new Date()
    },
    identity: {
      did: 'did:civitas:demo',
      name: 'Demo User',
      verified: false
    },
    reputation: 0,
    stats: {
      balance: '0',
      connections: 0,
      attestations: 0,
      votes: 0,
      purchases: 0
    },
    attestations: [],
    recentActivity: []
  });

  if (!isConnected) {
    return (
      <div className="profile-page">
        <div className="not-connected">
          <h2>Connect Wallet</h2>
          <p>Please connect your wallet to view your profile.</p>
        </div>
      </div>
    );
  }

  if (loadingProfile) {
    return (
      <div className="profile-page">
        <div className="loading-profile">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="profile-page">
        <div className="not-connected">
          <h2>Error Loading Profile</h2>
          <p>Unable to load profile data. Please try again later.</p>
          <button onClick={loadProfileData} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {error && (
          <div className="error-banner" style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#856404'
          }}>
            ⚠️ {error}
          </div>
        )}
        
        <h1>Your Profile</h1>

        <div className="profile-grid">
          {/* Profile Card */}
          <div className="profile-card">
            <div className="profile-avatar">
              {profileData?.profile?.avatar || wallet?.address?.substring(2, 4).toUpperCase()}
            </div>
            <h2>{profileData?.identity?.name || `${wallet?.address?.substring(0, 10)}...`}</h2>
            <p className="profile-address">{wallet?.address}</p>
            {profileData?.identity?.verified && (
              <span className="verified-badge">✓ Verified</span>
            )}
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{parseFloat(profileData?.stats?.balance || 0).toFixed(2)}</div>
              <div className="stat-label">CIV Balance</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{profileData?.reputation || 0}</div>
              <div className="stat-label">Reputation Score</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{profileData?.stats?.connections || 0}</div>
              <div className="stat-label">Connections</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{profileData?.stats?.attestations || 0}</div>
              <div className="stat-label">Attestations</div>
            </div>
          </div>

          {/* Attestations */}
          <div className="attestations-section">
            <h2>Attestations & Badges</h2>
            {(profileData?.attestations || []).length === 0 ? (
              <div className="empty-attestations">
                <p>No attestations yet. Complete activities to earn badges!</p>
              </div>
            ) : (
              <div className="attestations-list">
                {(profileData?.attestations || []).map((att) => (
                  <div key={att.id} className="attestation-card">
                    <div className="attestation-icon">🏅</div>
                    <div className="attestation-info">
                      <h3>{att.type}</h3>
                      <p>Issued by {att.issuer}</p>
                      <p className="attestation-date">
                        {new Date(att.issuedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="activity-section">
            <h2>Recent Activity</h2>
            {(profileData?.recentActivity || []).length === 0 ? (
              <div className="empty-activity">
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="activity-list">
                {(profileData?.recentActivity || []).map((activity, index) => (
                  <div key={index} className="activity-item">
                    <span className="activity-icon">{activity.icon}</span>
                    <span>{activity.description}</span>
                    <span className="activity-time">
                      {getRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format relative time
function getRelativeTime(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return then.toLocaleDateString();
}
