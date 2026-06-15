import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { airdropApi } from '../services/api';
import { Gift, Link as LinkIcon, CheckCircle, AlertTriangle, Wallet } from 'lucide-react';
import './AirdropPage.css';

const AIRDROP_ABI = [
  'function claim(uint256 roundId, uint256 amount, bytes32[] proof)',
  'function claimRegional(uint256 roundId, uint256 amount, bytes32[] proof)',
  'function claimVested()',
  'function claimableVested(address user) view returns (uint256)',
  'function roundCount() view returns (uint256)',
];

export default function AirdropPage() {
  const [account, setAccount]         = useState('');
  const [contract, setContract]       = useState(null);
  const [vestable, setVestable]       = useState('0');
  const [roundCount, setRoundCount]   = useState(0);
  const [claimStatus, setStatus]      = useState({ loading: false, error: '', success: '' });

  // Backend-fetched proofs
  const [eligibleProofs, setEligibleProofs] = useState([]);
  const [loadingProofs, setLoadingProofs]   = useState(false);
  const [backendStats, setBackendStats]     = useState(null);

  // Manual paste fallback
  const [showManual, setShowManual]   = useState(false);
  const [proofJson, setProofJson]     = useState('');
  const [parsedProof, setParsedProof] = useState(null);

  const contractAddr = import.meta.env.VITE_AIRDROPDISTRIBUTOR_ADDRESS || '';

  useEffect(() => {
    // Load global airdrop stats regardless of wallet connection
    airdropApi.getStats()
      .then(r => setBackendStats(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (account) {
      if (contract) refreshInfo();
      fetchProofsForAddress(account);
    }
  }, [account, contract]);

  const connectWallet = async () => {
    if (!window.ethereum) return alert('Please install MetaMask');
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer   = await provider.getSigner();
    const addr     = await signer.getAddress();
    setAccount(addr);
    if (contractAddr && contractAddr !== '0x0000000000000000000000000000000000000000') {
      setContract(new ethers.Contract(contractAddr, AIRDROP_ABI, signer));
    }
  };

  const refreshInfo = async () => {
    try {
      const [vested, rounds] = await Promise.all([
        contract.claimableVested(account),
        contract.roundCount(),
      ]);
      setVestable(ethers.formatEther(vested));
      setRoundCount(Number(rounds));
    } catch (e) {
      console.error('Refresh info:', e.message);
    }
  };

  const fetchProofsForAddress = async (addr) => {
    setLoadingProofs(true);
    try {
      const r = await airdropApi.getProof(addr);
      setEligibleProofs(r.data.proofs || []);
    } catch {
      setEligibleProofs([]);
    } finally {
      setLoadingProofs(false);
    }
  };

  const parseManualProof = () => {
    try {
      const p = JSON.parse(proofJson);
      setParsedProof(p);
      setStatus({ loading: false, error: '', success: 'Proof parsed ✓' });
    } catch {
      setStatus({ loading: false, error: 'Invalid JSON. Expected: { roundId, amount, proof: [...], regional? }', success: '' });
    }
  };

  const claim = async (entry, regional = false) => {
    if (!contract) return setStatus({ loading: false, error: 'Connect wallet first', success: '' });
    setStatus({ loading: true, error: '', success: '' });
    try {
      const { roundId, amount, proof } = entry;
      const amt = typeof amount === 'string' && amount.includes('e')
        ? BigInt(amount)
        : ethers.parseEther(String(amount));
      const fn = regional ? contract.claimRegional : contract.claim;
      const tx = await fn(roundId, amt, proof);
      await tx.wait();
      // Record the claim on the backend
      await airdropApi.recordClaim(account, roundId, tx.hash).catch(() => {});
      setStatus({ loading: false, error: '', success: `✅ Claimed! Tx: ${tx.hash}` });
      fetchProofsForAddress(account);
      refreshInfo();
    } catch (e) {
      setStatus({ loading: false, error: e.reason || e.message, success: '' });
    }
  };

  const claimVested = async () => {
    if (!contract) return setStatus({ loading: false, error: 'Connect wallet first', success: '' });
    setStatus({ loading: true, error: '', success: '' });
    try {
      const tx = await contract.claimVested();
      await tx.wait();
      setStatus({ loading: false, error: '', success: `✅ Vested tokens claimed! Tx: ${tx.hash}` });
      refreshInfo();
    } catch (e) {
      setStatus({ loading: false, error: e.reason || e.message, success: '' });
    }
  };

  return (
    <div className="airdrop-page">
      <div className="ad-hero">
        <h1><Gift size={24} /> CIVITAS Airdrop</h1>
        <p>Claim your CIV tokens. Regional participants receive a <strong>+5% bonus</strong>. Unvested allocations release linearly over 12 months.</p>
      </div>

      {/* Global stats */}
      {backendStats && (
        <div className="ad-stats">
          <div className="ad-stat">
            <div className="ad-stat-label">Active Rounds</div>
            <div className="ad-stat-val">{backendStats.activeRounds}</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat-label">Total Eligible</div>
            <div className="ad-stat-val">{backendStats.totalEligible?.toLocaleString()}</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat-label">Claimed</div>
            <div className="ad-stat-val">{backendStats.totalClaimed?.toLocaleString()}</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat-label">Claim Rate</div>
            <div className="ad-stat-val">{backendStats.claimRate}%</div>
          </div>
          {account && contract && (
            <div className="ad-stat">
              <div className="ad-stat-label">Claimable Vested</div>
              <div className="ad-stat-val">{parseFloat(vestable).toFixed(4)} CIV</div>
            </div>
          )}
        </div>
      )}

      {/* Wallet connect */}
      {!account ? (
        <button className="ad-btn ad-btn-primary ad-connect" onClick={connectWallet}>
          <Wallet size={16} /> Connect Wallet to Check Eligibility
        </button>
      ) : (
        <div className="ad-wallet-badge">
          <CheckCircle size={14} /> <code>{account.slice(0,6)}…{account.slice(-4)}</code>
        </div>
      )}

      {/* Claim vested */}
      {parseFloat(vestable) > 0 && (
        <div className="ad-card ad-vested-card">
          <h3>📅 Vested Tokens Available</h3>
          <p><strong>{parseFloat(vestable).toFixed(4)} CIV</strong> has vested and is ready to claim.</p>
          <button className="ad-btn ad-btn-primary" onClick={claimVested} disabled={claimStatus.loading}>
            {claimStatus.loading ? 'Claiming…' : '✅ Claim Vested'}
          </button>
        </div>
      )}

      {/* Auto-fetched eligibility */}
      {account && (
        <div className="ad-card">
          <h3>🎟️ Your Eligibility</h3>
          {loadingProofs ? (
            <div className="ad-checking">
              <div className="ad-spinner" />
              <span>Checking eligibility…</span>
            </div>
          ) : eligibleProofs.length === 0 ? (
            <div className="ad-not-eligible">
              <p>No eligible allocations found for <code>{account.slice(0,8)}…</code></p>
              <p className="ad-hint">If you believe you should be eligible, use the manual entry below or contact the CIVITAS team.</p>
            </div>
          ) : (
            <div className="ad-proof-list">
              {eligibleProofs.map((entry) => (
                <div key={entry.roundId} className={`ad-proof-item ${entry.claimed ? 'ad-proof-claimed' : ''}`}>
                  <div className="ad-proof-info">
                    <div className="ad-proof-round">
                      Round {entry.roundId}
                      {entry.claimed && <span className="ad-badge-claimed">Claimed</span>}
                      {entry.regional && !entry.claimed && <span className="ad-badge-regional">+5% Regional</span>}
                    </div>
                    {entry.round?.description && (
                      <div className="ad-proof-desc">{entry.round.description}</div>
                    )}
                    <div className="ad-proof-amount">{entry.amount} CIV</div>
                  </div>
                  {!entry.claimed && (
                    <div className="ad-proof-actions">
                      <button
                        className="ad-btn ad-btn-primary"
                        onClick={() => claim(entry, false)}
                        disabled={claimStatus.loading || !contract}
                      >
                        {claimStatus.loading ? 'Claiming…' : 'Claim'}
                      </button>
                      {entry.regional && (
                        <button
                          className="ad-btn ad-btn-regional"
                          onClick={() => claim(entry, true)}
                          disabled={claimStatus.loading || !contract}
                        >
                          🌍 Claim +5%
                        </button>
                      )}
                    </div>
                  )}
                  {entry.claimed && entry.txHash && (
                    <div className="ad-proof-tx">
                      Tx: <code>{entry.txHash.slice(0, 10)}…</code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual proof fallback */}
      <div className="ad-card">
        <button
          className="ad-manual-toggle"
          onClick={() => setShowManual(v => !v)}
        >
          {showManual ? '▲' : '▼'} Manual proof entry (advanced)
        </button>
        {showManual && (
          <>
            <p className="ad-hint" style={{ marginTop: '12px' }}>
              Paste your Merkle proof JSON if auto-lookup didn't find your allocation.
            </p>
            <label className="ad-label">Proof JSON</label>
            <textarea
              className="ad-textarea"
              rows={6}
              value={proofJson}
              onChange={e => setProofJson(e.target.value)}
              placeholder={`{
  "roundId": 1,
  "amount": "100",
  "proof": ["0xabc...", "0xdef..."],
  "regional": false
}`}
            />
            <div className="ad-actions">
              <button className="ad-btn ad-btn-secondary" onClick={parseManualProof}>🔍 Parse</button>
              <button
                className="ad-btn ad-btn-primary"
                onClick={() => claim(parsedProof, false)}
                disabled={!parsedProof || claimStatus.loading}
              >
                ⬇️ Claim
              </button>
              <button
                className="ad-btn ad-btn-regional"
                onClick={() => claim(parsedProof, true)}
                disabled={!parsedProof || claimStatus.loading}
              >
                🌍 Claim Regional (+5%)
              </button>
            </div>
            {parsedProof && (
              <div className="ad-proof-preview">
                <div>Round: <strong>{parsedProof.roundId}</strong></div>
                <div>Amount: <strong>{parsedProof.amount} CIV</strong></div>
                <div>Proof entries: <strong>{parsedProof.proof?.length || 0}</strong></div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Status messages */}
      {claimStatus.error   && <div className="ad-error">⚠️ {claimStatus.error}</div>}
      {claimStatus.success && <div className="ad-success">{claimStatus.success}</div>}

      {/* Info table */}
      <div className="ad-card ad-info-card">
        <h3>ℹ️ Airdrop Details</h3>
        <table className="ad-table">
          <tbody>
            <tr><td>Total Allocation</td><td>20% of CIV supply</td></tr>
            <tr><td>Regional Bonus</td><td>+5% for verified developing-region addresses</td></tr>
            <tr><td>Instant Mode</td><td>100% claimable immediately on confirmed round</td></tr>
            <tr><td>Vested Mode</td><td>Linear unlock over 12 months from claim date</td></tr>
            <tr><td>Claim Window</td><td>180 days per round</td></tr>
            <tr><td>DID Requirement</td><td>Optional per round (set by admin)</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
