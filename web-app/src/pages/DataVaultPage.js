import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  fetchProviders, verifyConnection, uploadFileToVault, uploadJsonToVault,
  listVaultFiles, buildCivitasBackup,
  loadConnections, saveConnection, removeConnection, getCredentials
} from '../services/vaultService';
import './DataVaultPage.css';

const FILE_ICONS = { image: '🖼️', video: '🎥', audio: '🎵', pdf: '📄', zip: '📦', json: '📋', text: '📝', default: '📄' };
function fileIcon(name = '', mime = '') {
  if (mime.startsWith('image')) return FILE_ICONS.image;
  if (mime.startsWith('video')) return FILE_ICONS.video;
  if (mime.startsWith('audio')) return FILE_ICONS.audio;
  if (name.endsWith('.pdf') || mime.includes('pdf')) return FILE_ICONS.pdf;
  if (name.endsWith('.zip') || name.endsWith('.tar') || name.endsWith('.gz')) return FILE_ICONS.zip;
  if (name.endsWith('.json')) return FILE_ICONS.json;
  if (name.endsWith('.txt') || name.endsWith('.md')) return FILE_ICONS.text;
  return FILE_ICONS.default;
}
function fmtSize(b) {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(2)} GB`;
}
function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d), now = new Date();
  const diff = Math.floor((now - dt) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return dt.toLocaleDateString();
}

/* ══════════════════════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════════════════════ */
export default function DataVaultPage() {
  const { wallet, isConnected, connectWallet } = useApp();

  const [providers, setProviders]         = useState([]);
  const [connections, setConnections]     = useState({});   // { [id]: { connected, creds, connectedAt } }
  const [activeTab, setActiveTab]         = useState('vaults');
  const [connectModal, setConnectModal]   = useState(null); // provider object | null
  const [filesBrowse, setFilesBrowse]     = useState([]);   // all files from all vaults
  const [loadingFiles, setLoadingFiles]   = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [syncStatus, setSyncStatus]       = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null); // for file browser filter
  const fileInputRef = useRef(null);

  // ── Load providers and persisted connections on mount ──────────────────────
  useEffect(() => {
    fetchProviders()
      .then(setProviders)
      .catch(() => {
        // If backend is down, show hardcoded minimal list; the backend is the source of truth
        // but we still render the page gracefully
      });
  }, []);

  useEffect(() => {
    if (wallet?.address) {
      setConnections(loadConnections(wallet.address));
    }
  }, [wallet?.address]);

  // ── Refresh file list when tab changes or connections change ───────────────
  useEffect(() => {
    if (activeTab === 'files' && wallet?.address) refreshFiles();
  }, [activeTab, wallet?.address]);

  const refreshFiles = useCallback(async () => {
    if (!wallet?.address) return;
    setLoadingFiles(true);
    const all = [];
    const conns = loadConnections(wallet.address);
    const connected = Object.entries(conns).filter(([, v]) => v.connected);
    await Promise.all(connected.map(async ([pid, { creds }]) => {
      try {
        const files = await listVaultFiles(pid, creds);
        all.push(...files);
      } catch { /* provider unavailable */ }
    }));
    all.sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));
    setFilesBrowse(all);
    setLoadingFiles(false);
  }, [wallet?.address]);

  // ── Connect a provider ─────────────────────────────────────────────────────
  const handleConnectSave = async (provider, creds) => {
    const result = await verifyConnection(provider.id, creds);
    if (!result.ok) throw new Error(result.message || 'Verification failed');
    saveConnection(wallet.address, provider.id, creds);
    const updated = loadConnections(wallet.address);
    setConnections(updated);
    setConnectModal(null);
    return result;
  };

  const handleDisconnect = (pid) => {
    removeConnection(wallet.address, pid);
    setConnections(loadConnections(wallet.address));
    setFilesBrowse(prev => prev.filter(f => f.provider !== pid));
  };

  // ── Upload file ────────────────────────────────────────────────────────────
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const conns = loadConnections(wallet.address);
    const connected = Object.entries(conns).filter(([, v]) => v.connected);
    if (!connected.length) { alert('Connect at least one storage provider first.'); return; }

    for (const file of files) {
      for (const [pid, { creds }] of connected) {
        setUploadProgress({ file: file.name, provider: pid, pct: 0 });
        try {
          await uploadFileToVault(pid, creds, file, (pct) =>
            setUploadProgress({ file: file.name, provider: pid, pct })
          );
        } catch (err) {
          console.error(`Upload to ${pid} failed:`, err.message);
        }
      }
    }
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (activeTab === 'files') await refreshFiles();
  };

  // ── Sync CIVITAS data ──────────────────────────────────────────────────────
  const handleSync = async () => {
    const conns = loadConnections(wallet.address);
    const connected = Object.entries(conns).filter(([, v]) => v.connected);
    if (!connected.length) { setSyncStatus({ type: 'error', msg: 'No vaults connected.' }); return; }

    setSyncStatus({ type: 'loading', msg: 'Building backup…' });
    const backup = buildCivitasBackup(wallet, null, [], []);
    const fname = `civitas-backup-${wallet.address.slice(0,8)}-${Date.now()}.json`;

    const results = [];
    for (const [pid, { creds }] of connected) {
      setSyncStatus({ type: 'loading', msg: `Syncing to ${pid}…` });
      try {
        const r = await uploadJsonToVault(pid, creds, backup, fname);
        results.push({ pid, ok: r.success, cid: r.cid });
      } catch (err) {
        results.push({ pid, ok: false, error: err.message });
      }
    }

    const ok = results.filter(r => r.ok);
    const fail = results.filter(r => !r.ok);
    setSyncStatus({
      type: ok.length > 0 ? 'success' : 'error',
      msg: ok.length
        ? `✅ Synced to ${ok.length} vault${ok.length > 1 ? 's' : ''}. ${fail.length ? `${fail.length} failed.` : ''}`
        : `❌ All syncs failed.`,
      cids: ok.map(r => ({ pid: r.pid, cid: r.cid }))
    });
    setTimeout(() => setSyncStatus(null), 6000);
  };

  // ─── Not connected ────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="vault-page">
        <div className="vault-connect-wall">
          <div className="wall-icon">🗄️</div>
          <h2>Data Vault</h2>
          <p>Connect your wallet to link decentralized storage providers and keep your data free from any centralized server.</p>
          <button className="btn-primary" onClick={connectWallet}>Connect Wallet</button>
        </div>
      </div>
    );
  }

  const connectedCount = Object.values(connections).filter(c => c.connected).length;

  return (
    <div className="vault-page">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="vault-header">
        <div className="vault-title-group">
          <h1>🗄️ Data Vault</h1>
          <p>Your data, your providers — no central server ever holds your files</p>
        </div>
        <div className="vault-header-actions">
          {connectedCount > 0 && (
            <div className="connected-pill">{connectedCount} vault{connectedCount !== 1 ? 's' : ''} connected</div>
          )}
          <button className="btn-sync" onClick={handleSync} disabled={connectedCount === 0}>
            🔄 Sync CIVITAS Data
          </button>
          <button className="btn-upload" onClick={() => fileInputRef.current?.click()} disabled={connectedCount === 0}>
            ⬆️ Upload File
          </button>
          <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileSelect} />
        </div>
      </div>

      {/* Sync status bar */}
      {syncStatus && (
        <div className={`sync-bar ${syncStatus.type}`}>
          {syncStatus.type === 'loading' && <span className="spin">⏳</span>}
          {syncStatus.msg}
          {syncStatus.cids?.map(({ pid, cid }) => (
            <span key={pid} className="sync-cid">{pid}: {cid?.slice(0, 20)}…</span>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {uploadProgress && (
        <div className="upload-progress-bar">
          <span>Uploading <strong>{uploadProgress.file}</strong> → {uploadProgress.provider}…</span>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${uploadProgress.pct}%` }} />
          </div>
          <span>{uploadProgress.pct}%</span>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="vault-tabs">
        {['vaults', 'files'].map(t => (
          <button key={t} className={`vtab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'vaults' && `🔌 Storage Providers`}
            {t === 'files'  && `📁 My Files`}
          </button>
        ))}
      </div>

      {/* ══ VAULTS TAB ══════════════════════════════════════════════════════ */}
      {activeTab === 'vaults' && (
        <div className="vaults-tab">
          {/* Decentralization info banner */}
          <div className="info-banner">
            <div className="info-icon">🔒</div>
            <div>
              <strong>Your credentials never leave your browser.</strong>
              <span> API keys are stored only in your device's localStorage and sent directly to each provider. CIVITAS never stores them on any server.</span>
            </div>
          </div>

          <div className="providers-grid">
            {(providers.length ? providers : FALLBACK_PROVIDERS).map(p => {
              const conn = connections[p.id];
              const isConn = conn?.connected;
              return (
                <ProviderCard
                  key={p.id}
                  provider={p}
                  isConnected={isConn}
                  connectedAt={conn?.connectedAt}
                  onConnect={() => setConnectModal(p)}
                  onDisconnect={() => handleDisconnect(p.id)}
                  onViewFiles={() => { setSelectedProvider(p.id); setActiveTab('files'); }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ══ FILES TAB ═══════════════════════════════════════════════════════ */}
      {activeTab === 'files' && (
        <div className="files-tab">
          <div className="files-toolbar">
            <div className="filter-pills">
              <button
                className={`pill ${!selectedProvider ? 'active' : ''}`}
                onClick={() => { setSelectedProvider(null); refreshFiles(); }}
              >All Vaults</button>
              {Object.entries(connections).filter(([,v]) => v.connected).map(([pid]) => (
                <button
                  key={pid}
                  className={`pill ${selectedProvider === pid ? 'active' : ''}`}
                  onClick={() => setSelectedProvider(pid)}
                >
                  {pid}
                </button>
              ))}
            </div>
            <button className="btn-refresh" onClick={refreshFiles}>↻ Refresh</button>
          </div>

          {connectedCount === 0 ? (
            <div className="empty-state">
              <div className="ei">🔌</div>
              <p>Connect a storage provider to see your files here.</p>
              <button className="btn-primary" onClick={() => setActiveTab('vaults')}>Connect a Provider</button>
            </div>
          ) : loadingFiles ? (
            <div className="file-skeletons">
              {[...Array(5)].map((_, i) => <div key={i} className="file-skeleton" />)}
            </div>
          ) : filesBrowse.filter(f => !selectedProvider || f.provider === selectedProvider).length === 0 ? (
            <div className="empty-state">
              <div className="ei">📭</div>
              <p>No files found. Upload a file to get started.</p>
            </div>
          ) : (
            <div className="file-list">
              {filesBrowse
                .filter(f => !selectedProvider || f.provider === selectedProvider)
                .map((f, i) => (
                  <FileRow key={`${f.provider}-${f.id}-${i}`} file={f} />
                ))}
            </div>
          )}
        </div>
      )}

      {/* ══ Connect Modal ═══════════════════════════════════════════════════ */}
      {connectModal && (
        <ConnectModal
          provider={connectModal}
          onClose={() => setConnectModal(null)}
          onSave={handleConnectSave}
        />
      )}
    </div>
  );
}

/* ── Provider Card ─────────────────────────────────────────────────── */
function ProviderCard({ provider: p, isConnected, connectedAt, onConnect, onDisconnect, onViewFiles }) {
  return (
    <div className={`provider-card ${isConnected ? 'connected' : ''}`}>
      <div className="pc-header">
        <div className="pc-icon">{p.icon}</div>
        <div className="pc-title-area">
          <h3>{p.name}</h3>
          <span className="pc-tech">{p.tech}</span>
        </div>
        {isConnected && <span className="pc-badge">✓ Connected</span>}
      </div>
      <p className="pc-tagline">{p.tagline}</p>
      <p className="pc-desc">{p.description}</p>
      <div className="pc-footer">
        <span className="pc-free">🎁 {p.freeTier}</span>
        <a href={p.website} target="_blank" rel="noopener noreferrer" className="pc-link">
          {p.website.replace('https://', '')} ↗
        </a>
      </div>
      <div className="pc-actions">
        {isConnected ? (
          <>
            <button className="btn-sm btn-view" onClick={onViewFiles}>📁 View Files</button>
            <button className="btn-sm btn-danger" onClick={() => { if (window.confirm(`Disconnect ${p.name}?`)) onDisconnect(); }}>Disconnect</button>
          </>
        ) : (
          <button className="btn-sm btn-connect" onClick={onConnect}>🔌 Connect</button>
        )}
      </div>
      {isConnected && connectedAt && (
        <div className="pc-connected-since">Connected {fmtDate(connectedAt)}</div>
      )}
    </div>
  );
}

/* ── Connect Modal ─────────────────────────────────────────────────── */
function ConnectModal({ provider: p, onClose, onSave }) {
  const [creds, setCreds]     = useState(() => Object.fromEntries((p.credentialFields || []).map(f => [f.key, ''])));
  const [status, setStatus]   = useState(null);
  const [testing, setTesting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTesting(true);
    setStatus({ type: 'loading', msg: 'Verifying credentials…' });
    try {
      await onSave(p, creds);
      setStatus({ type: 'success', msg: '✅ Connected successfully!' });
    } catch (err) {
      setStatus({ type: 'error', msg: `❌ ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="vault-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-header">
          <span className="modal-icon">{p.icon}</span>
          <div>
            <h2>Connect {p.name}</h2>
            <p className="modal-sub">Enter your {p.name} API credentials. These never leave your device.</p>
          </div>
        </div>

        <div className="modal-tip">
          💡 Get your credentials at <a href={p.website} target="_blank" rel="noopener noreferrer">{p.website}</a>
        </div>

        <form className="creds-form" onSubmit={handleSubmit}>
          {(p.credentialFields || []).map(field => (
            <div className="creds-group" key={field.key}>
              <label>{field.label}</label>
              <input
                required
                type={field.type}
                placeholder={field.placeholder}
                value={creds[field.key] || ''}
                onChange={e => setCreds(prev => ({ ...prev, [field.key]: e.target.value }))}
                autoComplete="off"
              />
            </div>
          ))}
          {status && (
            <div className={`creds-status ${status.type}`}>{status.msg}</div>
          )}
          <div className="modal-actions">
            <button type="submit" disabled={testing} className="btn-primary">
              {testing ? '⏳ Connecting…' : '🔌 Connect'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>

        <div className="modal-privacy">
          <strong>🔒 Privacy note:</strong> Your credentials are stored only in your browser's
          localStorage and never transmitted to any CIVITAS server. They are sent directly to
          {p.name}'s API when you upload or browse files.
        </div>
      </div>
    </div>
  );
}

/* ── File Row ──────────────────────────────────────────────────────── */
function FileRow({ file: f }) {
  const PROVIDER_COLORS = { pinata: '#e8476a', web3storage: '#1a56e8', lighthouse: '#f59e0b', arweave: '#15b576', filebase: '#6366f1', storj: '#1652f0' };
  const color = PROVIDER_COLORS[f.provider] || '#64748b';
  return (
    <div className="file-row">
      <span className="file-row-icon">{fileIcon(f.name)}</span>
      <div className="file-row-info">
        <span className="file-row-name">{f.name || f.cid?.slice(0, 20) + '…'}</span>
        {f.cid && <span className="file-row-cid">CID: {f.cid.slice(0, 32)}…</span>}
      </div>
      <span className="file-row-size">{fmtSize(f.size)}</span>
      <span className="file-row-date">{fmtDate(f.uploadedAt)}</span>
      <span className="provider-tag" style={{ background: color + '22', color }}>
        {f.provider}
      </span>
      {f.url && (
        <a href={f.url} target="_blank" rel="noopener noreferrer" className="file-row-open" title="Open file">↗</a>
      )}
    </div>
  );
}

/* ── Fallback providers (if backend is down) ──────────────────────── */
const FALLBACK_PROVIDERS = [
  { id: 'pinata',      icon: '📌', name: 'Pinata',           tech: 'IPFS',               tagline: 'IPFS pinning — 1 GB free',              description: 'The most popular IPFS pinning service.',              website: 'https://pinata.cloud',        freeTier: '1 GB',    credentialFields: [{ key: 'apiKey', label: 'API Key', type: 'text', placeholder: 'Pinata API key' }, { key: 'apiSecret', label: 'API Secret', type: 'password', placeholder: 'Pinata API secret' }] },
  { id: 'web3storage', icon: '🌐', name: 'Web3.Storage',     tech: 'IPFS + Filecoin',    tagline: 'IPFS + Filecoin — 5 GB free',           description: 'Stores files on IPFS, pinned to Filecoin.',           website: 'https://web3.storage',        freeTier: '5 GB',    credentialFields: [{ key: 'token', label: 'API Token', type: 'password', placeholder: 'Web3.Storage token' }] },
  { id: 'lighthouse',  icon: '🔦', name: 'Lighthouse',       tech: 'Filecoin + IPFS',    tagline: 'Filecoin perpetual storage',            description: 'Permanent Filecoin storage deals.',                   website: 'https://lighthouse.storage',  freeTier: '100 MB',  credentialFields: [{ key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Lighthouse API key' }] },
  { id: 'arweave',     icon: '♾️', name: 'Arweave / AR.IO',  tech: 'Arweave',            tagline: 'Permanent storage — pay once, forever', description: 'One-time fee stores data permanently on Arweave.',    website: 'https://ar.io',               freeTier: 'Up to 100 KB free', credentialFields: [{ key: 'apiUrl', label: 'Bundlr URL', type: 'text', placeholder: 'https://node2.bundlr.network' }, { key: 'walletKey', label: 'Arweave Wallet JWK', type: 'password', placeholder: 'Paste JWK JSON' }] },
  { id: 'filebase',    icon: '🗂️', name: 'Filebase',         tech: 'IPFS / Sia',         tagline: 'S3-compatible — IPFS & Sia backed',     description: 'S3-compatible API backed by IPFS and Sia.',          website: 'https://filebase.com',        freeTier: '5 GB',    credentialFields: [{ key: 'accessKey', label: 'Access Key', type: 'text', placeholder: 'Filebase access key' }, { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'Filebase secret key' }, { key: 'bucket', label: 'Bucket', type: 'text', placeholder: 'my-bucket' }] },
  { id: 'storj',       icon: '🛰️', name: 'Storj',            tech: 'Storj DCS',          tagline: 'S3-compatible — 150 GB free',           description: 'Files split, encrypted, and distributed globally.',  website: 'https://storj.io',            freeTier: '150 GB',  credentialFields: [{ key: 'accessKey', label: 'Access Key', type: 'text', placeholder: 'Storj access key' }, { key: 'secretKey', label: 'Secret Key', type: 'password', placeholder: 'Storj secret key' }, { key: 'bucket', label: 'Bucket', type: 'text', placeholder: 'my-bucket' }, { key: 'endpoint', label: 'Endpoint', type: 'text', placeholder: 'https://gateway.storjshare.io' }] },
];
