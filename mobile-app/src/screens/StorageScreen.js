import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useServices } from '../hooks/useServices';

export default function StorageScreen() {
  const { wallet, isConnected } = useApp();
  const { ipfsService } = useServices();
  const [loading, setLoading] = useState(true);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal] = useState(10); // 10 GB total

  useEffect(() => {
    if (isConnected && wallet?.address) {
      loadStorageData();
    }
  }, [isConnected, wallet?.address]);

  const loadStorageData = async () => {
    try {
      setLoading(false);
      // TODO: Load actual IPFS storage usage
      setStorageUsed(2.4); // Mock data
    } catch (error) {
      console.error('Error loading storage data:', error);
      setLoading(false);
    }
  };

  const handleUpload = () => {
    if (!wallet?.address) {
      Alert.alert('Connect Wallet', 'Please connect your wallet first');
      return;
    }
    Alert.alert('Upload File', 'IPFS file upload feature coming soon!');
  };

  const handleDownload = (fileName) => {
    if (!wallet?.address) {
      Alert.alert('Connect Wallet', 'Please connect your wallet first');
      return;
    }
    Alert.alert('Download File', `Download ${fileName} - Coming soon!`);
  };

  // Disconnected state
  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.disconnectedContainer}>
          <Text style={styles.disconnectedTitle}>Wallet Not Connected</Text>
          <Text style={styles.disconnectedText}>
            Connect your wallet to access decentralized storage
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Storage Cloud</Text>
          <Text style={styles.subtitle}>Decentralized • Encrypted • Private</Text>
        </View>

        {/* Storage Usage Card */}
        <View style={styles.storageCard}>
          <Text style={styles.storageLabel}>Storage Used</Text>
          <Text style={styles.storageValue}>
            {storageUsed} GB / {storageTotal} GB
          </Text>
          <View style={styles.storageBar}>
            <View style={[styles.storageBarFill, { width: `${(storageUsed / storageTotal) * 100}%` }]} />
          </View>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>⬆ Upgrade Storage</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search files..."
            placeholderTextColor="#8b8b8b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleUpload}>
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>Upload</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📁</Text>
            <Text style={styles.actionText}>New Folder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionText}>Photos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🔒</Text>
            <Text style={styles.actionText}>Private Vault</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Files */}
        <View style={styles.filesSection}>
          <Text style={styles.sectionTitle}>Recent Files</Text>
          
          <View style={styles.fileCard}>
            <Text style={styles.fileIcon}>📄</Text>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>Identity_Document.pdf</Text>
              <Text style={styles.fileDetails}>2.3 MB • 2 hours ago</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.fileMenu}>⋮</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fileCard}>
            <Text style={styles.fileIcon}>🖼️</Text>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>Profile_Photo.jpg</Text>
              <Text style={styles.fileDetails}>1.5 MB • Yesterday</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.fileMenu}>⋮</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.fileCard}>
            <Text style={styles.fileIcon}>📊</Text>
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>Financial_Report_2026.xlsx</Text>
              <Text style={styles.fileDetails}>856 KB • 3 days ago</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.fileMenu}>⋮</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Folders */}
        <View style={styles.foldersSection}>
          <Text style={styles.sectionTitle}>Folders</Text>
          
          <View style={styles.folderGrid}>
            <TouchableOpacity style={styles.folderCard}>
              <Text style={styles.folderIcon}>📁</Text>
              <Text style={styles.folderName}>Documents</Text>
              <Text style={styles.folderCount}>24 files</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.folderCard}>
              <Text style={styles.folderIcon}>🖼️</Text>
              <Text style={styles.folderName}>Photos</Text>
              <Text style={styles.folderCount}>156 files</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.folderCard}>
              <Text style={styles.folderIcon}>🏥</Text>
              <Text style={styles.folderName}>Health Records</Text>
              <Text style={styles.folderCount}>8 files</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.folderCard}>
              <Text style={styles.folderIcon}>💼</Text>
              <Text style={styles.folderName}>Work</Text>
              <Text style={styles.folderCount}>42 files</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* IPFS Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🌐 Decentralized Storage</Text>
          <Text style={styles.infoText}>
            Your files are encrypted and distributed across IPFS nodes. 
            Only you hold the keys to decrypt them.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  disconnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  disconnectedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  disconnectedText: {
    fontSize: 14,
    color: '#8b8b8b',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  storageCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  storageLabel: {
    fontSize: 14,
    color: '#8b8b8b',
    marginBottom: 8,
  },
  storageValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f3460',
    marginBottom: 12,
  },
  storageBar: {
    height: 8,
    backgroundColor: '#16213e',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: '#0f3460',
  },
  upgradeButton: {
    backgroundColor: '#0f3460',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#16213e',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  filesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  fileCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16213e',
  },
  fileIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  fileDetails: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  fileMenu: {
    fontSize: 20,
    color: '#8b8b8b',
  },
  foldersSection: {
    padding: 20,
  },
  folderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  folderCard: {
    width: '48%',
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16213e',
  },
  folderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  folderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  folderCount: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  infoCard: {
    margin: 20,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#8b8b8b',
    lineHeight: 18,
  },
});
