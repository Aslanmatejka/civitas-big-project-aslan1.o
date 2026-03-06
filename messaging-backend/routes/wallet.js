/**
 * Wallet Route — Decentralized
 * Wallet session metadata is cached in the in-memory store.
 * Actual balances and transactions are read from the blockchain by the client.
 * This backend only caches the last-known values for convenience.
 */
const express = require('express');
const router  = express.Router();
const store   = require('../services/store');

// Connect / register wallet session
router.post('/connect', (req, res) => {
  const { address, balance, name } = req.body;
  if (!address) return res.status(400).json({ error: 'address required' });

  const user = store.upsertUser(address, {
    balance: balance || '0',
    ...(name && { name }),
    lastActive: Date.now()
  });
  store.setOnline(address);

  console.log('✅ Wallet connected:', address.toLowerCase());
  res.json({
    message: 'Wallet connected',
    wallet: { address: address.toLowerCase(), balance: user.balance || '0', name: user.name }
  });
});

// Get wallet info
router.get('/:address', (req, res) => {
  const u = store.getUser(req.params.address);
  res.json({
    wallet: {
      address: req.params.address.toLowerCase(),
      balance: u?.balance || '0',
      name: u?.name,
      isOnline: store.isOnline(req.params.address),
      lastActive: u?.updatedAt
    }
  });
});

// Update balance (client calls this after reading from blockchain)
router.put('/:address/balance', (req, res) => {
  const { balance, balanceUSD } = req.body;
  store.upsertUser(req.params.address, { balance, balanceUSD });
  res.json({ message: 'Balance updated', balance, balanceUSD });
});

// Transactions — source of truth is blockchain; these are read-only stubs
router.get('/:address/transactions', (req, res) => res.json({ transactions: [] }));
router.post('/:address/transactions', (req, res) => res.status(201).json({ ok: true, tx: req.body }));
router.get('/transactions/:txHash', (req, res) => res.json({ txHash: req.params.txHash }));

// NFTs and DeFi — simulated in-memory DeFi protocol data
router.get('/:address/nfts', (req, res) => res.json({ nfts: [] }));

/**
 * DeFi positions route.
 *
 * Returns a realistic snapshot of four major DeFi protocols with:
 *  - Protocol metadata (name, category, logo, website)
 *  - Current APY / yield rates
 *  - A simulated user position derived from the wallet address
 *    (seeded so the same address always gets the same "position")
 *
 * In a production environment this data would come from on-chain calls
 * (ethers.js contract.balanceOf, protocol subgraph queries, etc.).
 */
router.get('/:address/defi', (req, res) => {
  const address = req.params.address.toLowerCase();

  // Deterministic pseudo-position based on last 4 hex chars of address
  const seed = parseInt(address.slice(-4), 16) || 1000;
  const pos  = (base) => ((seed * base) % 10000) / 100; // 0–100 range

  const protocols = [
    {
      id:          'aave-v3',
      name:        'Aave V3',
      category:    'Lending',
      website:     'https://aave.com',
      logo:        '🏦',
      chain:       'Ethereum',
      tvl:         '$8.4B',
      apy: {
        supply:    3.42,  // % APY for supplying USDC
        borrow:    4.81,  // % APY for borrowing ETH
        staking:   6.10,  // % APY for AAVE staking
      },
      userPosition: {
        supplied:  pos(73).toFixed(2),
        suppliedToken: 'USDC',
        borrowed:  pos(31).toFixed(2),
        borrowedToken: 'ETH',
        healthFactor: (1.5 + pos(1) / 100).toFixed(2),
        netAPY:    2.40,
      },
    },
    {
      id:          'uniswap-v3',
      name:        'Uniswap V3',
      category:    'DEX',
      website:     'https://uniswap.org',
      logo:        '🦄',
      chain:       'Ethereum',
      tvl:         '$3.1B',
      apy: {
        lpFees:    12.8,  // % APY for CIV/ETH 0.3% pool
        uni:        5.5,  // % APY for UNI staking
      },
      userPosition: {
        poolShare:  (pos(5) / 10000).toFixed(6),
        pool:       'CIV/ETH 0.3%',
        tokenA:     (pos(50)).toFixed(4),
        tokenASymbol: 'CIV',
        tokenB:     (pos(2)).toFixed(6),
        tokenBSymbol: 'ETH',
        uncollectedFees: (pos(1) / 10).toFixed(4),
        feeToken:   'USDC',
      },
    },
    {
      id:          'compound-v3',
      name:        'Compound V3',
      category:    'Savings',
      website:     'https://compound.finance',
      logo:        '💰',
      chain:       'Ethereum',
      tvl:         '$1.2B',
      apy: {
        supply:    4.10,
        comp:      2.30,
        total:     6.40,
      },
      userPosition: {
        supplied:  pos(89).toFixed(2),
        suppliedToken: 'ETH',
        earned:    (pos(2) / 10).toFixed(4),
        earnedToken: 'COMP',
      },
    },
    {
      id:          'curve-finance',
      name:        'Curve Finance',
      category:    'Stableswap',
      website:     'https://curve.fi',
      logo:        '〰️',
      chain:       'Ethereum',
      tvl:         '$2.8B',
      apy: {
        base:      1.80,
        crv:       4.20,
        total:     6.00,
      },
      userPosition: {
        lpTokens:   (pos(120)).toFixed(2),
        pool:       '3pool (DAI/USDC/USDT)',
        stakedCRV:  (pos(40)).toFixed(2),
        vestedCRV:  (pos(10)).toFixed(2),
        claimable:  (pos(3) / 10).toFixed(4),
      },
    },
  ];

  const totalValueUSD = protocols.reduce((sum, p) => {
    const supplied  = parseFloat(p.userPosition.supplied  || p.userPosition.lpTokens || 0);
    return sum + supplied;
  }, 0);

  res.json({
    address,
    totalValueUSD: totalValueUSD.toFixed(2),
    protocols,
    lastUpdated: new Date().toISOString(),
  });
});

// Tokens — returns CIV token info; actual balance is on-chain
router.get('/:address/tokens', (req, res) => {
  const u = require('../services/store').getUser(req.params.address);
  res.json({ tokens: [
    {
      symbol: 'CIV',
      name: 'CIVITAS Token',
      balance: u?.balance || '0',
      balanceUSD: u?.balanceUSD || '0',
      contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      decimals: 18,
      logo: '\u26aa'
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      balance: '0',
      balanceUSD: '0',
      contractAddress: null,
      decimals: 18,
      logo: '\u26ab'
    }
  ] });
});

router.post('/:address/disconnect', (req, res) => {
  require('../services/store').setOffline(req.params.address);
  res.json({ message: 'Wallet disconnected' });
});

module.exports = router;
