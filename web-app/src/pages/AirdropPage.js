import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './AirdropPage.css';

const AIRDROP_ABI = [
  'function claim(uint256 roundId, uint256 amount, bytes32[] proof)',
  'function claimRegional(uint256 roundId, uint256 amount, bytes32[] proof)',
  'function claimVested()',
  'function claimableVested(address user) view returns (uint256)',
  'function roundCount() view returns (uint256)',
];

/**
 * Merkle proof lookup is normally served by a backend or stored on IPFS.
 * This demo uses localStorage for the user-uploaded proof JSON.
 * Production flow: GET /api/airdrop/proof/:address → { roundId, amount, proof, regional }
 */

export default function AirdropPage() {
  const [account, setAccount]         = useState('');
  const [proofJson, setProofJson]     = useState('');
  const [parsedProof, setParsedProof] = useState(null);
  const [vestable, setVestable]       = useState('0');
  const [roundCount, setRoundCount]   = useState(0);
  const [claimStatus, setStatus]      = useState({ loading: false, error: '', success: '' });
  const [contract, setContract]       = useState(null);

  const contractAddr = import.meta.env.VITE_AIRDROPDISTRIBUTOR_ADDRESS || '';

  useEffect(() => {
    if (account && contract) refreshInfo();
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

  const parseProof = () => {
    try {
      const p = JSON.parse(proofJson);
      setParsedProof(p);
      setStatus({ loading: false, error: '', success: 'Proof parsed successfully ✓' });
    } catch {
      setStatus({ loading: false, error: 'Invalid JSON. Expected: { roundId, amount, proof: [...], regional? }', success: '' });
    }
  };

  const claim = async (regional = false) => {
    if (!contract) return setStatus({ loading: false, error: 'Connect wallet first', success: '' });
    if (!parsedProof) return setStatus({ loading: false, error: 'Paste and parse a proof first', success: '' });
    setStatus({ loading: true, error: '', success: '' });
    try {
      const { roundId, amount, proof } = parsedProof;
      const amt = typeof amount === 'string' && amount.includes('e') ? BigInt(amount) : ethers.parseEther(String(amount));
      const fn  = regional ? contract.claimRegional : contract.claim;
      const tx  = await fn(roundId, amt, proof);
      await tx.wait();
      setStatus({ loading: false, error: '', success: `✅ Claimed! Tx: ${tx.hash}` });
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
        <h1>🪂 CIVITAS Airdrop</h1>
        <p>Claim your CIV tokens. Regional participants receive a <strong>+5% bonus</strong>. Unvested allocations release linearly over 12 months.</p>
      </div>

      {/* Wallet connect */}
      {!account ? (
        <button className="ad-btn ad-btn-primary ad-connect" onClick={connectWallet}>
          🔗 Connect Wallet
        </button>
      ) : (
        <div className="ad-wallet-badge">
          ✅ <code>{account.slice(0,6)}…{account.slice(-4)}</code>
        </div>
      )}

      {/* Stats row */}
      {account && (
        <div className="ad-stats">
          <div className="ad-stat">
            <div className="ad-stat-label">Active Rounds</div>
            <div className="ad-stat-val">{roundCount}</div>
          </div>
          <div className="ad-stat">
            <div className="ad-stat-label">Claimable Vested</div>
            <div className="ad-stat-val">{parseFloat(vestable).toFixed(4)} CIV</div>
          </div>
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

      {/* Proof-based claim */}
      <div className="ad-card">
        <h3>🎟️ Claim from Round</h3>
        <p className="ad-hint">Paste the Merkle proof JSON for your address. You can get it from the CIVITAS airdrop portal or IPFS.</p>

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
          <button className="ad-btn ad-btn-secondary" onClick={parseProof}>🔍 Parse Proof</button>
          <button className="ad-btn ad-btn-primary"   onClick={() => claim(false)} disabled={!parsedProof || claimStatus.loading}>⬇️ Claim</button>
          <button className="ad-btn ad-btn-regional"  onClick={() => claim(true)}  disabled={!parsedProof || claimStatus.loading}>🌍 Claim Regional (+5%)</button>
        </div>

        {parsedProof && (
          <div className="ad-proof-preview">
            <div>Round: <strong>{parsedProof.roundId}</strong></div>
            <div>Amount: <strong>{parsedProof.amount} CIV</strong></div>
            <div>Proof entries: <strong>{parsedProof.proof?.length || 0}</strong></div>
          </div>
        )}
      </div>

      {/* Status */}
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
