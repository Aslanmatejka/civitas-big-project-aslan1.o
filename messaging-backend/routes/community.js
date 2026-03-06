/**
 * Community routes – fully in-memory, no MongoDB.
 *
 * Ledger-verified content:
 *   Every post stores a `contentHash` (SHA-256 of the content string).
 *   Clients can independently verify the hash; on-chain anchoring (via IPFS CID
 *   or a DIDRegistry attestation) can be wired to the `anchorTx` field.
 *
 * Data model:
 *   Post   { id, authorAddress, authorName, content, contentHash, mediaUrl, tags,
 *            visibility, likes, commentCount, anchorTx, anchorCID, createdAt, updatedAt }
 *   Comment{ id, postId, authorAddress, content, contentHash, likes, createdAt }
 *   Follow { id, follower, following, createdAt }
 */

const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const store   = require('../services/store');

// ── Persisted store (survives restart via store.json) ────────────────────────
const cm = store.collection('community');
if (!cm.posts)        cm.posts        = {};
if (!cm.comments)     cm.comments     = {};
if (!cm.follows)      cm.follows      = {};
if (!cm.postLikes)    cm.postLikes    = {};
if (!cm.commentLikes) cm.commentLikes = {};
if (!cm.postSeq)      cm.postSeq      = 0;
if (!cm.commentSeq)   cm.commentSeq   = 0;

// Map-like wrappers over the persisted objects
const posts        = cm.posts;
const comments     = cm.comments;
const follows      = cm.follows;
const postLikes    = cm.postLikes;
const commentLikes = cm.commentLikes;

// ── Helpers ──────────────────────────────────────────────────────────────────

const sha256 = (str) => crypto.createHash('sha256').update(str, 'utf8').digest('hex');

const mkPost = ({ authorAddress, authorName, content, mediaUrl, tags, visibility, anchorTx, anchorCID }) => {
  const id = ++cm.postSeq;
  return {
    id,
    authorAddress: authorAddress.toLowerCase(),
    authorName:    authorName || 'Anonymous',
    content,
    contentHash:   sha256(content),
    mediaUrl:      mediaUrl  || null,
    tags:          (tags || []).map(t => t.toLowerCase()),
    visibility:    visibility || 'public',
    likes:         0,
    commentCount:  0,
    anchorTx:      anchorTx  || null,
    anchorCID:     anchorCID || null,
    verified:      !!(anchorTx || anchorCID),
    createdAt:     Date.now(),
    updatedAt:     Date.now(),
  };
};

const mkComment = ({ postId, authorAddress, content }) => {
  const id = ++cm.commentSeq;
  return {
    id,
    postId:        Number(postId),
    authorAddress: authorAddress.toLowerCase(),
    content,
    contentHash:   sha256(content),
    likes:         0,
    createdAt:     Date.now(),
  };
};

// ── POST ENDPOINTS ───────────────────────────────────────────────────────────

router.post('/posts/create', (req, res) => {
  const { authorAddress, content } = req.body;
  if (!authorAddress || !content) return res.status(400).json({ error: 'authorAddress and content are required' });
  const post = mkPost(req.body);
  posts[post.id] = post;
  store.save();
  res.status(201).json({ success: true, post });
});

router.get('/posts', (req, res) => {
  const { authorAddress, tag, sortBy = 'recent', limit = 20, skip = 0 } = req.query;
  let list = Object.values(posts).filter(p => p.visibility === 'public');
  if (authorAddress) list = list.filter(p => p.authorAddress === authorAddress.toLowerCase());
  if (tag)           list = list.filter(p => p.tags.includes(tag.toLowerCase()));
  list = sortBy === 'popular'
    ? list.sort((a, b) => (b.likes + b.commentCount) - (a.likes + a.commentCount))
    : list.sort((a, b) => b.createdAt - a.createdAt);
  const total = list.length;
  res.json({ success: true, posts: list.slice(Number(skip), Number(skip) + Number(limit)), total });
});

router.get('/posts/:id', (req, res) => {
  const post = posts[req.params.id];
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json({ success: true, post });
});

router.put('/posts/:id', (req, res) => {
  const post = posts[req.params.id];
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.authorAddress !== req.body.authorAddress?.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });
  const { content, anchorTx, anchorCID } = req.body;
  if (content)   { post.content = content; post.contentHash = sha256(content); }
  if (anchorTx)  post.anchorTx  = anchorTx;
  if (anchorCID) post.anchorCID = anchorCID;
  post.verified  = !!(post.anchorTx || post.anchorCID);
  post.updatedAt = Date.now();
  store.save();
  res.json({ success: true, post });
});

router.delete('/posts/:id', (req, res) => {
  const post = posts[req.params.id];
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.authorAddress !== req.body.authorAddress?.toLowerCase()) return res.status(403).json({ error: 'Forbidden' });
  delete posts[req.params.id];
  store.save();
  res.json({ success: true });
});

router.post('/posts/:id/like', (req, res) => {
  const post = posts[req.params.id];
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const key = `${req.params.id}:${req.body.userAddress?.toLowerCase()}`;
  if (postLikes[key]) { post.likes--; delete postLikes[key]; }
  else                { post.likes++; postLikes[key] = true; }
  store.save();
  res.json({ success: true, likes: post.likes, liked: !!postLikes[key] });
});

// Verify content integrity (ledger-verified)
router.get('/posts/:id/verify', (req, res) => {
  const post = posts[req.params.id];
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const freshHash = sha256(post.content);
  res.json({
    postId: post.id, contentHash: post.contentHash,
    freshHash, hashMatches: freshHash === post.contentHash,
    anchorTx: post.anchorTx, anchorCID: post.anchorCID, verified: post.verified,
  });
});

// ── COMMENT ENDPOINTS ────────────────────────────────────────────────────────

router.post('/posts/:id/comments', (req, res) => {
  const post = posts[req.params.id];
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const { authorAddress, content } = req.body;
  if (!authorAddress || !content) return res.status(400).json({ error: 'authorAddress and content are required' });
  const c = mkComment({ postId: req.params.id, authorAddress, content });
  comments[c.id] = c;
  post.commentCount++;
  store.save();
  res.status(201).json({ success: true, comment: c });
});

router.get('/posts/:id/comments', (req, res) => {
  const postId = Number(req.params.id);
  const list   = Object.values(comments).filter(c => c.postId === postId).sort((a, b) => a.createdAt - b.createdAt);
  res.json({ success: true, comments: list });
});

router.post('/comments/:id/like', (req, res) => {
  const c = comments[req.params.id];
  if (!c) return res.status(404).json({ error: 'Comment not found' });
  const key = `${req.params.id}:${req.body.userAddress?.toLowerCase()}`;
  if (commentLikes[key]) { c.likes--; delete commentLikes[key]; }
  else                   { c.likes++; commentLikes[key] = true; }
  store.save();
  res.json({ success: true, likes: c.likes });
});

// ── FOLLOW ENDPOINTS ─────────────────────────────────────────────────────────

router.post('/follow', (req, res) => {
  const { followerAddress, followingAddress } = req.body;
  if (!followerAddress || !followingAddress) return res.status(400).json({ error: 'followerAddress and followingAddress required' });
  const key = `${followerAddress.toLowerCase()}:${followingAddress.toLowerCase()}`;
  if (follows[key]) { delete follows[key]; store.save(); return res.json({ success: true, following: false }); }
  follows[key] = { follower: followerAddress.toLowerCase(), following: followingAddress.toLowerCase(), createdAt: Date.now() };
  store.save();
  res.json({ success: true, following: true });
});

router.get('/followers/:address', (req, res) => {
  const addr = req.params.address.toLowerCase();
  const list = Object.values(follows).filter(f => f.following === addr);
  res.json({ followers: list, count: list.length });
});

router.get('/following/:address', (req, res) => {
  const addr = req.params.address.toLowerCase();
  const list = Object.values(follows).filter(f => f.follower === addr);
  res.json({ following: list, count: list.length });
});

router.get('/is-following', (req, res) => {
  const { follower, following } = req.query;
  if (!follower || !following) return res.status(400).json({ error: 'follower and following required' });
  res.json({ following: !!follows[`${follower.toLowerCase()}:${following.toLowerCase()}`] });
});

// ── MISC ─────────────────────────────────────────────────────────────────────

router.get('/trending-tags', (req, res) => {
  const counts = {};
  for (const p of Object.values(posts)) for (const t of p.tags) counts[t] = (counts[t] || 0) + 1;
  const sorted = Object.entries(counts).sort(([,a],[,b]) => b-a).slice(0,20).map(([tag,count])=>({tag,count}));
  res.json({ tags: sorted });
});

router.get('/stats', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalPosts:    Object.keys(posts).length,
      totalComments: Object.keys(comments).length,
      totalFollows:  Object.keys(follows).length,
      verifiedPosts: Object.values(posts).filter(p => p.verified).length,
    }
  });
});

module.exports = router;
