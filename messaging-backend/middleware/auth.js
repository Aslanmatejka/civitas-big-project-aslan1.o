/**
 * Wallet-based authentication middleware.
 *
 * Every request that mutates user-scoped data must include:
 *   Header  x-wallet-address   — the caller's wallet address
 *
 * Optional (for stronger verification):
 *   Header  x-wallet-signature — EIP-191 signature of a challenge or timestamp
 *   Header  x-wallet-message   — the signed message payload
 *
 * When both optional headers are present the middleware will verify the
 * signature using ethers.js and reject impersonation attempts.
 *
 * For read-only / public routes that don't need auth, skip this middleware
 * or use `optionalAuth` which attaches walletAddress if present but
 * doesn't reject the request.
 */

const { ethers } = require('ethers');

/**
 * Strict auth — rejects if x-wallet-address is missing.
 * If a signature is provided, verifies it.
 */
function requireAuth(req, res, next) {
  const walletAddress = req.headers['x-wallet-address']
    || req.body?.walletAddress
    || req.query?.walletAddress;

  if (!walletAddress) {
    return res.status(401).json({ error: 'Authentication required — provide x-wallet-address header' });
  }

  const normalized = walletAddress.toLowerCase();

  // Optional signature verification
  const signature = req.headers['x-wallet-signature'];
  const message   = req.headers['x-wallet-message'];

  if (signature && message) {
    try {
      const recovered = ethers.verifyMessage(message, signature).toLowerCase();
      if (recovered !== normalized) {
        return res.status(403).json({ error: 'Signature does not match wallet address' });
      }
    } catch (err) {
      return res.status(403).json({ error: 'Invalid signature' });
    }
  }

  // Attach to request for downstream handlers
  req.walletAddress = normalized;
  next();
}

/**
 * Optional auth — attaches walletAddress if present, never rejects.
 */
function optionalAuth(req, res, next) {
  const walletAddress = req.headers['x-wallet-address']
    || req.body?.walletAddress
    || req.query?.walletAddress;

  if (walletAddress) {
    req.walletAddress = walletAddress.toLowerCase();
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
