import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import './AppStorePage.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const CATEGORIES = ['All', 'Messaging', 'Finance', 'Governance', 'Storage', 'Identity', 'Social', 'Infrastructure', 'Tools', 'AI'];
const SORT_OPTIONS = [
  { value: 'default',  label: '⭐ Recommended' },
  { value: 'rating',   label: '🏆 Top Rated' },
  { value: 'installs', label: '🔥 Most Installed' },
  { value: 'newest',   label: '🆕 Newest' }
];
const PLATFORM_ICONS = { web: '🌐', pwa: '📲', android: '🤖', ios: '🍎', desktop: '🖥️', linux: '🐧', macos: '🍎', windows: '🪟' };

export default function AppStorePage() {
  const { wallet, isConnected } = useApp();

  const [activeTab, setActiveTab]           = useState('browse');
  const [apps, setApps]                     = useState([]);
  const [featured, setFeatured]             = useState([]);
  const [categories, setCategories]         = useState({});
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery]       = useState('');
  const [sort, setSort]                     = useState('default');
  const [loading, setLoading]               = useState(false);
  const [selectedApp, setSelectedApp]       = useState(null);
  const [installedIds, setInstalledIds]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('civitas_installed_apps') || '[]'); }
    catch { return []; }
  });
  const [submitForm, setSubmitForm]         = useState({
    name: '', tagline: '', description: '', icon: '📦',
    category: 'Tools', version: '1.0.0', website: '', downloadUrl: '',
    ipfsCid: '', license: 'MIT', tags: '', platforms: ['web']
  });
  const [submitStatus, setSubmitStatus]     = useState(null);
  const [ratingInput, setRatingInput]       = useState({ rating: 5, comment: '' });
  const [ratingStatus, setRatingStatus]     = useState(null);

  // ── Fetch apps ──────────────────────────────────────────────────────────────
  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, limit: 50 });
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`${API}/api/appstore/apps?${params}`);
      const data = await res.json();
      setApps(data.apps || []);
    } catch (err) {
      console.error('Failed to fetch apps:', err);
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, sort]);

  const fetchFeatured = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/appstore/apps/featured`);
      const data = await res.json();
      setFeatured(data.apps || []);
    } catch {}
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/appstore/categories`);
      const data = await res.json();
      setCategories(data.counts || {});
    } catch {}
  }, []);

  useEffect(() => {
    fetchFeatured();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'browse' || activeTab === 'search') fetchApps();
  }, [activeTab, fetchApps]);

  // ── Debounced search ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const t = setTimeout(fetchApps, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Install ─────────────────────────────────────────────────────────────────
  const handleInstall = async (app, e) => {
    e.stopPropagation();
    try {
      await fetch(`${API}/api/appstore/apps/${app.id}/install`, { method: 'POST' });
    } catch {}

    if (app.isInternal) {
      // Navigate within CIVITAS
      window.location.hash = app.downloadUrl;
    } else {
      window.open(app.downloadUrl || app.website, '_blank', 'noopener');
    }

    const next = [...new Set([...installedIds, app.id])];
    setInstalledIds(next);
    localStorage.setItem('civitas_installed_apps', JSON.stringify(next));

    // Refresh install count in local state
    setApps(prev => prev.map(a => a.id === app.id ? { ...a, installs: a.installs + 1 } : a));
    if (selectedApp?.id === app.id) setSelectedApp(prev => ({ ...prev, installs: prev.installs + 1 }));
  };

  // ── Rate app ────────────────────────────────────────────────────────────────
  const handleRate = async (appId) => {
    if (!isConnected) { setRatingStatus('Connect your wallet to rate apps.'); return; }
    try {
      const res = await fetch(`${API}/api/appstore/apps/${appId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ratingInput, reviewerAddress: wallet?.address })
      });
      const data = await res.json();
      if (data.success) {
        setRatingStatus('✅ Rating submitted!');
        setSelectedApp(prev => ({ ...prev, rating: data.rating, ratingCount: data.ratingCount, reviews: data.reviews || prev.reviews }));
      } else {
        setRatingStatus('❌ ' + (data.error || 'Failed'));
      }
    } catch {
      setRatingStatus('❌ Network error');
    }
    setTimeout(() => setRatingStatus(null), 3000);
  };

  // ── Submit new app ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected) { setSubmitStatus('Connect your wallet first.'); return; }
    setSubmitStatus('Submitting…');
    try {
      const payload = {
        ...submitForm,
        tags: submitForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        developerAddress: wallet.address,
        developer: wallet.address.substring(0, 10) + '…'
      };
      const res = await fetch(`${API}/api/appstore/apps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSubmitStatus('✅ App submitted! It will appear in the store after review.');
        setApps(prev => [data.app, ...prev]);
        setSubmitForm({ name: '', tagline: '', description: '', icon: '📦', category: 'Tools', version: '1.0.0', website: '', downloadUrl: '', ipfsCid: '', license: 'MIT', tags: '', platforms: ['web'] });
      } else {
        setSubmitStatus('❌ ' + (data.error || 'Submission failed'));
      }
    } catch {
      setSubmitStatus('❌ Network error');
    }
  };

  const togglePlatform = (p) => {
    setSubmitForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...prev.platforms, p]
    }));
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderStars = (rating, interactive = false, onSelect = null) => {
    return (
      <span className="stars">
        {[1, 2, 3, 4, 5].map(n => (
          <span
            key={n}
            className={`star ${n <= Math.round(rating) ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
            onClick={() => interactive && onSelect && onSelect(n)}
          >★</span>
        ))}
      </span>
    );
  };

  const renderPlatforms = (platforms) => (
    <span className="platform-icons">
      {(platforms || []).map(p => (
        <span key={p} className="platform-badge" title={p}>{PLATFORM_ICONS[p] || '📦'}</span>
      ))}
    </span>
  );

  const AppCard = ({ app, onClick }) => (
    <div className="app-card" onClick={() => onClick(app)}>
      <div className="app-card-header">
        <div className="app-icon">{app.icon}</div>
        {app.verified && <span className="verified-badge" title="Verified">✓</span>}
        {app.featured && <span className="featured-badge">Featured</span>}
      </div>
      <div className="app-card-body">
        <h3 className="app-name">{app.name}</h3>
        <p className="app-tagline">{app.tagline}</p>
        <div className="app-meta">
          <span className="app-category">{app.category}</span>
          {renderPlatforms(app.platforms)}
        </div>
        <div className="app-stats">
          {renderStars(app.rating)}
          <span className="rating-text">{app.rating > 0 ? app.rating.toFixed(1) : 'New'}</span>
          <span className="install-count">{app.installs.toLocaleString()} installs</span>
        </div>
      </div>
      <button
        className={`install-btn ${installedIds.includes(app.id) ? 'installed' : ''}`}
        onClick={(e) => handleInstall(app, e)}
      >
        {installedIds.includes(app.id) ? '✓ Open' : app.isInternal ? 'Open' : '↓ Install'}
      </button>
    </div>
  );

  const FeaturedBanner = ({ app }) => (
    <div className="featured-banner" onClick={() => { setSelectedApp(app); }}>
      <div className="featured-icon">{app.icon}</div>
      <div className="featured-info">
        <div className="featured-tag">⭐ Featured</div>
        <h2>{app.name}</h2>
        <p>{app.tagline}</p>
        <div className="featured-meta">
          <span>{app.category}</span>
          <span>•</span>
          {renderStars(app.rating)}
          <span>{app.rating.toFixed(1)}</span>
        </div>
      </div>
      <button
        className={`install-btn featured-install ${installedIds.includes(app.id) ? 'installed' : ''}`}
        onClick={(e) => handleInstall(app, e)}
      >
        {installedIds.includes(app.id) ? '✓ Open' : app.isInternal ? 'Open' : '↓ Install'}
      </button>
    </div>
  );

  const AppModal = ({ app, onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="app-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <div className="modal-icon">{app.icon}</div>
          <div className="modal-title-area">
            <h2>{app.name} {app.verified && <span className="verified-badge">✓ Verified</span>}</h2>
            <p className="modal-tagline">{app.tagline}</p>
            <div className="modal-meta">
              <span className="app-category">{app.category}</span>
              <span>v{app.version}</span>
              <span>•</span>
              <span>{app.license}</span>
              {renderPlatforms(app.platforms)}
            </div>
          </div>
        </div>

        <div className="modal-stats-row">
          <div className="stat-box">
            <span className="stat-val">{app.installs.toLocaleString()}</span>
            <span className="stat-lbl">Installs</span>
          </div>
          <div className="stat-box">
            <span className="stat-val">{app.rating > 0 ? app.rating.toFixed(1) : '—'}</span>
            <span className="stat-lbl">Rating</span>
          </div>
          <div className="stat-box">
            <span className="stat-val">{app.ratingCount}</span>
            <span className="stat-lbl">Reviews</span>
          </div>
          <div className="stat-box">
            <span className="stat-val">{app.developer?.substring(0, 10)}{app.developer?.length > 10 ? '…' : ''}</span>
            <span className="stat-lbl">Developer</span>
          </div>
        </div>

        <div className="modal-description">
          <h3>About</h3>
          <p>{app.description}</p>
        </div>

        {app.tags?.length > 0 && (
          <div className="modal-tags">
            {app.tags.map(t => <span key={t} className="tag">#{t}</span>)}
          </div>
        )}

        {app.ipfsCid && (
          <div className="modal-ipfs">
            <span className="ipfs-label">📦 IPFS CID:</span>
            <code>{app.ipfsCid}</code>
          </div>
        )}

        <div className="modal-actions">
          <button className={`install-btn large ${installedIds.includes(app.id) ? 'installed' : ''}`}
            onClick={(e) => handleInstall(app, e)}>
            {installedIds.includes(app.id) ? '✓ Open App' : app.isInternal ? '🚀 Open App' : '↓ Install / Download'}
          </button>
          {app.website && (
            <a href={app.website} target="_blank" rel="noopener noreferrer" className="website-link">
              🌐 Visit Website
            </a>
          )}
        </div>

        {/* Rate this app */}
        <div className="rate-section">
          <h3>Rate this App</h3>
          {isConnected ? (
            <div className="rate-form">
              <div className="rate-stars">
                {renderStars(ratingInput.rating, true, (n) => setRatingInput(p => ({ ...p, rating: n })))}
                <span>{ratingInput.rating}/5</span>
              </div>
              <textarea
                className="rate-comment"
                placeholder="Leave a comment (optional)…"
                value={ratingInput.comment}
                onChange={e => setRatingInput(p => ({ ...p, comment: e.target.value }))}
                rows={2}
              />
              <button className="submit-rating-btn" onClick={() => handleRate(app.id)}>
                Submit Rating
              </button>
              {ratingStatus && <p className="status-msg">{ratingStatus}</p>}
            </div>
          ) : (
            <p className="connect-hint">Connect your wallet to rate apps.</p>
          )}
        </div>

        {/* Reviews */}
        {app.reviews?.length > 0 && (
          <div className="reviews-section">
            <h3>Reviews ({app.reviews.length})</h3>
            {app.reviews.slice(0, 5).map((r, i) => (
              <div key={i} className="review-item">
                <div className="review-header">
                  {renderStars(r.rating)}
                  <span className="review-addr">{r.reviewer.substring(0, 10)}…</span>
                </div>
                {r.comment && <p className="review-comment">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── My Installed Apps ───────────────────────────────────────────────────────
  const installedApps = apps.filter(a => installedIds.includes(a.id));

  return (
    <div className="appstore-page">
      {/* Page Header */}
      <div className="appstore-header">
        <div className="appstore-title">
          <h1>📱 CIVITAS App Store</h1>
          <p>Discover and download decentralized apps for every device</p>
        </div>
        <div className="appstore-search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search dApps…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setActiveTab('browse'); }}
          />
          {searchQuery && <button className="clear-search" onClick={() => setSearchQuery('')}>✕</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="appstore-tabs">
        {['browse', 'installed', 'submit'].map(tab => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'browse'    && '🏪 Browse'}
            {tab === 'installed' && `📲 My Apps ${installedIds.length > 0 ? `(${installedIds.length})` : ''}`}
            {tab === 'submit'    && '➕ Submit App'}
          </button>
        ))}
      </div>

      {/* ── BROWSE TAB ── */}
      {activeTab === 'browse' && (
        <div className="browse-layout">
          {/* Sidebar */}
          <aside className="category-sidebar">
            <h3>Categories</h3>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`cat-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => { setSelectedCategory(cat); fetchApps(); }}
              >
                {cat}
                {cat !== 'All' && categories[cat] !== undefined && (
                  <span className="cat-count">{categories[cat]}</span>
                )}
              </button>
            ))}

            <h3 className="sidebar-section">Sort</h3>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                className={`cat-btn ${sort === opt.value ? 'active' : ''}`}
                onClick={() => { setSort(opt.value); fetchApps(); }}
              >
                {opt.label}
              </button>
            ))}
          </aside>

          {/* Main area */}
          <div className="browse-main">
            {/* Featured carousel — shown when no search/category filter */}
            {!searchQuery && selectedCategory === 'All' && featured.length > 0 && (
              <section className="featured-section">
                <h2>⭐ Featured</h2>
                <div className="featured-scroll">
                  {featured.map(app => <FeaturedBanner key={app.id} app={app} />)}
                </div>
              </section>
            )}

            {/* App grid */}
            <section className="apps-section">
              <div className="apps-section-header">
                <h2>
                  {searchQuery ? `Results for "${searchQuery}"` : selectedCategory === 'All' ? 'All Apps' : selectedCategory}
                </h2>
                <span className="app-count">{apps.length} apps</span>
              </div>

              {loading ? (
                <div className="loading-grid">
                  {[...Array(6)].map((_, i) => <div key={i} className="skeleton-card" />)}
                </div>
              ) : apps.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <p>No apps found. Try a different search or category.</p>
                </div>
              ) : (
                <div className="apps-grid">
                  {apps.map(app => (
                    <AppCard key={app.id} app={app} onClick={setSelectedApp} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* ── MY APPS TAB ── */}
      {activeTab === 'installed' && (
        <div className="installed-page">
          <h2>📲 My Installed Apps</h2>
          {installedIds.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>You haven't installed any apps yet. Browse the store to get started.</p>
              <button className="tab-btn active" onClick={() => setActiveTab('browse')}>Browse Apps</button>
            </div>
          ) : (
            <div className="apps-grid">
              {apps.filter(a => installedIds.includes(a.id)).map(app => (
                <AppCard key={app.id} app={app} onClick={setSelectedApp} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SUBMIT TAB ── */}
      {activeTab === 'submit' && (
        <div className="submit-page">
          <div className="submit-card">
            <h2>➕ Submit Your dApp</h2>
            <p className="submit-intro">
              List your decentralized application on the CIVITAS App Store. Your app's bundle can be hosted on IPFS
              — paste the CID below or provide a download URL. Submissions are community-reviewed.
            </p>

            {!isConnected && (
              <div className="connect-warning">⚠️ Connect your wallet to submit an app.</div>
            )}

            <form className="submit-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>App Name *</label>
                  <input required value={submitForm.name} onChange={e => setSubmitForm(p => ({ ...p, name: e.target.value }))} placeholder="My dApp" />
                </div>
                <div className="form-group icon-group">
                  <label>Icon (emoji)</label>
                  <input value={submitForm.icon} onChange={e => setSubmitForm(p => ({ ...p, icon: e.target.value }))} placeholder="📦" maxLength={4} />
                  <span className="icon-preview">{submitForm.icon}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Tagline</label>
                <input value={submitForm.tagline} onChange={e => setSubmitForm(p => ({ ...p, tagline: e.target.value }))} placeholder="One-line description" />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea required rows={4} value={submitForm.description} onChange={e => setSubmitForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe your app…" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select value={submitForm.category} onChange={e => setSubmitForm(p => ({ ...p, category: e.target.value }))}>
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Version</label>
                  <input value={submitForm.version} onChange={e => setSubmitForm(p => ({ ...p, version: e.target.value }))} placeholder="1.0.0" />
                </div>
                <div className="form-group">
                  <label>License</label>
                  <select value={submitForm.license} onChange={e => setSubmitForm(p => ({ ...p, license: e.target.value }))}>
                    {['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Proprietary'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Website</label>
                  <input type="url" value={submitForm.website} onChange={e => setSubmitForm(p => ({ ...p, website: e.target.value }))} placeholder="https://myapp.xyz" />
                </div>
                <div className="form-group">
                  <label>Download URL</label>
                  <input value={submitForm.downloadUrl} onChange={e => setSubmitForm(p => ({ ...p, downloadUrl: e.target.value }))} placeholder="https://myapp.xyz/download" />
                </div>
              </div>

              <div className="form-group">
                <label>IPFS CID (optional — if app bundle is on IPFS)</label>
                <input value={submitForm.ipfsCid} onChange={e => setSubmitForm(p => ({ ...p, ipfsCid: e.target.value }))} placeholder="Qm…" />
              </div>

              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input value={submitForm.tags} onChange={e => setSubmitForm(p => ({ ...p, tags: e.target.value }))} placeholder="defi, wallet, privacy" />
              </div>

              <div className="form-group">
                <label>Platforms</label>
                <div className="platform-checkboxes">
                  {Object.keys(PLATFORM_ICONS).map(p => (
                    <label key={p} className="platform-check">
                      <input type="checkbox" checked={submitForm.platforms.includes(p)} onChange={() => togglePlatform(p)} />
                      {PLATFORM_ICONS[p]} {p}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={!isConnected}>
                🚀 Submit App
              </button>
              {submitStatus && <p className={`status-msg ${submitStatus.startsWith('✅') ? 'success' : ''}`}>{submitStatus}</p>}
            </form>
          </div>
        </div>
      )}

      {/* App Detail Modal */}
      {selectedApp && <AppModal app={selectedApp} onClose={() => setSelectedApp(null)} />}
    </div>
  );
}
