/**
 * walletService.js
 * Handles in-platform wallet creation, import, encryption, and recovery.
 * Works entirely with ethers v6 — no MetaMask required.
 */
import { ethers } from 'ethers';

const STORAGE_KEY = 'civitas_encrypted_wallet';
const WALLET_TYPE_KEY = 'civitas_wallet_type'; // 'software' | 'metamask'

class WalletService {
  // ── Create ────────────────────────────────────────────────────────────────

  /**
   * Generate a brand-new random wallet.
   * Returns { wallet, mnemonic, address }
   */
  createRandomWallet() {
    const wallet = ethers.Wallet.createRandom();
    return {
      wallet,
      mnemonic: wallet.mnemonic.phrase,
      address: wallet.address,
    };
  }

  /**
   * Import wallet from a 12 or 24-word BIP-39 mnemonic phrase.
   */
  importFromMnemonic(phrase) {
    try {
      const cleaned = phrase.trim().toLowerCase().replace(/\s+/g, ' ');
      const wallet = ethers.Wallet.fromPhrase(cleaned);
      return { wallet, address: wallet.address };
    } catch {
      throw new Error('Invalid mnemonic phrase. Please check your words and try again.');
    }
  }

  /**
   * Import wallet from a raw private key (with or without 0x prefix).
   */
  importFromPrivateKey(rawKey) {
    try {
      const key = rawKey.trim().startsWith('0x') ? rawKey.trim() : `0x${rawKey.trim()}`;
      const wallet = new ethers.Wallet(key);
      return { wallet, address: wallet.address };
    } catch {
      throw new Error('Invalid private key. Please check and try again.');
    }
  }

  // ── Encrypt / Decrypt ─────────────────────────────────────────────────────

  /**
   * Encrypt an ethers Wallet with a password → JSON keystore string.
   * Also saves to localStorage.
   * @param {ethers.Wallet} wallet
   * @param {string} password
   * @param {function} onProgress  (optional) progress callback 0–1
   */
  async encryptAndSave(wallet, password, onProgress) {
    const json = await wallet.encrypt(password, {}, onProgress);
    localStorage.setItem(STORAGE_KEY, json);
    localStorage.setItem(WALLET_TYPE_KEY, 'software');
    return json;
  }

  /**
   * Decrypt the stored JSON keystore with a password.
   * Returns an ethers.Wallet instance (without provider).
   */
  async decryptWallet(password) {
    const json = this.getStoredEncryptedWallet();
    if (!json) throw new Error('No wallet found in this browser. Please create or import one.');
    return ethers.Wallet.fromEncryptedJson(json, password);
  }

  // ── Storage helpers ───────────────────────────────────────────────────────

  getStoredEncryptedWallet() {
    return localStorage.getItem(STORAGE_KEY);
  }

  hasStoredWallet() {
    return !!this.getStoredEncryptedWallet();
  }

  isSoftwareWallet() {
    return localStorage.getItem(WALLET_TYPE_KEY) === 'software';
  }

  clearStoredWallet() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(WALLET_TYPE_KEY);
    localStorage.removeItem('walletAddress');
  }

  // ── Validation helpers ────────────────────────────────────────────────────

  validatePassword(password) {
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters.');
    }
  }

  validateMnemonic(phrase) {
    try {
      const cleaned = phrase.trim().toLowerCase().replace(/\s+/g, ' ');
      ethers.Wallet.fromPhrase(cleaned);
      return true;
    } catch {
      return false;
    }
  }

  validatePrivateKey(key) {
    try {
      const k = key.trim().startsWith('0x') ? key.trim() : `0x${key.trim()}`;
      new ethers.Wallet(k);
      return true;
    } catch {
      return false;
    }
  }
}

export default new WalletService();
