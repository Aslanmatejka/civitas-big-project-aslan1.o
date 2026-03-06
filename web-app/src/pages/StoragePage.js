import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { storageApi } from '../services/api';
import './StoragePage.css';

export default function StoragePage() {
  const { isConnected, isLoading, connectWallet, wallet } = useApp();
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ totalSizeGB: 0, totalFiles: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (wallet?.address) {
      loadFiles();
      loadStats();
    }
  }, [wallet?.address]);

  const loadFiles = async () => {
    try {
      const response = await storageApi.getFiles(wallet.address);
      setFiles(response.data);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await storageApi.getStats(wallet.address);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of selectedFiles) {
        await storageApi.uploadFile(file, wallet.address, {
          folder: 'root',
          visibility: 'private',
          encrypted: false
        });
      }
      
      await loadFiles();
      await loadStats();
      alert(`Successfully uploaded ${selectedFiles.length} file(s)!`);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = (file) => {
    alert(`Download functionality would open: ${file.url}\nCID: ${file.cid}`);
  };

  const handleShare = async (file) => {
    const address = prompt('Enter wallet address to share with:');
    if (!address) return;

    try {
      await storageApi.shareFile(file._id, [address]);
      await loadFiles();
      alert('File shared successfully!');
    } catch (error) {
      console.error('Error sharing file:', error);
      alert('Failed to share file.');
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Delete this file? This cannot be undone.')) return;

    try {
      await storageApi.deleteFile(fileId);
      await loadFiles();
      await loadStats();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file.');
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="storage-page">
        <div className="storage-container">
          <div className="not-connected">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="storage-page">
        <div className="storage-container">
          <div className="not-connected">
            <h2>Wallet Not Connected</h2>
            <p>Please connect your wallet to access decentralized storage.</p>
            <button className="btn btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="storage-page">
      <div className="storage-container">
        <div className="storage-header">
          <h1>📦 Decentralized Storage</h1>
          <p className="subtitle">Encrypted file storage on IPFS</p>
        </div>

        <div className="storage-stats">
          <div className="stat-card">
            <div className="stat-value">{formatSize(stats.totalSize || 0)}</div>
            <div className="stat-label">Used Space</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">5 GB</div>
            <div className="stat-label">Total Space</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalFiles || 0}</div>
            <div className="stat-label">Files Stored</div>
          </div>
        </div>

        <div className="upload-section">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button 
            className="btn btn-primary btn-upload" 
            onClick={handleFileUpload}
            disabled={isUploading}
          >
            {isUploading ? '⏳ Uploading...' : '⬆️ Upload Files'}
          </button>
        </div>

        <div className="files-section">
          <h2>Your Files ({files.length})</h2>
          {files.length > 0 ? (
            <div className="files-list">
              {files.map((file) => (
                <div key={file._id} className="file-item">
                  <div className="file-icon">
                    {file.mimeType?.startsWith('image/') ? '🖼️' :
                     file.mimeType?.startsWith('video/') ? '🎥' :
                     file.mimeType?.startsWith('audio/') ? '🎵' :
                     file.mimeType?.includes('pdf') ? '📄' :
                     file.mimeType?.includes('zip') ? '📦' : '📄'}
                  </div>
                  <div className="file-info">
                    <h3>{file.originalName || file.name}</h3>
                    <p className="file-meta">
                      {formatSize(file.size)} • Uploaded {formatDate(file.createdAt)}
                      {file.pinned && ' • 📌 Pinned'}
                    </p>
                    <p className="file-cid">CID: {file.cid}</p>
                  </div>
                  <div className="file-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleDownload(file)}
                    >
                      Download
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleShare(file)}
                    >
                      Share
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleDelete(file._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📭</div>
              <p>No files uploaded yet. Click the upload button to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
