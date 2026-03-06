import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getReputationHistory, getGlobalStats, graphHealthCheck } from '../services/graphService';
import { registerRecoveryAccount, initiateRecovery, approveRecovery, executeRecovery, getRecoveryStatus, getAccountConfig } from '../services/contractService';
import './IdentityPage.css';

export default function IdentityPage() {
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryTab, setRecoveryTab]             = useState('register');
  const [recGuardians, setRecGuardians]           = useState('');
  const [recThreshold, setRecThreshold]           = useState(2);
  const [recTargetAcct, setRecTargetAcct]         = useState('');
  const [recNewOwner, setRecNewOwner]             = useState('');
  const [recoveryStatus, setRecoveryStatus]       = useState(null);
  const [accountConfig, setAccountConfig]         = useState(null);
  const [recLoading, setRecLoading]               = useState(false);
  const [recMsg, setRecMsg]                       = useState({ error: '', success: '' });

  const [newDID, setNewDID] = useState('');
  const [credentials, setCredentials] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [reputationDetails, setReputationDetails] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [reputationHistory, setReputationHistory] = useState([]);
  const [showRepHistory, setShowRepHistory] = useState(false);
  const [chainStatus, setChainStatus] = useState(null);  // { connected, blockNumber } | null
  const [graphStatus, setGraphStatus]  = useState(null);  // { available, syncedBlock } | null
  const [reputationSource, setReputationSource] = useState('cache'); // 'blockchain' | 'cache'
  
  const { 
    wallet, 
    DID, 
    reputation, 
    isConnected, 
    isLoading, 
    connectWallet, 
    createDID,
    loadIdentity,
    getCredentials,
    getActivityLog
  } = useApp();

  // Load credentials + on-chain data when wallet connects
  useEffect(() => {
    if (isConnected && wallet?.address) {
      loadCredentialsData();
      loadIdentityData();
      checkChainStatus();
    }
  }, [isConnected, wallet?.address]);

  const checkChainStatus = async () => {
    try {
      const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API}/api/identity/chain-health`);
      const data = await res.json();
      setChainStatus(data);
    } catch { setChainStatus({ connected: false }); }
    // Also check The Graph
    const gStatus = await graphHealthCheck();
    setGraphStatus(gStatus);
  };

  const loadCredentialsData = async () => {
    setLoadingCredentials(true);
    try {
      const creds = await getCredentials();
      setCredentials(creds);
    } catch (error) {
      console.error('Failed to load credentials:', error);
      setCredentials([]);
    } finally {
      setLoadingCredentials(false);
    }
  };

  const loadIdentityData = async () => {
    try {
      const identity = await loadIdentity(wallet.address);
      if (identity) {
        setReputationDetails(identity.reputation);
        if (identity.reputation?.onChain) setReputationSource('blockchain');
      }
    } catch (error) {
      console.error('Failed to load identity:', error);
    }
  };

  const loadRepHistory = async () => {
    if (!DID) return;
    try {
      // derive bytes32 hash of DID string — matches what the contract uses
      const { ethers } = await import('ethers');
      const hash = ethers.keccak256(ethers.toUtf8Bytes(DID));
      const hist = await getReputationHistory(hash);
      setReputationHistory(hist);
    } catch { setReputationHistory([]); }
  };

  const loadActivitiesData = async () => {
    setLoadingActivities(true);
    try {
      const acts = await getActivityLog(20);
      setActivities(acts);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleViewHistory = async () => {
    setShowActivityModal(true);
    if (activities.length === 0) {
      await loadActivitiesData();
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type) => {
    const icons = {
      did_created: '🆔',
      did_updated: '✏️',
      credential_issued: '📜',
      credential_verified: '✅',
      credential_shared: '🔗',
      credential_revoked: '❌',
      reputation_changed: '⭐',
      guardian_added: '🛡️',
      guardian_removed: '🚫',
      guardian_activated: '✅',
      recovery_initiated: '🔄',
      recovery_completed: '✔️',
      zkproof_created: '🔐',
      zkproof_verified: '✓',
      privacy_updated: '🔒',
      key_rotated: '🔑',
      verification_completed: '✅'
    };
    return icons[type] || '📋';
  };

  const handleRegisterRecovery = async () => {
    setRecLoading(true); setRecMsg({ error: '', success: '' });
    try {
      const guardians = recGuardians.split('\n').map(s => s.trim()).filter(Boolean);
      if (guardians.length < 1) throw new Error('Enter at least one guardian address');
      await registerRecoveryAccount(guardians, recThreshold);
      setRecMsg({ error: '', success: `✅ Recovery account registered with ${guardians.length} guardians, threshold ${recThreshold}` });
    } catch (e) { setRecMsg({ error: e.reason || e.message, success: '' }); }
    finally { setRecLoading(false); }
  };

  const handleInitiateRecovery = async () => {
    setRecLoading(true); setRecMsg({ error: '', success: '' });
    try {
      await initiateRecovery(recTargetAcct, recNewOwner);
      setRecMsg({ error: '', success: '✅ Recovery initiated. Guardians must now approve.' });
    } catch (e) { setRecMsg({ error: e.reason || e.message, success: '' }); }
    finally { setRecLoading(false); }
  };

  const handleApproveRecovery = async () => {
    setRecLoading(true); setRecMsg({ error: '', success: '' });
    try {
      await approveRecovery(recTargetAcct);
      setRecMsg({ error: '', success: '✅ Recovery approved.' });
    } catch (e) { setRecMsg({ error: e.reason || e.message, success: '' }); }
    finally { setRecLoading(false); }
  };

  const handleExecuteRecovery = async () => {
    setRecLoading(true); setRecMsg({ error: '', success: '' });
    try {
      await executeRecovery(recTargetAcct);
      setRecMsg({ error: '', success: '✅ Recovery executed — new owner set.' });
    } catch (e) { setRecMsg({ error: e.reason || e.message, success: '' }); }
    finally { setRecLoading(false); }
  };

  const loadRecoveryStatus = async () => {
    if (!recTargetAcct) return;
    setRecLoading(true);
    try {
      const [status, config] = await Promise.all([
        getRecoveryStatus(recTargetAcct),
        getAccountConfig(recTargetAcct),
      ]);
      setRecoveryStatus(status);
      setAccountConfig(config);
    } catch (e) { setRecMsg({ error: e.message, success: '' }); }
    finally { setRecLoading(false); }
  };

  const handleCreateDID = async () => {
    if (!newDID) {
      alert('Please enter a DID name');
      return;
    }
    
    try {
      await createDID(newDID);
      alert('DID created successfully!');
      setNewDID('');
    } catch (error) {
      alert('DID creation failed: ' + error.message);
    }
  };

  const handleCopyDID = () => {
    if (DID) {
      navigator.clipboard.writeText(DID);
      alert('DID copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="identity-page">
        <div className="identity-container">
          <div className="not-connected">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="identity-page">
        <div className="identity-container">
          <div className="not-connected">
            <h2>Wallet Not Connected</h2>
            <p>Please connect your wallet to manage your identity.</p>
            <button className="btn btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="identity-page">
      <div className="identity-container">
        {/* Header */}
        <div className="identity-header">
          <h1>Self-Sovereign Identity</h1>
          <p className="subtitle">Your identity, your control</p>
        </div>

        {/* DID Card */}
        <div className="did-card">
          <h3>Your Decentralized Identifier (DID)</h3>
          {DID ? (
            <>
              <div className="did-display">
                <code>{DID}</code>
                <button className="copy-btn" onClick={handleCopyDID}>📋 Copy</button>
              </div>
              <p className="did-description">
                Your DID is a globally unique identifier that you fully control. It's stored on the blockchain and can be verified by anyone.
              </p>
            </>
          ) : (
            <div className="did-create">
              <p className="did-description">You don't have a DID yet. Create one to start building your identity.</p>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Enter DID name (e.g., john.civitas)"
                  value={newDID}
                  onChange={(e) => setNewDID(e.target.value)}
                />
                <button className="btn btn-primary" onClick={handleCreateDID}>
                  Create DID
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reputation Score */}
        <div className="reputation-card">
          <div className="reputation-header">
            <h3>Reputation Score</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Source badge */}
              <span className={`source-badge ${reputationSource === 'blockchain' ? 'badge-chain' : 'badge-cache'}`}
                title={reputationSource === 'blockchain' ? 'Score read from smart contract' : 'Cached locally — blockchain not reachable'}>
                {reputationSource === 'blockchain' ? '⛓️ On-Chain' : '💾 Cached'}
              </span>
              <div className="score-display">
                <span className="score-value">{reputation}</span>
                <span className="score-max">/1000</span>
              </div>
            </div>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(reputation / 1000) * 100}%` }}></div>
          </div>

          {/* Blockchain / Graph status row */}
          <div className="chain-status-row">
            <span className={`status-dot ${chainStatus?.connected ? 'dot-green' : 'dot-red'}`}/>
            <span className="status-label">
              {chainStatus?.connected
                ? `Blockchain: block #${chainStatus.blockNumber}`
                : 'Blockchain: offline'}
            </span>
            <span style={{ margin: '0 0.5rem', opacity: 0.4 }}>|</span>
            <span className={`status-dot ${graphStatus?.available ? 'dot-green' : 'dot-gray'}`}/>
            <span className="status-label">
              {graphStatus?.available
                ? `The Graph: block #${graphStatus.syncedBlock}`
                : 'The Graph: not synced'}
            </span>
            {DID && (
              <button className="history-btn" onClick={async () => {
                setShowRepHistory(true);
                if (reputationHistory.length === 0) await loadRepHistory();
              }}>History ▾</button>
            )}
          </div>

          {/* Reputation change history (from The Graph) */}
          {showRepHistory && (
            <div className="rep-history">
              <div className="rep-history-header">
                <span>On-Chain Reputation History (via The Graph)</span>
                <button className="close-small" onClick={() => setShowRepHistory(false)}>×</button>
              </div>
              {reputationHistory.length === 0 ? (
                <p className="rep-history-empty">No on-chain reputation events yet</p>
              ) : (
                reputationHistory.map((ev, i) => (
                  <div key={i} className="rep-history-row">
                    <span className="rep-score">{ev.newReputation}</span>
                    <span className="rep-ts">{new Date(Number(ev.timestamp) * 1000).toLocaleString()}</span>
                    <a className="rep-tx" href={`https://etherscan.io/tx/${ev.txHash}`}
                       target="_blank" rel="noreferrer" title={ev.txHash}>
                      {ev.txHash.slice(0, 10)}…
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="reputation-factors">
            <div className="factor">
              <span>Transaction History</span>
              <span className="factor-value">+{reputationDetails?.factors?.transactionHistory || Math.floor(reputation * 0.3)}</span>
            </div>
            <div className="factor">
              <span>Community Engagement</span>
              <span className="factor-value">+{reputationDetails?.factors?.communityEngagement || Math.floor(reputation * 0.2)}</span>
            </div>
            <div className="factor">
              <span>Governance Participation</span>
              <span className="factor-value">+{reputationDetails?.factors?.governanceParticipation || Math.floor(reputation * 0.3)}</span>
            </div>
            <div className="factor">
              <span>Verified Credentials</span>
              <span className="factor-value">+{reputationDetails?.factors?.verifiedCredentials || Math.floor(reputation * 0.2)}</span>
            </div>
          </div>
        </div>

        {/* Verifiable Credentials */}
        <div className="credentials-section">
          <h2>Verifiable Credentials</h2>
          {loadingCredentials ? (
            <div className="loading-credentials">Loading credentials...</div>
          ) : (
            <div className="credentials-grid">
              {credentials.length > 0 ? (
                credentials.map((cred) => (
                  <div key={cred.credentialId} className="credential-card">
                    <div className="credential-icon">{cred.icon || '📜'}</div>
                    <h4>{cred.title}</h4>
                    <p className="credential-issuer">Issued by: {cred.issuer.name}</p>
                    <p className="credential-date">
                      Valid: {new Date(cred.issuedAt).toLocaleDateString()}
                      {cred.expiresAt && ` - ${new Date(cred.expiresAt).toLocaleDateString()}`}
                    </p>
                    {cred.isRevoked && (
                      <p className="credential-revoked">❌ Revoked</p>
                    )}
                    <div className="credential-actions">
                      <button className="btn-primary">View</button>
                      <button className="btn-secondary" disabled={cred.isRevoked}>Share</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-credentials">
                  <p>No credentials yet</p>
                  <p className="subtitle">Request or import credentials to build your identity</p>
                </div>
              )}
              
              <div className="credential-card add-credential">
                <div className="credential-icon">➕</div>
                <h4>Add New Credential</h4>
                <p className="credential-description">Request or import credentials</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="identity-actions">
          <h2>Identity Management</h2>
          <div className="action-grid">
            <div className="action-card">
              <div className="action-icon">🔑</div>
              <h4>Manage Private Keys</h4>
              <p>View and backup your cryptographic keys</p>
              <button className="action-btn">Manage Keys</button>
            </div>

            <div className="action-card">
              <div className="action-icon">👥</div>
              <h4>Social Recovery</h4>
              <p>Set up guardians to recover your account</p>
              <button className="action-btn" onClick={() => setShowRecoveryModal(true)}>Setup Guardians</button>
            </div>

            <div className="action-card">
              <div className="action-icon">🔐</div>
              <h4>Zero-Knowledge Proofs</h4>
              <p>Prove attributes without revealing data</p>
              <button className="action-btn">Create Proof</button>
            </div>

            <div className="action-card">
              <div className="action-icon">📜</div>
              <h4>Audit Trail</h4>
              <p>View all identity-related activities</p>
              <button className="action-btn" onClick={handleViewHistory}>View History</button>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="privacy-notice">
          <h4>🔒 Privacy & Security</h4>
          <p>
            Your identity data is encrypted and stored securely. Only you can authorize access to your credentials. 
            CIVITAS uses zero-knowledge proofs to verify information without exposing sensitive details.
          </p>
        </div>

        {/* Social Recovery Modal */}
        {showRecoveryModal && (
          <div className="modal-overlay" onClick={() => setShowRecoveryModal(false)}>
            <div className="modal-content activity-modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🛡️ Social Recovery</h2>
                <button className="close-btn" onClick={() => setShowRecoveryModal(false)}>×</button>
              </div>
              <div className="modal-body">
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
                  {[['register','📝 Register'],['initiate','🔄 Initiate'],['approve','✅ Approve'],['execute','⚡ Execute'],['status','📊 Status']].map(([t,l]) => (
                    <button key={t} onClick={() => { setRecoveryTab(t); setRecMsg({ error:'', success:'' }); }}
                      style={{ padding: '6px 14px', borderRadius: 16, border: 'none', cursor: 'pointer',
                               background: recoveryTab === t ? '#1f6feb' : '#21262d',
                               color: recoveryTab === t ? '#fff' : '#8b949e', fontSize: 13 }}>
                      {l}
                    </button>
                  ))}
                </div>

                {/* Register */}
                {recoveryTab === 'register' && (
                  <div>
                    <p style={{ color: '#8b949e', fontSize: 13, marginBottom: 14 }}>
                      Register guardians who can approve recovery of your account. Require M-of-N signatures.
                    </p>
                    <label style={{ fontSize: 13, color: '#8b949e' }}>Guardian Addresses (one per line)</label>
                    <textarea rows={4} value={recGuardians} onChange={e => setRecGuardians(e.target.value)}
                      placeholder="0xGuardian1&#10;0xGuardian2&#10;0xGuardian3"
                      style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: 10, color: '#e6edf3', fontFamily: 'monospace', fontSize: 12, marginTop: 6, boxSizing: 'border-box', resize: 'vertical' }}/>
                    <label style={{ fontSize: 13, color: '#8b949e', display: 'block', marginTop: 14 }}>Approval Threshold</label>
                    <input type="number" min={1} value={recThreshold} onChange={e => setRecThreshold(Number(e.target.value))}
                      style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '8px 12px', color: '#e6edf3', width: 80, marginTop: 6 }}/>
                    <div style={{ marginTop: 16 }}>
                      <button className="btn btn-primary" onClick={handleRegisterRecovery} disabled={recLoading}>
                        {recLoading ? 'Registering…' : '📝 Register'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Initiate */}
                {recoveryTab === 'initiate' && (
                  <div>
                    <p style={{ color: '#8b949e', fontSize: 13, marginBottom: 14 }}>
                      As a guardian, initiate recovery for a compromised account. A time-lock period applies before execution.
                    </p>
                    <label style={{ fontSize: 13, color: '#8b949e' }}>Account to Recover</label>
                    <input value={recTargetAcct} onChange={e => setRecTargetAcct(e.target.value)} placeholder="0x..."
                      style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '8px 12px', color: '#e6edf3', marginTop: 6, boxSizing: 'border-box' }}/>
                    <label style={{ fontSize: 13, color: '#8b949e', display: 'block', marginTop: 14 }}>Proposed New Owner</label>
                    <input value={recNewOwner} onChange={e => setRecNewOwner(e.target.value)} placeholder="0x..."
                      style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '8px 12px', color: '#e6edf3', marginTop: 6, boxSizing: 'border-box' }}/>
                    <div style={{ marginTop: 16 }}>
                      <button className="btn btn-primary" onClick={handleInitiateRecovery} disabled={recLoading}>
                        {recLoading ? 'Initiating…' : '🔄 Initiate Recovery'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Approve */}
                {recoveryTab === 'approve' && (
                  <div>
                    <p style={{ color: '#8b949e', fontSize: 13, marginBottom: 14 }}>
                      As a guardian, approve a pending recovery request.
                    </p>
                    <label style={{ fontSize: 13, color: '#8b949e' }}>Account Being Recovered</label>
                    <input value={recTargetAcct} onChange={e => setRecTargetAcct(e.target.value)} placeholder="0x..."
                      style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '8px 12px', color: '#e6edf3', marginTop: 6, boxSizing: 'border-box' }}/>
                    <div style={{ marginTop: 16 }}>
                      <button className="btn btn-primary" onClick={handleApproveRecovery} disabled={recLoading}>
                        {recLoading ? 'Approving…' : '✅ Approve Recovery'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Execute */}
                {recoveryTab === 'execute' && (
                  <div>
                    <p style={{ color: '#8b949e', fontSize: 13, marginBottom: 14 }}>
                      Execute recovery after the time-lock has passed and enough guardians have approved.
                    </p>
                    <label style={{ fontSize: 13, color: '#8b949e' }}>Account to Execute Recovery For</label>
                    <input value={recTargetAcct} onChange={e => setRecTargetAcct(e.target.value)} placeholder="0x..."
                      style={{ width: '100%', background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '8px 12px', color: '#e6edf3', marginTop: 6, boxSizing: 'border-box' }}/>
                    <div style={{ marginTop: 16 }}>
                      <button className="btn btn-primary" onClick={handleExecuteRecovery} disabled={recLoading}>
                        {recLoading ? 'Executing…' : '⚡ Execute Recovery'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Status */}
                {recoveryTab === 'status' && (
                  <div>
                    <label style={{ fontSize: 13, color: '#8b949e' }}>Account Address</label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <input value={recTargetAcct} onChange={e => setRecTargetAcct(e.target.value)} placeholder="0x..."
                        style={{ flex: 1, background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '8px 12px', color: '#e6edf3' }}/>
                      <button className="btn btn-secondary" onClick={loadRecoveryStatus} disabled={recLoading}>
                        {recLoading ? '…' : '🔍 Fetch'}
                      </button>
                    </div>
                    {recoveryStatus && (
                      <div style={{ marginTop: 14, background: '#0d1117', borderRadius: 8, padding: 14, border: '1px solid #30363d', fontSize: 13 }}>
                        <div style={{ marginBottom: 6 }}><span style={{ color: '#8b949e' }}>Pending:</span> <strong>{String(recoveryStatus.pending)}</strong></div>
                        <div style={{ marginBottom: 6 }}><span style={{ color: '#8b949e' }}>Approvals:</span> <strong>{String(recoveryStatus.approvalCount)}</strong></div>
                        <div style={{ marginBottom: 6 }}><span style={{ color: '#8b949e' }}>New Owner:</span> <code style={{ fontSize: 11 }}>{recoveryStatus.proposedOwner}</code></div>
                      </div>
                    )}
                    {accountConfig && (
                      <div style={{ marginTop: 10, background: '#0d1117', borderRadius: 8, padding: 14, border: '1px solid #30363d', fontSize: 13 }}>
                        <div style={{ marginBottom: 6 }}><span style={{ color: '#8b949e' }}>Guardians:</span> <strong>{String(accountConfig.guardianCount)}</strong></div>
                        <div><span style={{ color: '#8b949e' }}>Threshold:</span> <strong>{String(accountConfig.threshold)}</strong></div>
                      </div>
                    )}
                  </div>
                )}

                {recMsg.error   && <div style={{ marginTop: 14, background: '#2d1c1c', border: '1px solid #da3633', borderRadius: 8, padding: '10px 14px', color: '#ff7b72', fontSize: 13 }}>⚠️ {recMsg.error}</div>}
                {recMsg.success && <div style={{ marginTop: 14, background: '#1c2b1c', border: '1px solid #2ea043', borderRadius: 8, padding: '10px 14px', color: '#3fb950', fontSize: 13 }}>{recMsg.success}</div>}
              </div>
            </div>
          </div>
        )}

        {/* Activity Modal */}
        {showActivityModal && (
          <div className="modal-overlay" onClick={() => setShowActivityModal(false)}>
            <div className="modal-content activity-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Activity History</h2>
                <button className="close-btn" onClick={() => setShowActivityModal(false)}>×</button>
              </div>
              <div className="modal-body">
                {loadingActivities ? (
                  <div className="loading-activities">Loading activities...</div>
                ) : activities.length > 0 ? (
                  <div className="activities-list">
                    {activities.map((activity, index) => (
                      <div key={index} className="activity-item">
                        <div className="activity-icon">{getActivityIcon(activity.type)}</div>
                        <div className="activity-details">
                          <div className="activity-action">{activity.action}</div>
                          <div className="activity-time">{formatTimestamp(activity.timestamp)}</div>
                        </div>
                        <div className={`activity-status status-${activity.status}`}>
                          {activity.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-activities">
                    <p>No activities yet</p>
                    <p className="subtitle">Your identity actions will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
