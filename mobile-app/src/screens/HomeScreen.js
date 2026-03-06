import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useServices } from '../hooks/useServices';

export default function HomeScreen({ navigation }) {
  const { balance, wallet, isConnected, reputation, createWallet, importWallet } = useApp();
  const { getNetworkStats, getTransactionHistory } = useServices();
  
  const [networkStats, setNetworkStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [importing, setImporting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newWalletData, setNewWalletData] = useState(null);

  useEffect(() => {
    if (isConnected && wallet?.address) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [wallet?.address, isConnected]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [stats, activity] = await Promise.all([
        getNetworkStats(),
        wallet?.address ? getTransactionHistory(wallet.address, 3) : Promise.resolve([])
      ]);
      setNetworkStats(stats || { activeUsers: 0, validators: 0 });
      setRecentActivity(activity || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      setNetworkStats({ activeUsers: 0, validators: 0 });
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatBalance = (bal) => {
    if (!bal) return '0.00';
    return parseFloat(bal).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now - date;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString();
  };

  const handleCreateWallet = async () => {
    try {
      console.log('🔵 Creating new wallet...');
      setLoading(true);
      const newWallet = await createWallet();
      console.log('✅ Wallet created:', newWallet?.address);
      
      setNewWalletData(newWallet);
      setShowSuccessModal(true);
      setLoading(false);
    } catch (error) {
      console.error('❌ Wallet creation failed:', error);
      alert('Failed to create wallet: ' + error.message);
      setLoading(false);
    }
  };

  const handleWalletCreated = async () => {
    setShowSuccessModal(false);
    await loadData();
  };

  const handleImportWallet = async () => {
    if (!seedPhrase.trim()) {
      alert('Please enter your seed phrase');
      return;
    }

    try {
      setImporting(true);
      await importWallet(seedPhrase.trim());
      
      setShowImportModal(false);
      setSeedPhrase('');
      setImporting(false);
      await loadData();
    } catch (error) {
      console.error('❌ Import failed:', error);
      alert('Failed to import wallet: ' + error.message);
      setImporting(false);
    }
  };

  const handleCancelImport = () => {
    setShowImportModal(false);
    setSeedPhrase('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f3460']} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>CIVITAS</Text>
          <Text style={styles.subtitle}>Decentralized Personal Ecosystem</Text>
        </View>

        {/* Wallet Connection Section - Show when not connected */}
        {!isConnected && (
          <View style={styles.connectSection}>
            <Text style={styles.connectTitle}>🔐 Connect Your Wallet</Text>
            <Text style={styles.connectDescription}>
              Create a new wallet or import an existing one to get started
            </Text>

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleCreateWallet}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Create New Wallet</Text>
                  <Text style={styles.primaryButtonSubtext}>Generate a new secure wallet</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setShowImportModal(true)}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Import Existing Wallet</Text>
              <Text style={styles.secondaryButtonSubtext}>Use your 12-word seed phrase</Text>
            </TouchableOpacity>

            <View style={styles.securityNote}>
              <Text style={styles.securityNoteIcon}>🛡️</Text>
              <Text style={styles.securityNoteText}>
                Your keys are stored securely on your device. CIVITAS never has access to your funds.
              </Text>
            </View>
          </View>
        )}

        {isConnected && wallet && (
          <View style={styles.userCard}>
            <Text style={styles.userLabel}>Your Balance</Text>
            <Text style={styles.userBalance}>{formatBalance(balance)} CIV</Text>
            <Text style={styles.userReputation}>Reputation: {reputation}</Text>
          </View>
        )}

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to Digital Sovereignty</Text>
          <Text style={styles.welcomeText}>
            Take control of your identity, finances, and data. 
            No intermediaries. No surveillance. Just freedom.
          </Text>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.actionTitle}>💰 Send Payment</Text>
            <Text style={styles.actionDescription}>
              P2P transfers with no fees
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Identity')}
          >
            <Text style={styles.actionTitle}>🆔 Manage Identity</Text>
            <Text style={styles.actionDescription}>
              Control your digital credentials
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Governance')}
          >
            <Text style={styles.actionTitle}>🗳️ Vote on Proposals</Text>
            <Text style={styles.actionDescription}>
              Participate in DAO governance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.actionTitle}>👤 View Profile</Text>
            <Text style={styles.actionDescription}>
              Manage your reputation and connections
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Marketplace')}
          >
            <Text style={styles.actionTitle}>🛒 Marketplace</Text>
            <Text style={styles.actionDescription}>
              Buy and sell goods peer-to-peer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Analytics')}
          >
            <Text style={styles.actionTitle}>📊 Analytics</Text>
            <Text style={styles.actionDescription}>
              View network metrics and insights
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Community')}
          >
            <Text style={styles.actionTitle}>👥 Community</Text>
            <Text style={styles.actionDescription}>
              Connect with other members
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Node')}
          >
            <Text style={styles.actionTitle}>🖥️ Node Operators</Text>
            <Text style={styles.actionDescription}>
              Become a node or delegate stake
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Automation')}
          >
            <Text style={styles.actionTitle}>⚙️ Automation</Text>
            <Text style={styles.actionDescription}>
              Set up automated tasks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('AI')}
          >
            <Text style={styles.actionTitle}>🤖 AI Assistant</Text>
            <Text style={styles.actionDescription}>
              Get help with crypto and governance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Storage')}
          >
            <Text style={styles.actionTitle}>💾 Decentralized Storage</Text>
            <Text style={styles.actionDescription}>
              Store files on IPFS securely
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Messaging')}
          >
            <Text style={styles.actionTitle}>💬 Messaging</Text>
            <Text style={styles.actionDescription}>
              Send encrypted peer-to-peer messages
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('OfflineQueue')}
          >
            <Text style={styles.actionTitle}>📡 Offline Queue</Text>
            <Text style={styles.actionDescription}>
              Manage pending offline transactions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('BiometricSetup')}
          >
            <Text style={styles.actionTitle}>🔐 Biometric Security</Text>
            <Text style={styles.actionDescription}>
              Set up fingerprint/face unlock
            </Text>
          </TouchableOpacity>
        </View>

        {recentActivity.length > 0 && (
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentActivity.map((tx, index) => (
              <View key={index} style={styles.activityCard}>
                <Text style={styles.activityType}>
                  {tx.from?.toLowerCase() === wallet?.address?.toLowerCase() ? 'Sent' : 'Received'}
                </Text>
                <Text style={styles.activityAmount}>
                  {tx.from?.toLowerCase() === wallet?.address?.toLowerCase() ? '-' : '+'}
                  {formatBalance(tx.value)} CIV
                </Text>
                <Text style={styles.activityDate}>{formatDate(tx.timestamp)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Network Stats</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#0f3460" style={styles.loader} />
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {networkStats?.activeUsers?.toLocaleString() || '0'}
                </Text>
                <Text style={styles.statLabel}>Active Users</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {networkStats?.validators?.toLocaleString() || '0'}
                </Text>
                <Text style={styles.statLabel}>Validators</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Import Wallet Modal */}
      <Modal
        visible={showImportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelImport}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Import Wallet</Text>
            <Text style={styles.modalDescription}>
              Enter your 12 or 24-word seed phrase to restore your wallet
            </Text>

            <TextInput
              style={styles.seedPhraseInput}
              placeholder="Enter seed phrase..."
              placeholderTextColor="#8b8b8b"
              value={seedPhrase}
              onChangeText={setSeedPhrase}
              multiline
              numberOfLines={4}
              autoCorrect={false}
              autoCapitalize="none"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleCancelImport}
                disabled={importing}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonImport]}
                onPress={handleImportWallet}
                disabled={importing}
              >
                {importing ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonTextImport}>Import</Text>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.modalWarning}>
              ⚠️ Never share your seed phrase with anyone. CIVITAS will never ask for it.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Wallet Created Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleWalletCreated}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✅ Wallet Created!</Text>
            <Text style={styles.modalDescription}>
              Your new wallet has been created successfully.
            </Text>

            {newWalletData && (
              <>
                <View style={styles.walletInfoBox}>
                  <Text style={styles.walletInfoLabel}>Address:</Text>
                  <Text style={styles.walletInfoValue} selectable>
                    {newWalletData.address}
                  </Text>
                </View>

                <View style={styles.seedPhraseBox}>
                  <Text style={styles.seedPhraseLabel}>
                    ⚠️ SAVE YOUR SEED PHRASE
                  </Text>
                  <Text style={styles.seedPhraseWarning}>
                    Write this down on paper and store it safely. This is the ONLY way to recover your wallet!
                  </Text>
                  <Text style={styles.seedPhraseText} selectable>
                    {newWalletData.mnemonic}
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonImport]}
              onPress={handleWalletCreated}
            >
              <Text style={styles.modalButtonTextImport}>I Saved It Securely</Text>
            </TouchableOpacity>

            <Text style={styles.modalWarning}>
              🔒 Never share your seed phrase with anyone!
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8b8b8b',
  },
  welcomeCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#c4c4c4',
    lineHeight: 22,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  actionDescription: {
    fontSize: 13,
    color: '#8b8b8b',
  },
  statsSection: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16213e',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f3460',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  loader: {
    marginVertical: 20,
  },
  userCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
    alignItems: 'center',
  },
  userLabel: {
    fontSize: 12,
    color: '#8b8b8b',
    marginBottom: 8,
  },
  userBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f3460',
    marginBottom: 6,
  },
  userReputation: {
    fontSize: 14,
    color: '#8b8b8b',
  },
  activitySection: {
    padding: 20,
  },
  activityCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  activityType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  connectSection: {
    margin: 20,
    padding: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#0f3460',
    alignItems: 'center',
  },
  connectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  connectDescription: {
    fontSize: 14,
    color: '#8b8b8b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#0f3460',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 70,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  primaryButtonSubtext: {
    color: '#c4c4c4',
    fontSize: 12,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0f3460',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 70,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#0f3460',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  secondaryButtonSubtext: {
    color: '#8b8b8b',
    fontSize: 12,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#16213e',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  securityNoteIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  securityNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#8b8b8b',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#8b8b8b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  seedPhraseInput: {
    backgroundColor: '#0a0a0f',
    borderWidth: 1,
    borderColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  modalButtonCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8b8b8b',
  },
  modalButtonImport: {
    backgroundColor: '#0f3460',
  },
  modalButtonTextCancel: {
    color: '#8b8b8b',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonTextImport: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalWarning: {
    fontSize: 11,
    color: '#ff9800',
    textAlign: 'center',
    lineHeight: 16,
  },
  walletInfoBox: {
    backgroundColor: '#0a0a0f',
    borderWidth: 1,
    borderColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  walletInfoLabel: {
    fontSize: 12,
    color: '#8b8b8b',
    marginBottom: 8,
    fontWeight: '600',
  },
  walletInfoValue: {
    fontSize: 13,
    color: '#ffffff',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  seedPhraseBox: {
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: '#ff9800',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  seedPhraseLabel: {
    fontSize: 14,
    color: '#ff9800',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  seedPhraseWarning: {
    fontSize: 11,
    color: '#c4c4c4',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  seedPhraseText: {
    fontSize: 13,
    color: '#ffffff',
    fontFamily: 'monospace',
    lineHeight: 20,
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
  },
});
