import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth API
export const authApi = {
  register: (walletAddress, name) => 
    api.post('/auth/register', { walletAddress, name }),
  
  logout: (walletAddress) => 
    api.post('/auth/logout', { walletAddress })
};

// Messages API
export const messagesApi = {
  getMessages: (user1, user2, groupId, limit = 50, before) => 
    api.get('/messages', { params: { user1, user2, groupId, limit, before } }),
  
  getUnreadCount: (walletAddress) => 
    api.get('/messages/unread-count', { params: { walletAddress } }),
  
  getStarredMessages: (walletAddress) => 
    api.get('/messages/starred', { params: { walletAddress } }),
  
  searchMessages: (walletAddress, query, groupId) => 
    api.get('/messages/search', { params: { walletAddress, query, groupId } }),
  
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Contacts API
export const contactsApi = {
  getContacts: (walletAddress) => 
    api.get('/contacts', { params: { walletAddress } }),
  
  addContact: (walletAddress, contactAddress, contactName) => 
    api.post('/contacts/add', { walletAddress, contactAddress, contactName }),
  
  removeContact: (walletAddress, contactAddress) => 
    api.delete(`/contacts/${contactAddress}`, { params: { walletAddress } }),
  
  blockUser: (walletAddress, blockAddress) => 
    api.post('/contacts/block', { walletAddress, blockAddress }),

  searchUsers: (query, walletAddress) =>
    api.get('/contacts/search', { params: { query, walletAddress } })
};

// Groups API
export const groupsApi = {
  getGroups: (walletAddress) => 
    api.get('/groups', { params: { walletAddress } }),
  
  getGroup: (groupId) => 
    api.get(`/groups/${groupId}`),
  
  createGroup: (creator, name, icon, description, members) => 
    api.post('/groups/create', { creator, name, icon, description, members }),
  
  updateGroup: (groupId, walletAddress, name, icon, description) => 
    api.put(`/groups/${groupId}`, { walletAddress, name, icon, description }),
  
  addMembers: (groupId, walletAddress, newMembers) => 
    api.post(`/groups/${groupId}/members`, { walletAddress, newMembers }),
  
  removeMember: (groupId, memberAddress, walletAddress) => 
    api.delete(`/groups/${groupId}/members/${memberAddress}`, { 
      params: { walletAddress } 
    }),
  
  leaveGroup: (groupId, walletAddress) => 
    api.post(`/groups/${groupId}/leave`, { walletAddress })
};

// Profile API
export const profileApi = {
  getProfile: (walletAddress) => 
    api.get('/profile', { params: { walletAddress } }),
  
  getAggregatedProfile: (walletAddress) =>
    api.get('/profile/aggregate', { params: { walletAddress } }),
  
  updateProfile: (walletAddress, name, about, avatar) => 
    api.put('/profile', { walletAddress, name, about, avatar }),
  
  uploadProfilePicture: (walletAddress, file) => {
    const formData = new FormData();
    formData.append('picture', file);
    formData.append('walletAddress', walletAddress);
    return api.post('/profile/upload-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  updateSettings: (walletAddress, settings) => 
    api.put('/profile/settings', { walletAddress, settings })
};

// Status API
export const statusApi = {
  getStatuses: (walletAddress) => 
    api.get('/status', { params: { walletAddress } }),
  
  postStatus: (userId, userName, userAvatar, type, content, mediaUrl, backgroundColor) => 
    api.post('/status', { 
      userId, userName, userAvatar, type, content, mediaUrl, backgroundColor 
    }),
  
  viewStatus: (statusId, walletAddress) => 
    api.post(`/status/${statusId}/view`, { walletAddress }),
  
  deleteStatus: (statusId, walletAddress) => 
    api.delete(`/status/${statusId}`, { params: { walletAddress } })
};

// Wallet API
export const walletApi = {
  connectWallet: (address, balance, name) => 
    api.post('/wallet/connect', { address, balance, name }),
  
  getWallet: (address) => 
    api.get(`/wallet/${address}`),
  
  updateBalance: (address, balance, balanceUSD) => 
    api.put(`/wallet/${address}/balance`, { balance, balanceUSD }),
  
  getTransactions: (address, limit = 50, skip = 0, status) => 
    api.get(`/wallet/${address}/transactions`, { 
      params: { limit, skip, status } 
    }),
  
  recordTransaction: (address, txData) => 
    api.post(`/wallet/${address}/transactions`, txData),
  
  getTransaction: (txHash) => 
    api.get(`/wallet/transactions/${txHash}`),
  
  getNFTs: (address) => 
    api.get(`/wallet/${address}/nfts`),
  
  getTokens: (address) => 
    api.get(`/wallet/${address}/tokens`),
  
  disconnectWallet: (address) => 
    api.post(`/wallet/${address}/disconnect`)
};

// Identity API
export const identityApi = {
  // DID Management
  createDID: (walletAddress, did, didDocument) =>
    api.post('/identity/did/create', { walletAddress, did, didDocument }),
  
  getIdentity: (identifier) =>
    api.get(`/identity/identity/${identifier}`),
  
  updateReputation: (identifier, factor, change, reason) =>
    api.post(`/identity/identity/${identifier}/reputation`, { factor, change, reason }),
  
  // Guardian Management
  addGuardian: (identifier, guardianAddress, name) =>
    api.post(`/identity/identity/${identifier}/guardians`, { guardianAddress, name }),
  
  removeGuardian: (identifier, guardianAddress) =>
    api.delete(`/identity/identity/${identifier}/guardians/${guardianAddress}`),
  
  // Credential Management
  issueCredential: (credentialData) =>
    api.post('/identity/credentials/issue', credentialData),
  
  getCredentials: (identifier, type = null, includeRevoked = false) =>
    api.get(`/identity/credentials/holder/${identifier}`, { 
      params: { type, includeRevoked } 
    }),
  
  getCredential: (credentialId) =>
    api.get(`/identity/credentials/${credentialId}`),
  
  revokeCredential: (credentialId, reason) =>
    api.post(`/identity/credentials/${credentialId}/revoke`, { reason }),
  
  shareCredential: (credentialId, targetAddress, targetName, expiresAt) =>
    api.post(`/identity/credentials/${credentialId}/share`, { 
      targetAddress, 
      targetName, 
      expiresAt 
    }),
  
  // Activity Log
  getActivityLog: (identifier, limit = 50, skip = 0, type = null) =>
    api.get(`/identity/activity/${identifier}`, {
      params: { limit, skip, type }
    }),
  
  // Privacy Settings
  updatePrivacySettings: (identifier, settings) =>
    api.put(`/identity/identity/${identifier}/privacy`, settings)
};

// Governance API
export const governanceApi = {
  // Proposal Management
  createProposal: (proposalData) =>
    api.post('/governance/proposals/create', proposalData),
  
  getProposals: (status = null, category = null, limit = 50, skip = 0) =>
    api.get('/governance/proposals', {
      params: { status, category, limit, skip }
    }),
  
  getProposal: (proposalId) =>
    api.get(`/governance/proposals/${proposalId}`),
  
  // Voting
  submitVote: (voteData) =>
    api.post('/governance/votes/submit', voteData),
  
  getUserVotes: (address, limit = 50, skip = 0) =>
    api.get(`/governance/votes/user/${address}`, {
      params: { limit, skip }
    }),
  
  getProposalVotes: (proposalId) =>
    api.get(`/governance/votes/proposal/${proposalId}`)
};

// Marketplace API
export const marketplaceApi = {
  // Listing endpoints
  createListing: async (listingData) => {
    return api.post('/marketplace/listings/create', listingData);
  },

  getListings: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/marketplace/listings?${params}`);
  },

  getListing: async (listingId, incrementView = false) => {
    return api.get(`/marketplace/listings/${listingId}?incrementView=${incrementView}`);
  },

  updateListing: async (listingId, updateData) => {
    return api.put(`/marketplace/listings/${listingId}`, updateData);
  },

  deleteListing: async (listingId, sellerAddress) => {
    return api.delete(`/marketplace/listings/${listingId}`, { data: { sellerAddress } });
  },

  // Order endpoints
  createOrder: async (orderData) => {
    return api.post('/marketplace/orders/create', orderData);
  },

  getOrders: async (userAddress, type = 'all', status = null, limit = 50, skip = 0) => {
    const params = new URLSearchParams({ userAddress, type, limit, skip });
    if (status) params.append('status', status);
    return api.get(`/marketplace/orders?${params.toString()}`);
  },

  getOrder: async (orderId) => {
    return api.get(`/marketplace/orders/${orderId}`);
  },

  completeOrder: async (orderId, buyerAddress, transactionHash) => {
    return api.post(`/marketplace/orders/${orderId}/complete`, { buyerAddress, transactionHash });
  },

  disputeOrder: async (orderId, userAddress, reason) => {
    return api.post(`/marketplace/orders/${orderId}/dispute`, { userAddress, reason });
  },

  // Seller stats
  getSellerStats: async (sellerAddress) => {
    return api.get(`/marketplace/sellers/${sellerAddress}/stats`);
  },
};

// Dashboard API
export const dashboardApi = {
  getPlatformStats: async () => {
    return api.get('/dashboard/stats');
  },

  getUserDashboard: async (address) => {
    return api.get(`/dashboard/user/${address}`);
  },

  getActivityFeed: async (limit = 20, skip = 0) => {
    return api.get(`/dashboard/activity?limit=${limit}&skip=${skip}`);
  },
};

// Community API
export const communityApi = {
  // Posts
  createPost: async (authorAddress, content, mediaUrl = null, mediaType = null, tags = [], visibility = 'public') => {
    return api.post('/community/posts/create', { authorAddress, content, mediaUrl, mediaType, tags, visibility });
  },

  getPosts: async (userAddress = null, authorAddress = null, tag = null, sortBy = 'recent', limit = 20, skip = 0) => {
    const params = new URLSearchParams();
    if (userAddress) params.append('userAddress', userAddress);
    if (authorAddress) params.append('authorAddress', authorAddress);
    if (tag) params.append('tag', tag);
    params.append('sortBy', sortBy);
    params.append('limit', limit);
    params.append('skip', skip);
    return api.get(`/community/posts?${params.toString()}`);
  },

  getPost: async (postId, userAddress = null) => {
    const params = userAddress ? `?userAddress=${userAddress}` : '';
    return api.get(`/community/posts/${postId}${params}`);
  },

  likePost: async (postId, userAddress, action = 'like') => {
    return api.post(`/community/posts/${postId}/like`, { userAddress, action });
  },

  deletePost: async (postId, userAddress) => {
    return api.delete(`/community/posts/${postId}`, { data: { userAddress } });
  },

  // Comments
  createComment: async (postId, authorAddress, content, parentCommentId = null) => {
    return api.post(`/community/posts/${postId}/comments`, { authorAddress, content, parentCommentId });
  },

  getComments: async (postId, limit = 50, skip = 0) => {
    return api.get(`/community/posts/${postId}/comments?limit=${limit}&skip=${skip}`);
  },

  getReplies: async (commentId, limit = 20, skip = 0) => {
    return api.get(`/community/comments/${commentId}/replies?limit=${limit}&skip=${skip}`);
  },

  likeComment: async (commentId, userAddress, action = 'like') => {
    return api.post(`/community/comments/${commentId}/like`, { userAddress, action });
  },

  // Follow
  followUser: async (followerAddress, followingAddress) => {
    return api.post('/community/follow', { followerAddress, followingAddress });
  },

  unfollowUser: async (followerAddress, followingAddress) => {
    return api.post('/community/follow', { followerAddress, followingAddress });
  },

  getFollowers: async (userAddress, limit = 50, skip = 0) => {
    return api.get(`/community/followers/${userAddress}?limit=${limit}&skip=${skip}`);
  },

  getFollowing: async (userAddress, limit = 50, skip = 0) => {
    return api.get(`/community/following/${userAddress}?limit=${limit}&skip=${skip}`);
  },

  isFollowing: async (followerAddress, followingAddress) => {
    return api.get(`/community/is-following?follower=${followerAddress}&following=${followingAddress}`);
  },

  getSocialStats: async (userAddress) => {
    return api.get('/community/stats');
  },
};

// Analytics API
export const analyticsApi = {
  // Overview
  getOverview: async (timeframe = '30d') => {
    return api.get(`/analytics/overview?timeframe=${timeframe}`);
  },

  // Time-series data
  getTransactionTimeSeries: async (period = '30d', interval = 'day') => {
    return api.get(`/analytics/transactions/timeseries?period=${period}&interval=${interval}`);
  },

  getUserTimeSeries: async (period = '30d') => {
    return api.get(`/analytics/users/timeseries?period=${period}`);
  },

  getGovernanceTimeSeries: async (period = '30d') => {
    return api.get(`/analytics/governance/timeseries?period=${period}`);
  },

  getMarketplaceTimeSeries: async (period = '30d') => {
    return api.get(`/analytics/marketplace/timeseries?period=${period}`);
  },

  // Leaderboards
  getReputationLeaderboard: async (limit = 10) => {
    return api.get(`/analytics/leaderboard/reputation?limit=${limit}`);
  },

  getVotersLeaderboard: async (limit = 10) => {
    return api.get(`/analytics/leaderboard/voters?limit=${limit}`);
  },

  getSellersLeaderboard: async (limit = 10) => {
    return api.get(`/analytics/leaderboard/sellers?limit=${limit}`);
  },

  // Category & Distribution
  getGovernanceCategories: async () => {
    return api.get('/analytics/governance/categories');
  },

  getMarketplaceCategories: async () => {
    return api.get('/analytics/marketplace/categories');
  },

  getReputationDistribution: async () => {
    return api.get('/analytics/reputation/distribution');
  },

  // Engagement
  getSocialEngagement: async (period = '30d') => {
    return api.get(`/analytics/social/engagement?period=${period}`);
  },
};

// AI API
export const aiApi = {
  getConversation: (walletAddress) =>
    api.get('/ai/conversation', { params: { walletAddress } }),

  sendMessage: (walletAddress, message) =>
    api.post('/ai/chat', { walletAddress, message }),

  clearConversation: (walletAddress) =>
    api.delete('/ai/conversation', { params: { walletAddress } }),

  getSuggestions: () =>
    api.get('/ai/suggestions')
};

// Automation API
export const automationApi = {
  getAutomations: (walletAddress, status) =>
    api.get('/automation', { params: { walletAddress, status } }),

  getAutomation: (id) =>
    api.get(`/automation/${id}`),

  createAutomation: (data) =>
    api.post('/automation/create', data),

  updateAutomation: (id, data) =>
    api.put(`/automation/${id}`, data),

  toggleAutomation: (id) =>
    api.patch(`/automation/${id}/toggle`),

  deleteAutomation: (id) =>
    api.delete(`/automation/${id}`),

  executeAutomation: (id) =>
    api.post(`/automation/${id}/execute`),

  getTemplates: () =>
    api.get('/automation/templates/list'),

  getStats: (walletAddress) =>
    api.get(`/automation/stats/${walletAddress}`)
};

// Node API
export const nodeApi = {
  getStatus: (walletAddress) =>
    api.get('/node/status', { params: { walletAddress } }),

  startNode: (walletAddress) =>
    api.post('/node/start', { walletAddress }),

  stopNode: (walletAddress) =>
    api.post('/node/stop', { walletAddress }),

  updateConfig: (walletAddress, config) =>
    api.put('/node/config', { walletAddress, config }),

  claimRewards: (walletAddress) =>
    api.post('/node/rewards/claim', { walletAddress }),

  getStats: (walletAddress) =>
    api.get('/node/stats', { params: { walletAddress } }),

  getNetworkInfo: () =>
    api.get('/node/network')
};

// Storage API
export const storageApi = {
  getFiles: (walletAddress, folder, tag) =>
    api.get('/storage/files', { params: { walletAddress, folder, tag } }),

  getFile: (id) =>
    api.get(`/storage/files/${id}`),

  uploadFile: (file, walletAddress, metadata) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('walletAddress', walletAddress);
    if (metadata.folder) formData.append('folder', metadata.folder);
    if (metadata.tags) formData.append('tags', metadata.tags);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.visibility) formData.append('visibility', metadata.visibility);
    if (metadata.encrypted) formData.append('encrypted', metadata.encrypted);
    
    return api.post('/storage/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  updateFile: (id, data) =>
    api.put(`/storage/files/${id}`, data),

  deleteFile: (id) =>
    api.delete(`/storage/files/${id}`),

  shareFile: (id, shareWith) =>
    api.post(`/storage/files/${id}/share`, { shareWith }),

  togglePin: (id) =>
    api.patch(`/storage/files/${id}/pin`),

  getStats: (walletAddress) =>
    api.get(`/storage/stats/${walletAddress}`),

  searchFiles: (walletAddress, query) =>
    api.get('/storage/search', { params: { walletAddress, query } })
};

export const queueApi = {
  getQueue: (walletAddress, status) =>
    api.get('/queue', { params: { walletAddress, status } }),

  getTransaction: (id) =>
    api.get(`/queue/${id}`),

  queueTransaction: (data) =>
    api.post('/queue', data),

  submitTransaction: (id) =>
    api.post(`/queue/${id}/submit`),

  processAll: (walletAddress) =>
    api.post('/queue/process-all', { walletAddress }),

  cancelTransaction: (id) =>
    api.post(`/queue/${id}/cancel`),

  retryTransaction: (id) =>
    api.post(`/queue/${id}/retry`),

  deleteTransaction: (id) =>
    api.delete(`/queue/${id}`),

  getStats: (walletAddress) =>
    api.get(`/queue/stats/${walletAddress}`)
};

export default {
  authApi,
  messagesApi,
  contactsApi,
  groupsApi,
  profileApi,
  statusApi,
  walletApi,
  identityApi,
  governanceApi,
  marketplaceApi,
  dashboardApi,
  communityApi,
  analyticsApi,
  aiApi,
  automationApi,
  nodeApi,
  storageApi,
  queueApi
};
