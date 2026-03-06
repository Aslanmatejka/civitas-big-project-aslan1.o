import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { proposeTreasuryETH, proposeTreasuryToken, confirmTreasuryTx, executeTreasuryTx } from '../services/contractService';
import './GovernancePage.css';

export default function GovernancePage() {
  const [selectedVote, setSelectedVote] = useState({});
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  // Treasury state
  const [showTreasury, setShowTreasury]     = useState(false);
  const [treaTab, setTreaTab]               = useState('eth');
  const [treaTo, setTreaTo]                 = useState('');
  const [treaValue, setTreaValue]           = useState('');
  const [treaToken, setTreaToken]           = useState('');
  const [treaAmount, setTreaAmount]         = useState('');
  const [treaDesc, setTreaDesc]             = useState('');
  const [treaTxId, setTreaTxId]             = useState('');
  const [treaLoading, setTreaLoading]       = useState(false);
  const [treaMsg, setTreaMsg]               = useState({ error: '', success: '' });
  const { 
    balance, 
    reputation, 
    isConnected, 
    isLoading, 
    connectWallet, 
    voteOnProposal,
    getProposals 
  } = useApp();

  // Load proposals from backend
  useEffect(() => {
    if (isConnected) {
      loadProposals();
    }
  }, [isConnected]);

  const loadProposals = async () => {
    setLoadingProposals(true);
    try {
      const activeProposals = await getProposals('active');
      setProposals(activeProposals);
    } catch (error) {
      console.error('Failed to load proposals:', error);
      setProposals([]);
    } finally {
      setLoadingProposals(false);
    }
  };

  const handleProposeETH = async () => {
    setTreaLoading(true); setTreaMsg({ error: '', success: '' });
    try {
      const receipt = await proposeTreasuryETH(treaTo, treaValue, treaDesc);
      setTreaMsg({ error: '', success: `✅ ETH proposal submitted! Tx: ${receipt?.hash || receipt}` });
      setTreaTo(''); setTreaValue(''); setTreaDesc('');
    } catch (e) { setTreaMsg({ error: e.reason || e.message, success: '' }); }
    finally { setTreaLoading(false); }
  };

  const handleProposeToken = async () => {
    setTreaLoading(true); setTreaMsg({ error: '', success: '' });
    try {
      const receipt = await proposeTreasuryToken(treaTo, treaToken, treaAmount, treaDesc);
      setTreaMsg({ error: '', success: `✅ Token proposal submitted! Tx: ${receipt?.hash || receipt}` });
      setTreaTo(''); setTreaToken(''); setTreaAmount(''); setTreaDesc('');
    } catch (e) { setTreaMsg({ error: e.reason || e.message, success: '' }); }
    finally { setTreaLoading(false); }
  };

  const handleConfirmTx = async () => {
    setTreaLoading(true); setTreaMsg({ error: '', success: '' });
    try {
      await confirmTreasuryTx(treaTxId);
      setTreaMsg({ error: '', success: `✅ Tx #${treaTxId} confirmed.` });
    } catch (e) { setTreaMsg({ error: e.reason || e.message, success: '' }); }
    finally { setTreaLoading(false); }
  };

  const handleExecuteTx = async () => {
    setTreaLoading(true); setTreaMsg({ error: '', success: '' });
    try {
      await executeTreasuryTx(treaTxId);
      setTreaMsg({ error: '', success: `✅ Tx #${treaTxId} executed.` });
    } catch (e) { setTreaMsg({ error: e.reason || e.message, success: '' }); }
    finally { setTreaLoading(false); }
  };

  const handleVote = async (proposalId, voteType) => {
    try {
      await voteOnProposal(proposalId, voteType);
      setSelectedVote({ ...selectedVote, [proposalId]: voteType });
      
      // Reload proposals to get updated vote counts
      await loadProposals();
      
      alert('Vote submitted successfully!');
    } catch (error) {
      alert('Vote failed: ' + error.message);
    }
  };

  const votingPower = Math.sqrt(parseFloat(balance) + reputation).toFixed(1);

  if (!isConnected) {
    return (
      <div className="governance-page">
        <div className="governance-container">
          <div className="not-connected">
            <h2>Wallet Not Connected</h2>
            <p>Please connect your wallet to participate in governance.</p>
            <button className="btn btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="governance-page">
      <div className="governance-container">
        {/* Header */}
        <div className="governance-header">
          <h1>Governance</h1>
          <p className="subtitle">Shape the future of CIVITAS</p>
        </div>

        {/* Voting Power Card */}
        <div className="voting-power-card">
          <div className="power-info">
            <h3>Your Voting Power</h3>
            <div className="power-breakdown">
              <div className="power-item">
                <span className="power-label">Staked CIV:</span>
                <span className="power-value">{parseFloat(balance).toFixed(2)} CIV</span>
              </div>
              <div className="power-item">
                <span className="power-label">Reputation Bonus:</span>
                <span className="power-value">+{reputation}</span>
              </div>
              <div className="power-item">
                <span className="power-label">Quadratic Weight:</span>
                <span className="power-value">√{(parseFloat(balance) + reputation).toFixed(0)} ≈ {votingPower}</span>
              </div>
            </div>
          </div>
          <div className="power-display">
            <div className="power-number">{votingPower}</div>
            <div className="power-text">Voting Weight</div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="info-banner">
          <div className="info-icon">ℹ️</div>
          <div className="info-content">
            <h4>Quadratic Voting Explained</h4>
            <p>
              Your voting weight is calculated as the square root of (staked tokens + reputation). 
              This prevents whale domination and gives smaller holders meaningful influence.
            </p>
          </div>
        </div>

        {/* Active Proposals */}
        <div className="proposals-section">
          <h2>Active Proposals</h2>
          
          {loadingProposals ? (
            <div className="loading-proposals">
              <div className="spinner"></div>
              <p>Loading proposals...</p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="no-proposals">
              <p>No active proposals at the moment.</p>
            </div>
          ) : (
            proposals.map((proposal) => {
              const totalVotes = (proposal.votes?.for || 0) + (proposal.votes?.against || 0) + (proposal.votes?.abstain || 0);
              const forPercent = totalVotes > 0 ? ((proposal.votes.for / totalVotes) * 100).toFixed(1) : '0.0';
              const againstPercent = totalVotes > 0 ? ((proposal.votes.against / totalVotes) * 100).toFixed(1) : '0.0';
              
              // Calculate time remaining
              const endTime = new Date(proposal.votingEndTime);
              const now = new Date();
              const timeRemaining = Math.max(0, endTime - now);
              const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
              const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const timeRemainingStr = daysRemaining > 0 
                ? `${daysRemaining} day${daysRemaining > 1 ? 's' : ''}` 
                : hoursRemaining > 0 
                ? `${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}`
                : 'Ending soon';
              
              return (
                <div key={proposal.proposalId} className="proposal-card">
                  <div className="proposal-header">
                    <div className="proposal-meta">
                      <span className="proposal-id">CIP-{String(proposal.proposalId).padStart(3, '0')}</span>
                      <span className={`proposal-status ${proposal.status.toLowerCase()}`}>{proposal.status}</span>
                    </div>
                    <div className="proposal-time">⏱️ Ends in {timeRemainingStr}</div>
                  </div>

                  <h3 className="proposal-title">{proposal.title}</h3>
                  <p className="proposal-description">{proposal.description}</p>
                  <p className="proposal-proposer">Proposed by: {proposal.proposer?.name || proposal.proposer?.address || 'Unknown'}</p>

                  <div className="voting-stats">
                    <div className="stat">
                      <span className="stat-label">For</span>
                      <span className="stat-value for">{forPercent}%</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Against</span>
                      <span className="stat-value against">{againstPercent}%</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Participation</span>
                      <span className="stat-value">{proposal.participationPercent?.toFixed(1) || '0.0'}%</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Quorum</span>
                      <span className="stat-value">{proposal.quorumRequired}%</span>
                    </div>
                  </div>

                  <div className="vote-progress">
                    <div className="progress-bar-container">
                      <div className="progress-bar for" style={{ width: `${forPercent}%` }}></div>
                      <div className="progress-bar against" style={{ width: `${againstPercent}%` }}></div>
                    </div>
                  </div>

                  <div className="vote-actions">
                    <button
                      className={`vote-btn for ${selectedVote[proposal.proposalId] === 'for' ? 'selected' : ''}`}
                      onClick={() => handleVote(proposal.proposalId, 'for')}
                    >
                      ✓ Vote For
                    </button>
                    <button
                      className={`vote-btn against ${selectedVote[proposal.proposalId] === 'against' ? 'selected' : ''}`}
                      onClick={() => handleVote(proposal.proposalId, 'against')}
                    >
                      ✗ Vote Against
                    </button>
                    <button
                      className={`vote-btn abstain ${selectedVote[proposal.proposalId] === 'abstain' ? 'selected' : ''}`}
                      onClick={() => handleVote(proposal.proposalId, 'abstain')}
                    >
                      ◯ Abstain
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Completed Proposals */}
        <div className="completed-section">
          <h2>Recently Completed</h2>
          
          <div className="completed-card">
            <div className="completed-header">
              <span className="proposal-id">CIP-000</span>
              <span className="proposal-status passed">Passed</span>
            </div>
            <h4>Increase Validator Set to 300 Nodes</h4>
            <div className="completed-stats">
              <span className="completed-result for">✓ 78% For</span>
              <span className="completed-date">Executed: Feb 20, 2026</span>
            </div>
          </div>

          <div className="completed-card">
            <div className="completed-header">
              <span className="proposal-id">CIP-999</span>
              <span className="proposal-status rejected">Rejected</span>
            </div>
            <h4>Enable Smart Contract Gas Subsidies</h4>
            <div className="completed-stats">
              <span className="completed-result against">✗ 62% Against</span>
              <span className="completed-date">Closed: Feb 18, 2026</span>
            </div>
          </div>
        </div>

        {/* Create Proposal CTA */}
        <div className="create-proposal-cta">
          <h3>Have an idea to improve CIVITAS?</h3>
          <p>Community members with 1000+ reputation can submit proposals</p>
          <button className="create-btn">Create Proposal</button>
        </div>

        {/* Multi-Sig Treasury */}
        <div className="create-proposal-cta" style={{ marginTop: 24 }}>
          <h3>🏦 Multi-Sig Treasury</h3>
          <p>Propose, confirm, and execute on-chain fund transfers requiring multiple signatures</p>
          <button className="create-btn" onClick={() => setShowTreasury(!showTreasury)}>
            {showTreasury ? '▲ Hide Treasury' : '▼ Open Treasury'}
          </button>
        </div>

        {showTreasury && (
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 24, marginTop: 16 }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {[['eth','⟠ Propose ETH'],['token','🪙 Propose Token'],['confirm','✅ Confirm Tx'],['execute','⚡ Execute Tx']].map(([t,l]) => (
                <button key={t}
                  style={{ padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                           background: treaTab === t ? '#1f6feb' : '#21262d',
                           color: treaTab === t ? '#fff' : '#8b949e', fontSize: 13 }}
                  onClick={() => { setTreaTab(t); setTreaMsg({ error:'', success:'' }); }}>
                  {l}
                </button>
              ))}
            </div>

            {/* ETH Proposal */}
            {treaTab === 'eth' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ color: '#8b949e', fontSize: 13 }}>Propose sending ETH to a recipient address. Requires multisig approval before execution.</p>
                <label style={{ fontSize: 13, color: '#8b949e' }}>Recipient Address</label>
                <input value={treaTo} onChange={e => setTreaTo(e.target.value)} placeholder="0x..."
                  style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: '#e6edf3' }}/>
                <label style={{ fontSize: 13, color: '#8b949e' }}>ETH Amount</label>
                <input value={treaValue} onChange={e => setTreaValue(e.target.value)} placeholder="0.5"
                  style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: '#e6edf3' }}/>
                <label style={{ fontSize: 13, color: '#8b949e' }}>Description</label>
                <input value={treaDesc} onChange={e => setTreaDesc(e.target.value)} placeholder="Payment for community bounty #42"
                  style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: '#e6edf3' }}/>
                <button className="create-btn" style={{ alignSelf: 'flex-start' }} onClick={handleProposeETH} disabled={treaLoading}>
                  {treaLoading ? 'Submitting…' : '⟠ Submit ETH Proposal'}
                </button>
              </div>
            )}

            {/* Token Proposal */}
            {treaTab === 'token' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ color: '#8b949e', fontSize: 13 }}>Propose transferring ERC-20 tokens from the treasury.</p>
                <label style={{ fontSize: 13, color: '#8b949e' }}>Recipient Address</label>
                <input value={treaTo} onChange={e => setTreaTo(e.target.value)} placeholder="0x..."
                  style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: '#e6edf3' }}/>
                <label style={{ fontSize: 13, color: '#8b949e' }}>Token Contract Address</label>
                <input value={treaToken} onChange={e => setTreaToken(e.target.value)} placeholder="0xTokenAddr..."
                  style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: '#e6edf3' }}/>
                <label style={{ fontSize: 13, color: '#8b949e' }}>Amount</label>
                <input value={treaAmount} onChange={e => setTreaAmount(e.target.value)} placeholder="1000"
                  style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: '#e6edf3' }}/>
                <label style={{ fontSize: 13, color: '#8b949e' }}>Description</label>
                <input value={treaDesc} onChange={e => setTreaDesc(e.target.value)} placeholder="Grant payment in CIV"
                  style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: '#e6edf3' }}/>
                <button className="create-btn" style={{ alignSelf: 'flex-start' }} onClick={handleProposeToken} disabled={treaLoading}>
                  {treaLoading ? 'Submitting…' : '🪙 Submit Token Proposal'}
                </button>
              </div>
            )}

            {/* Confirm */}
            {treaTab === 'confirm' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ color: '#8b949e', fontSize: 13 }}>Add your signature to a pending treasury transaction.</p>
                <label style={{ fontSize: 13, color: '#8b949e' }}>Transaction ID</label>
                <input value={treaTxId} onChange={e => setTreaTxId(e.target.value)} placeholder="0"
                  style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: '#e6edf3', width: 140 }}/>
                <button className="create-btn" style={{ alignSelf: 'flex-start' }} onClick={handleConfirmTx} disabled={treaLoading}>
                  {treaLoading ? 'Confirming…' : '✅ Confirm Tx'}
                </button>
              </div>
            )}

            {/* Execute */}
            {treaTab === 'execute' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ color: '#8b949e', fontSize: 13 }}>Execute a transaction once it has reached the required confirmation threshold.</p>
                <label style={{ fontSize: 13, color: '#8b949e' }}>Transaction ID</label>
                <input value={treaTxId} onChange={e => setTreaTxId(e.target.value)} placeholder="0"
                  style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: '9px 12px', color: '#e6edf3', width: 140 }}/>
                <button className="create-btn" style={{ alignSelf: 'flex-start' }} onClick={handleExecuteTx} disabled={treaLoading}>
                  {treaLoading ? 'Executing…' : '⚡ Execute Tx'}
                </button>
              </div>
            )}

            {treaMsg.error   && <div style={{ marginTop: 14, background: '#2d1c1c', border: '1px solid #da3633', borderRadius: 8, padding: '10px 14px', color: '#ff7b72', fontSize: 13 }}>⚠️ {treaMsg.error}</div>}
            {treaMsg.success && <div style={{ marginTop: 14, background: '#1c2b1c', border: '1px solid #2ea043', borderRadius: 8, padding: '10px 14px', color: '#3fb950', fontSize: 13 }}>{treaMsg.success}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
