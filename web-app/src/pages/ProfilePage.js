import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { profileApi } from '../services/api';
import {
  User, Edit3, Shield, Award, Activity, Settings,
  Copy, CheckCircle, Star, Zap, MessageCircle, ShoppingBag,
} from 'lucide-react';
import './ProfilePage.css';

const AVATAR_COLORS = ['#ff0040','#ff6b00','#8b5cf6','#06b6d4','#10b981','#f59e0b'];
const AVATAR_EMOJIS = ['🦁','🐯','🐺','🦊','🦅','🐉','⚡','🔥','💎','🌙','⭐','🎯'];

export default function ProfilePage() {
  const { wallet, isConnected, connectWallet, balance, reputation } = useApp();
  const [activeTab, setActiveTab]   = useState('overview');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [editOpen, setEditOpen]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [copied, setCopied]         = useState(false);
  const [editName, setEditName]     = useState('');
  const [editAbout, setEditAbout]   = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  useEffect(() => {
    if (isConnected && wallet?.address) loadProfile();
  }, [wallet?.address, isConnected]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await profileApi.getAggregatedProfile(wallet.address);
      const d = res.data;
      setProfileData(d);
      setEditName(d.profile?.name || '');
      setEditAbout(d.profile?.about || '');
      setEditAvatar(d.profile?.avatar || '');
    } catch {
      const fallback = {
        profile: { walletAddress: wallet.address, name: '', about: '', avatar: '' },
        identity: { did: null }, stats: { messages: 0, transactions: 0 },
        attestations: [], recentActivity: [],
      };
      setProfileData(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileApi.updateProfile(wallet.address, editName, editAbout, editAvatar);
      setProfileData(prev => ({
        ...prev,
        profile: { ...prev.profile, name: editName, about: editAbout, avatar: editAvatar },
      }));
      setEditOpen(false);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet?.address || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fmt     = a => a ? `${a.slice(0,8)}…${a.slice(-6)}` : '—';
  const initials= a => a ? a.slice(2,4).toUpperCase() : '??';
  const aColor  = a => AVATAR_COLORS[(parseInt(a?.slice(2,4),16)||0) % AVATAR_COLORS.length];

  const displayName   = profileData?.profile?.name || fmt(wallet?.address);
  const displayAvatar = profileData?.profile?.avatar;

  if (!isConnected) return (
    <div className="prof-page">
      <div className="prof-gate">
        <User size={48} strokeWidth={1} />
        <h2>Connect Your Wallet</h2>
        <p>Link your wallet to view and manage your profile.</p>
        <button className="btn btn-primary" onClick={connectWallet}>Connect Wallet</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="prof-page">
      <div className="prof-gate"><div className="prof-spinner" /><p>Loading profile…</p></div>
    </div>
  );

  const TABS = [
    { id: 'overview',    label: 'Overview',    Icon: User },
    { id: 'credentials', label: 'Credentials', Icon: Award },
    { id: 'activity',    label: 'Activity',    Icon: Activity },
    { id: 'settings',    label: 'Settings',    Icon: Settings },
  ];

  const STATS = [
    { label: 'CIV Balance',  value: parseFloat(balance||0).toFixed(2), Icon: Zap,           color: 'amber'  },
    { label: 'Reputation',   value: reputation || 0,                    Icon: Star,          color: 'violet' },
    { label: 'Messages',     value: profileData?.stats?.messages||0,    Icon: MessageCircle, color: 'cyan'   },
    { label: 'Transactions', value: profileData?.stats?.transactions||0,Icon: ShoppingBag,   color: 'green'  },
  ];

  return (
    <div className="prof-page">
      {/* Cover */}
      <div className="prof-cover" />

      {/* Hero */}
      <div className="prof-hero">
        <div className="prof-avatar" style={{ background: aColor(wallet?.address) }}>
          {displayAvatar
            ? <span className="prof-avatar-emoji">{displayAvatar}</span>
            : <span className="prof-avatar-initials">{initials(wallet?.address)}</span>}
        </div>

        <div className="prof-identity">
          <div className="prof-name-row">
            <h1 className="prof-name">{displayName}</h1>
            {profileData?.identity?.did && <span className="prof-did-badge"><Shield size={12}/> DID</span>}
            {reputation > 10 && <span className="prof-rep-badge"><Star size={12}/> {reputation} REP</span>}
          </div>
          <button className="prof-address-btn" onClick={copyAddress}>
            <span className="mono">{fmt(wallet?.address)}</span>
            {copied ? <CheckCircle size={13}/> : <Copy size={13}/>}
          </button>
          {profileData?.profile?.about && <p className="prof-bio">{profileData.profile.about}</p>}
        </div>

        <button className="btn btn-secondary prof-edit-btn" onClick={() => setEditOpen(true)}>
          <Edit3 size={15}/> Edit Profile
        </button>
      </div>

      {/* Stats */}
      <div className="prof-stats">
        {STATS.map(({ label, value, Icon, color }) => (
          <div className={`prof-stat prof-stat--${color}`} key={label}>
            <div className="prof-stat-icon"><Icon size={20}/></div>
            <div className="prof-stat-body">
              <div className="prof-stat-value">{value}</div>
              <div className="prof-stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="prof-tabs">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={`prof-tab ${activeTab===id?'active':''}`} onClick={() => setActiveTab(id)}>
            <Icon size={15}/> {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="prof-body">

        {activeTab === 'overview' && (
          <div className="prof-overview">
            <div className="card prof-info-card">
              <h3>About</h3>
              {profileData?.profile?.about
                ? <p>{profileData.profile.about}</p>
                : <p className="prof-empty-text">No bio yet — click <strong>Edit Profile</strong> to add one.</p>}
            </div>
            <div className="card prof-info-card">
              <h3>Decentralized Identity</h3>
              {profileData?.identity?.did
                ? <div className="prof-did"><Shield size={16}/><code>{profileData.identity.did}</code></div>
                : <p className="prof-empty-text">No DID yet. Visit the <strong>Identity</strong> page to create one.</p>}
            </div>
            <div className="card prof-info-card">
              <h3>Wallet</h3>
              <div className="prof-wallet-row">
                <code className="prof-full-addr">{wallet?.address}</code>
                <button className="prof-copy-mini" onClick={copyAddress}>
                  {copied ? <CheckCircle size={14}/> : <Copy size={14}/>}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'credentials' && (
          <div className="prof-credentials">
            {!(profileData?.attestations?.length) ? (
              <div className="prof-empty">
                <Award size={40} strokeWidth={1}/>
                <h3>No credentials yet</h3>
                <p>Complete activities and get verified to earn badges.</p>
              </div>
            ) : (
              <div className="prof-cred-list">
                {profileData.attestations.map((att, i) => (
                  <div key={i} className="card prof-cred-item">
                    <div className="prof-cred-icon"><Award size={22}/></div>
                    <div className="prof-cred-body">
                      <div className="prof-cred-type">{att.type}</div>
                      <div className="prof-cred-issuer">Issued by {att.issuer}</div>
                    </div>
                    <div className="prof-cred-date">{att.issuedAt ? new Date(att.issuedAt).toLocaleDateString() : ''}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="prof-activity">
            {!(profileData?.recentActivity?.length) ? (
              <div className="prof-empty">
                <Activity size={40} strokeWidth={1}/>
                <h3>No activity yet</h3>
                <p>Your on-chain and platform activity will appear here.</p>
              </div>
            ) : (
              <div className="prof-activity-list">
                {profileData.recentActivity.map((item, i) => (
                  <div key={i} className="prof-activity-item">
                    <div className="prof-activity-dot"/>
                    <div className="prof-activity-body">
                      <span>{item.description}</span>
                      <span className="prof-activity-time">{item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="prof-settings">
            <div className="card prof-settings-card">
              <h3>Display</h3>
              <div className="prof-setting-row">
                <div>
                  <div className="prof-setting-label">Name &amp; Avatar</div>
                  <div className="prof-setting-hint">Shown across the platform</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setEditOpen(true)}>
                  <Edit3 size={13}/> Edit
                </button>
              </div>
            </div>
            <div className="card prof-settings-card">
              <h3>Privacy</h3>
              <div className="prof-setting-row">
                <div>
                  <div className="prof-setting-label">Public Profile</div>
                  <div className="prof-setting-hint">Others can view your profile</div>
                </div>
                <div className="prof-toggle active"/>
              </div>
              <div className="prof-setting-row">
                <div>
                  <div className="prof-setting-label">Show Balance</div>
                  <div className="prof-setting-hint">Hide your balance from public view</div>
                </div>
                <div className="prof-toggle"/>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className="prof-modal-overlay" onClick={() => setEditOpen(false)}>
          <div className="prof-modal" onClick={e => e.stopPropagation()}>
            <div className="prof-modal-header">
              <h2>Edit Profile</h2>
              <button className="prof-modal-close" onClick={() => setEditOpen(false)}>✕</button>
            </div>
            <div className="prof-modal-body">
              <div className="prof-field">
                <label>Avatar</label>
                <div className="prof-avatar-picker">
                  <div className="prof-avatar-preview" style={{ background: aColor(wallet?.address) }}>
                    {editAvatar || initials(wallet?.address)}
                  </div>
                  <div className="prof-emoji-grid">
                    {AVATAR_EMOJIS.map(em => (
                      <button key={em} className={`prof-emoji-btn ${editAvatar===em?'selected':''}`} onClick={() => setEditAvatar(em)}>{em}</button>
                    ))}
                    {editAvatar && <button className="prof-emoji-btn prof-emoji-clear" onClick={() => setEditAvatar('')}>✕</button>}
                  </div>
                </div>
              </div>
              <div className="prof-field">
                <label>Display Name</label>
                <input className="input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your name" maxLength={40}/>
              </div>
              <div className="prof-field">
                <label>Bio</label>
                <textarea className="input" value={editAbout} onChange={e => setEditAbout(e.target.value)} placeholder="Tell the community about yourself…" rows={3} maxLength={200}/>
                <span className="prof-char-count">{editAbout.length}/200</span>
              </div>
            </div>
            <div className="prof-modal-footer">
              <button className="btn btn-ghost" onClick={() => setEditOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
