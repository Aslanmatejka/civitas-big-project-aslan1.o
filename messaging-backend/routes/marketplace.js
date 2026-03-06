'use strict';
const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const store   = require('../services/store');

// ─── Persisted stores (survive restart via store.json) ───────────────────────
const mp = store.collection('marketplace');
if (!mp.listings)   mp.listings  = [];
if (!mp.orders)     mp.orders    = [];
if (!mp.listingSeq) mp.listingSeq = mp.listings.length ? Math.max(...mp.listings.map(l => l.listingId)) + 1 : 1;
if (!mp.orderSeq)   mp.orderSeq   = mp.orders.length   ? Math.max(...mp.orders.map(o => o.orderId))   + 1 : 1;

// Aliases for minimal code change below
const listings  = mp.listings;
const orders    = mp.orders;

const now = () => new Date().toISOString();
const hash = (str) => crypto.createHash('sha256').update(str).digest('hex');

function applyListingFilters(all, q) {
  let result = [...all];
  const { category, status = 'active', minPrice, maxPrice, seller, search } = q;
  if (category)  result = result.filter(l => l.category === category);
  if (status)    result = result.filter(l => l.status   === status);
  if (seller)    result = result.filter(l => l.seller.address.toLowerCase() === seller.toLowerCase());
  if (minPrice)  result = result.filter(l => l.price >= parseFloat(minPrice));
  if (maxPrice)  result = result.filter(l => l.price <= parseFloat(maxPrice));
  if (search) {
    const re = new RegExp(search, 'i');
    result = result.filter(l => re.test(l.title) || re.test(l.description) || l.tags.some(t => re.test(t)));
  }
  if (status === 'active') {
    result = result.filter(l => !l.expiresAt || new Date(l.expiresAt) > new Date());
  }
  return result;
}

// POST /listings/create
router.post('/listings/create', (req, res) => {
  const { sellerAddress, title, description, price, category, image, tags, metadata, expiresAt } = req.body;
  if (!sellerAddress || !title || !description || price === undefined || !category) {
    return res.status(400).json({ error: 'Missing required fields', required: ['sellerAddress','title','description','price','category'] });
  }
  const listing = {
    listingId: mp.listingSeq++,
    title, description,
    price:    parseFloat(price),
    seller:   { address: sellerAddress, name: 'Anonymous', reputation: 0 },
    category,
    image:    image || '📦',
    tags:     tags     || [],
    metadata: metadata || {},
    status:   'active',
    views:    0,
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    createdAt: now(),
    contentHash: hash(sellerAddress + title + price + now())
  };
  listings.push(listing);
  res.json({ success: true, listing });
});

// GET /listings
router.get('/listings', (req, res) => {
  const { sortBy = 'createdAt', sortOrder = 'desc', limit = 50, skip = 0 } = req.query;
  let result = applyListingFilters(listings, req.query);
  result.sort((a, b) => {
    const av = a[sortBy] ?? a.createdAt;
    const bv = b[sortBy] ?? b.createdAt;
    return sortOrder === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });
  const total  = result.length;
  const sliced = result.slice(parseInt(skip), parseInt(skip) + parseInt(limit));
  res.json({ success: true, listings: sliced, pagination: { total, limit: parseInt(limit), skip: parseInt(skip), hasMore: total > parseInt(skip) + sliced.length } });
});

// GET /listings/:id
router.get('/listings/:listingId', (req, res) => {
  const { incrementView = 'false' } = req.query;
  const listing = listings.find(l => l.listingId === parseInt(req.params.listingId));
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (incrementView === 'true' && listing.status === 'active') listing.views++;
  res.json({ success: true, listing });
});

// PUT /listings/:id
router.put('/listings/:listingId', (req, res) => {
  const { sellerAddress, title, description, price, category, image, tags, status } = req.body;
  const listing = listings.find(l => l.listingId === parseInt(req.params.listingId));
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.seller.address.toLowerCase() !== sellerAddress.toLowerCase())
    return res.status(403).json({ error: 'Not authorized' });
  if (title)       listing.title       = title;
  if (description) listing.description = description;
  if (price !== undefined) listing.price = parseFloat(price);
  if (category)    listing.category    = category;
  if (image)       listing.image       = image;
  if (tags)        listing.tags        = tags;
  if (status)      listing.status      = status;
  listing.contentHash = hash(sellerAddress + listing.title + listing.price + now());
  res.json({ success: true, listing });
});

// DELETE /listings/:id
router.delete('/listings/:listingId', (req, res) => {
  const { sellerAddress } = req.body;
  const listing = listings.find(l => l.listingId === parseInt(req.params.listingId));
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.seller.address.toLowerCase() !== sellerAddress.toLowerCase())
    return res.status(403).json({ error: 'Not authorized' });
  listing.status = 'cancelled';
  res.json({ success: true, message: 'Listing cancelled' });
});

// POST /orders/create
router.post('/orders/create', (req, res) => {
  const { listingId: lid, buyerAddress, transactionHash, blockNumber } = req.body;
  if (!lid || !buyerAddress || !transactionHash)
    return res.status(400).json({ error: 'Missing required fields', required: ['listingId','buyerAddress','transactionHash'] });
  const listing = listings.find(l => l.listingId === parseInt(lid));
  if (!listing)  return res.status(404).json({ error: 'Listing not found' });
  if (listing.status !== 'active') return res.status(400).json({ error: 'Listing is not active' });
  if (listing.seller.address.toLowerCase() === buyerAddress.toLowerCase())
    return res.status(400).json({ error: 'Cannot purchase your own listing' });
  const order = {
    orderId: mp.orderSeq++,
    listingId: listing.listingId,
    buyer:   { address: buyerAddress, name: 'Anonymous' },
    seller:  { address: listing.seller.address, name: listing.seller.name },
    listing: { title: listing.title, price: listing.price, category: listing.category },
    status: 'paid',
    escrow: { amount: listing.price, released: false },
    payment: { transactionHash, blockNumber, timestamp: now() },
    dispute: null, createdAt: now()
  };
  orders.push(order);
  listing.status = 'sold';
  res.json({ success: true, order });
});

// GET /orders
router.get('/orders', (req, res) => {
  const { userAddress, type = 'all', status, limit = 50, skip = 0 } = req.query;
  if (!userAddress) return res.status(400).json({ error: 'userAddress is required' });
  let result = orders.filter(o => {
    if (type === 'purchases') return o.buyer.address.toLowerCase() === userAddress.toLowerCase();
    if (type === 'sales')     return o.seller.address.toLowerCase() === userAddress.toLowerCase();
    return o.buyer.address.toLowerCase() === userAddress.toLowerCase() ||
           o.seller.address.toLowerCase() === userAddress.toLowerCase();
  });
  if (status) result = result.filter(o => o.status === status);
  result.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const total  = result.length;
  const sliced = result.slice(parseInt(skip), parseInt(skip) + parseInt(limit));
  res.json({ success: true, orders: sliced, pagination: { total, limit: parseInt(limit), skip: parseInt(skip), hasMore: total > parseInt(skip) + sliced.length } });
});

// GET /orders/:id
router.get('/orders/:orderId', (req, res) => {
  const order = orders.find(o => o.orderId === parseInt(req.params.orderId));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ success: true, order });
});

// POST /orders/:id/complete
router.post('/orders/:orderId/complete', (req, res) => {
  const { buyerAddress, transactionHash } = req.body;
  const order = orders.find(o => o.orderId === parseInt(req.params.orderId));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.buyer.address.toLowerCase() !== buyerAddress.toLowerCase()) return res.status(403).json({ error: 'Not authorized' });
  if (order.status !== 'paid') return res.status(400).json({ error: 'Order cannot be completed' });
  order.status = 'completed';
  order.escrow.released = true;
  order.completedAt = now();
  order.completionTx = transactionHash;
  res.json({ success: true, order });
});

// POST /orders/:id/dispute
router.post('/orders/:orderId/dispute', (req, res) => {
  const { userAddress, reason } = req.body;
  const order = orders.find(o => o.orderId === parseInt(req.params.orderId));
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const isBuyer  = order.buyer.address.toLowerCase()  === userAddress.toLowerCase();
  const isSeller = order.seller.address.toLowerCase() === userAddress.toLowerCase();
  if (!isBuyer && !isSeller) return res.status(403).json({ error: 'Not authorized' });
  if (['completed','refunded'].includes(order.status)) return res.status(400).json({ error: 'Order already finalized' });
  order.status = 'disputed';
  order.dispute = { reason, raisedBy: userAddress, raisedAt: now() };
  res.json({ success: true, order });
});

// GET /sellers/:addr/stats
router.get('/sellers/:sellerAddress/stats', (req, res) => {
  const addr = req.params.sellerAddress.toLowerCase();
  const sellerOrders = orders.filter(o => o.seller.address.toLowerCase() === addr);
  const completed    = sellerOrders.filter(o => o.status === 'completed');
  const activeCount  = listings.filter(l => l.seller.address.toLowerCase() === addr && l.status === 'active').length;
  res.json({
    success: true,
    stats: {
      totalOrders:     sellerOrders.length,
      completedOrders: completed.length,
      disputedOrders:  sellerOrders.filter(o => o.status === 'disputed').length,
      totalRevenue:    completed.reduce((s, o) => s + o.listing.price, 0),
      completionRate:  sellerOrders.length ? ((completed.length / sellerOrders.length) * 100).toFixed(1) : 0,
      activeListings:  activeCount
    }
  });
});

module.exports = router;
