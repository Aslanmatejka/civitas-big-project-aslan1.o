import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './MarketplacePage.css';

export default function MarketplacePage() {
  const { 
    wallet, 
    isConnected, 
    isLoading, 
    balance,
    getListings,
    getUserListings,
    createListing,
    purchaseListing,
    getUserOrders
  } = useApp();
  
  const [activeTab, setActiveTab] = useState('browse');
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Services',
    image: '📦'
  });

  // Load listings when tab changes or wallet connects
  useEffect(() => {
    if (isConnected) {
      if (activeTab === 'browse') {
        loadAllListings();
      } else if (activeTab === 'my-listings') {
        loadMyListings();
      }
    }
  }, [activeTab, isConnected]);

  const loadAllListings = async () => {
    setLoadingListings(true);
    try {
      const result = await getListings({ status: 'active' });
      setListings(result);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoadingListings(false);
    }
  };

  const loadMyListings = async () => {
    setLoadingListings(true);
    try {
      const result = await getUserListings();
      setMyListings(result);
    } catch (error) {
      console.error('Failed to load my listings:', error);
    } finally {
      setLoadingListings(false);
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    try {
      await createListing(formData);
      alert('Listing created successfully!');
      setFormData({
        title: '',
        description: '',
        price: '',
        category: 'Services',
        image: '📦'
      });
      setActiveTab('my-listings');
    } catch (error) {
      alert('Failed to create listing: ' + error.message);
    }
  };

  const handlePurchase = async (listingId, price) => {
    if (parseFloat(balance) < parseFloat(price)) {
      alert('Insufficient balance!');
      return;
    }
    
    const confirmed = window.confirm(`Purchase this item for ${price} CIV?`);
    if (!confirmed) return;

    try {
      await purchaseListing(listingId);
      alert('Purchase successful!');
      await loadAllListings();
    } catch (error) {
      alert('Purchase failed: ' + error.message);
    }
  };

  const mockListings = [
    { id: 1, title: 'Bitcoin Node Access', price: '50', seller: '0x1234...', category: 'Services', image: '💻' },
    { id: 2, title: 'Privacy VPN - 1 Year', price: '120', seller: '0x5678...', category: 'Services', image: '🔒' },
    { id: 3, title: 'Smart Contract Audit', price: '500', seller: '0xabcd...', category: 'Services', image: '📋' },
    { id: 4, title: 'Encrypted Storage - 100GB', price: '25', seller: '0xef01...', category: 'Storage', image: '💾' },
    { id: 5, title: 'DAO Consulting Package', price: '300', seller: '0x2345...', category: 'Consulting', image: '🎯' },
    { id: 6, title: 'Development Tutorial Series', price: '80', seller: '0x6789...', category: 'Education', image: '📚' },
  ];

  if (isLoading) {
    return (
      <div className="marketplace-page">
        <div className="not-connected">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="marketplace-page">
        <div className="not-connected">
          <h2>Connect Wallet</h2>
          <p>Please connect your wallet to access the marketplace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace-page">
      <div className="marketplace-container">
        <h1>🛒 Decentralized Marketplace</h1>
        <p className="subtitle">Buy and sell services peer-to-peer with zero fees</p>

        <div className="marketplace-tabs">
          <button 
            className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            Browse Listings
          </button>
          <button 
            className={`tab ${activeTab ===  'my-listings' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-listings')}
          >
            My Listings
          </button>
          <button 
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Listing
          </button>
        </div>

        {activeTab === 'browse' && (
          <div className="listings-grid">
            {loadingListings ? (
              <div className="loading-state">Loading listings...</div>
            ) : listings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🛒</div>
                <h2>No Listings Available</h2>
                <p>Be the first to create a listing!</p>
              </div>
            ) : (
              listings.map((listing) => (
                <div key={listing.listingId} className="listing-card">
                  <div className="listing-image">{listing.image}</div>
                  <div className="listing-content">
                    <div className="listing-category">{listing.category}</div>
                    <h3>{listing.title}</h3>
                    <div className="listing-seller">
                      by {listing.seller?.name || listing.seller?.address.slice(0, 10) + '...'}
                    </div>
                    <div className="listing-footer">
                      <div className="listing-price">{listing.price} CIV</div>
                      <button 
                        className="buy-btn"
                        onClick={() => handlePurchase(listing.listingId, listing.price)}
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'my-listings' && (
          <div className="listings-grid">
            {loadingListings ? (
              <div className="loading-state">Loading your listings...</div>
            ) : myListings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <h2>No Listings Yet</h2>
                <p>You haven't created any listings. Click "Create Listing" to get started.</p>
              </div>
            ) : (
              myListings.map((listing) => (
                <div key={listing.listingId} className="listing-card">
                  <div className="listing-image">{listing.image}</div>
                  <div className="listing-content">
                    <div className="listing-category">{listing.category}</div>
                    <h3>{listing.title}</h3>
                    <div className="listing-stats">
                      <span>👁️ {listing.views} views</span>
                      <span>💰 {listing.purchases} sold</span>
                    </div>
                    <div className="listing-footer">
                      <div className="listing-price">{listing.price} CIV</div>
                      <span className={`listing-status ${listing.status}`}>
                        {listing.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="create-listing-form">
            <h2>Create New Listing</h2>
            <form onSubmit={handleCreateListing}>
              <div className="form-group">
                <label>Title</label>
                <input 
                  type="text" 
                  placeholder="Enter listing title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  rows={4} 
                  placeholder="Describe your offering"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (CIV)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option>Services</option>
                    <option>Storage</option>
                    <option>Consulting</option>
                    <option>Education</option>
                    <option>Hardware</option>
                    <option>Software</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="submit-btn">Create Listing</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
