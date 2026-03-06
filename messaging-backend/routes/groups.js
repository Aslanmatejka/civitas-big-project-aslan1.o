/**
 * Groups Route — Decentralized
 * Group metadata stored in the in-memory persistent store.
 * Group messaging uses XMTP group conversations.
 */
const express = require('express');
const router  = express.Router();
const store   = require('../services/store');

// Get groups for user
router.get('/', (req, res) => {
  const { walletAddress } = req.query;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress required' });
  const groups = store.getGroupsForUser(walletAddress);
  res.json({ success: true, groups });
});

// Get single group
router.get('/:groupId', (req, res) => {
  const group = store.getGroup(req.params.groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  res.json({ success: true, group });
});

// Create group
router.post('/create', (req, res) => {
  const { creator, name, icon, description, members } = req.body;
  if (!creator || !name || !members || members.length < 2)
    return res.status(400).json({ error: 'creator, name and at least 2 members required' });

  const allMembers = members.map(m => (typeof m === 'string' ? m : m.walletAddress).toLowerCase());
  if (!allMembers.includes(creator.toLowerCase())) allMembers.unshift(creator.toLowerCase());

  const group = store.createGroup({
    name,
    icon: icon || '👥',
    description: description || '',
    creator: creator.toLowerCase(),
    admins: [creator.toLowerCase()],
    members: allMembers
  });

  res.status(201).json({ success: true, message: 'Group created', group });
});

// Update group
router.put('/:groupId', (req, res) => {
  const { walletAddress, name, icon, description } = req.body;
  const group = store.getGroup(req.params.groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (!group.admins.includes(walletAddress?.toLowerCase()))
    return res.status(403).json({ error: 'Admins only' });
  const updated = store.updateGroup(req.params.groupId, {
    ...(name && { name }), ...(icon && { icon }), ...(description !== undefined && { description })
  });
  res.json({ success: true, message: 'Group updated', group: updated });
});

// Add members
router.post('/:groupId/members', (req, res) => {
  const { walletAddress, newMembers } = req.body;
  const group = store.getGroup(req.params.groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (!group.admins.includes(walletAddress?.toLowerCase()))
    return res.status(403).json({ error: 'Admins only' });

  const toAdd = (newMembers || []).map(m => (typeof m === 'string' ? m : m.walletAddress).toLowerCase());
  const merged = [...new Set([...group.members, ...toAdd])];
  const updated = store.updateGroup(req.params.groupId, { members: merged });
  res.json({ success: true, message: 'Members added', group: updated });
});

// Remove member
router.delete('/:groupId/members/:memberAddress', (req, res) => {
  const { walletAddress } = req.query;
  const { groupId, memberAddress } = req.params;
  const group = store.getGroup(groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  const isAdmin = group.admins.includes(walletAddress?.toLowerCase());
  const isSelf  = walletAddress?.toLowerCase() === memberAddress.toLowerCase();
  if (!isAdmin && !isSelf) return res.status(403).json({ error: 'Unauthorized' });

  const updated = store.updateGroup(groupId, {
    members: group.members.filter(m => m !== memberAddress.toLowerCase()),
    admins:  group.admins.filter(a => a !== memberAddress.toLowerCase())
  });
  res.json({ success: true, message: 'Member removed', group: updated });
});

// Leave group
router.post('/:groupId/leave', (req, res) => {
  const { walletAddress } = req.body;
  const { groupId } = req.params;
  const group = store.getGroup(groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  let members = group.members.filter(m => m !== walletAddress?.toLowerCase());
  let admins  = group.admins.filter(a => a !== walletAddress?.toLowerCase());

  if (members.length === 0) { store.deleteGroup(groupId); return res.json({ message: 'Group deleted' }); }
  if (admins.length === 0) admins = [members[0]];

  const updated = store.updateGroup(groupId, { members, admins });
  res.json({ message: 'Left group', group: updated });
});

module.exports = router;