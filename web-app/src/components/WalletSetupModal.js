import React, { useState, useCallback } from 'react';
import './WalletSetupModal.css';

/**
 * WalletSetupModal
 * Props:
 *   onMetaMask()         — connect via MetaMask
 *   onCreateWallet(password) — generate a new wallet with this password
 *   onImportSeed(phrase, password) — import from mnemonic + password
 *   onImportKey(key, password)    — import from private key + password
 *   onClose()           — close the modal without doing anything
 *   hasMetaMask         — bool, show MetaMask option only if true
 *   isLoading           — bool, show encrypting spinner
 *   loadingStep         — string, message to show while loading
 *   generatedMnemonic   — string, 12-word phrase to display (set by parent after generate)
 */
export default function WalletSetupModal({
  onMetaMask,
  onCreateWallet,
  onImportSeed,
  onImportKey,
  onClose,
  hasMetaMask,
  isLoading,
  loadingStep,
  generatedMnemonic,
}) {
  const [screen, setScreen] = useState('choice'); // 'choice' | 'create' | 'import' | 'reveal'
  const [importMode, setImportMode] = useState('seed'); // 'seed' | 'key'
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [backedUp, setBackedUp] = useState(false);
  const [showWords, setShowWords] = useState(false);
  const [error, setError] = useState('');

  const clearError = () => setError('');

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreate = useCallback(async () => {
    clearError();
    if (!backedUp) { setError('Please confirm you have backed up your recovery phrase.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    await onCreateWallet(password);
  }, [backedUp, password, confirmPassword, onCreateWallet]);

  const handleImport = useCallback(async () => {
    clearError();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    if (importMode === 'seed') {
      const words = seedPhrase.trim().split(/\s+/);
      if (words.length !== 12 && words.length !== 24) {
        setError('Recovery phrase must be 12 or 24 words.');
        return;
      }
      await onImportSeed(seedPhrase, password);
    } else {
      if (!privateKey.trim()) { setError('Please enter a private key.'); return; }
      await onImportKey(privateKey, password);
    }
  }, [importMode, password, confirmPassword, seedPhrase, privateKey, onImportSeed, onImportKey]);

  const mnemonicWords = generatedMnemonic ? generatedMnemonic.split(' ') : [];

  // ── Loading screen ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="wsm-overlay">
        <div className="wsm-modal wsm-loading-modal">
          <div className="wsm-spinner" />
          <h3>{loadingStep || 'Encrypting your wallet…'}</h3>
          <p className="wsm-loading-sub">This may take a few seconds. Do not close this window.</p>
        </div>
      </div>
    );
  }

  // ── Reveal mnemonic (after generate, before password) ────────────────────

  if (screen === 'reveal') {
    if (!generatedMnemonic) {
      // Generating — show spinner
      return (
        <div className="wsm-overlay">
          <div className="wsm-modal wsm-loading-modal">
            <div className="wsm-spinner" />
            <h3>Generating secure wallet…</h3>
            <p className="wsm-loading-sub">Creating your unique recovery phrase.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="wsm-overlay" onClick={onClose}>
        <div className="wsm-modal" onClick={e => e.stopPropagation()}>
          <button className="wsm-close" onClick={onClose}>✕</button>
          <div className="wsm-header">
            <div className="wsm-icon">🔑</div>
            <h2>Your Recovery Phrase</h2>
            <p className="wsm-sub">Write these 12 words down in order and store them somewhere safe. <strong>Never share them with anyone.</strong></p>
          </div>

          <div className={`wsm-mnemonic-grid ${showWords ? 'visible' : 'blurred'}`}>
            {mnemonicWords.map((word, i) => (
              <div key={i} className="wsm-word">
                <span className="wsm-word-num">{i + 1}</span>
                <span className="wsm-word-text">{word}</span>
              </div>
            ))}
          </div>

          {!showWords && (
            <button className="wsm-btn wsm-btn-ghost" onClick={() => setShowWords(true)}>
              👁 Reveal Recovery Phrase
            </button>
          )}

          {showWords && (
            <>
              <label className="wsm-checkbox">
                <input type="checkbox" checked={backedUp} onChange={e => setBackedUp(e.target.checked)} />
                I have written down my recovery phrase and stored it safely.
              </label>

              <div className="wsm-field">
                <label>Set Wallet Password</label>
                <div className="wsm-input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button className="wsm-eye" onClick={() => setShowPassword(p => !p)}>{showPassword ? '🙈' : '👁'}</button>
                </div>
              </div>

              <div className="wsm-field">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>

              {error && <p className="wsm-error">{error}</p>}

              <button className="wsm-btn wsm-btn-primary" onClick={handleCreate} disabled={!backedUp}>
                🚀 Create Wallet
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Import screen ─────────────────────────────────────────────────────────

  if (screen === 'import') {
    return (
      <div className="wsm-overlay" onClick={onClose}>
        <div className="wsm-modal" onClick={e => e.stopPropagation()}>
          <button className="wsm-close" onClick={onClose}>✕</button>
          <button className="wsm-back" onClick={() => { setScreen('choice'); clearError(); }}>← Back</button>

          <div className="wsm-header">
            <div className="wsm-icon">📥</div>
            <h2>Import Existing Wallet</h2>
          </div>

          <div className="wsm-tabs">
            <button className={importMode === 'seed' ? 'active' : ''} onClick={() => { setImportMode('seed'); clearError(); }}>Seed Phrase</button>
            <button className={importMode === 'key' ? 'active' : ''} onClick={() => { setImportMode('key'); clearError(); }}>Private Key</button>
          </div>

          {importMode === 'seed' && (
            <div className="wsm-field">
              <label>Recovery Phrase (12 or 24 words)</label>
              <textarea
                rows={4}
                placeholder="Enter words separated by spaces…"
                value={seedPhrase}
                onChange={e => setSeedPhrase(e.target.value)}
                className="wsm-textarea"
              />
            </div>
          )}

          {importMode === 'key' && (
            <div className="wsm-field">
              <label>Private Key</label>
              <input
                type="password"
                placeholder="0x…"
                value={privateKey}
                onChange={e => setPrivateKey(e.target.value)}
              />
            </div>
          )}

          <div className="wsm-field">
            <label>New Password (to encrypt locally)</label>
            <div className="wsm-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button className="wsm-eye" onClick={() => setShowPassword(p => !p)}>{showPassword ? '🙈' : '👁'}</button>
            </div>
          </div>

          <div className="wsm-field">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="wsm-error">{error}</p>}

          <button className="wsm-btn wsm-btn-primary" onClick={handleImport}>
            📥 Import Wallet
          </button>

          <p className="wsm-notice">🔒 Your keys never leave your device. Everything is encrypted locally.</p>
        </div>
      </div>
    );
  }

  // ── Choice screen (default) ───────────────────────────────────────────────

  return (
    <div className="wsm-overlay" onClick={onClose}>
      <div className="wsm-modal" onClick={e => e.stopPropagation()}>
        <button className="wsm-close" onClick={onClose}>✕</button>

        <div className="wsm-header">
          <div className="wsm-logo">⚡</div>
          <h2>Get Started with CIVITAS</h2>
          <p className="wsm-sub">Choose how you want to access your wallet.</p>
        </div>

        <div className="wsm-options">
          <button
            className="wsm-option-card wsm-option-create"
            onClick={() => { setScreen('reveal'); onCreateWallet(null); /* triggers generation */ }}
          >
            <div className="wsm-option-icon">✨</div>
            <div className="wsm-option-text">
              <h3>Create New Wallet</h3>
              <p>Generate a fresh wallet with a recovery phrase. No MetaMask needed.</p>
            </div>
          </button>

          <button
            className="wsm-option-card wsm-option-import"
            onClick={() => { setScreen('import'); clearError(); }}
          >
            <div className="wsm-option-icon">📥</div>
            <div className="wsm-option-text">
              <h3>Import Existing Wallet</h3>
              <p>Restore from a 12-word seed phrase or private key.</p>
            </div>
          </button>

          {hasMetaMask && (
            <button className="wsm-option-card wsm-option-metamask" onClick={onMetaMask}>
              <div className="wsm-option-icon">🦊</div>
              <div className="wsm-option-text">
                <h3>Connect MetaMask</h3>
                <p>Use an existing MetaMask or browser wallet extension.</p>
              </div>
            </button>
          )}
        </div>

        <p className="wsm-notice">🔒 Self-custodial — CIVITAS never stores or sees your private keys.</p>
      </div>
    </div>
  );
}
