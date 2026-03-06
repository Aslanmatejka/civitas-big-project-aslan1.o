import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useServices } from '../hooks/useServices';

export default function ProfileScreen({ navigation }) {
  const { wallet, isConnected, balance, reputation, did, credentials } = useApp();
  const { contractService } = useServices();
  const [loading, setLoading] = useState(true);
  const [transactionCount, setTransactionCount] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);

  useEffect(() => {
    if (isConnected && wallet?.address) {
      loadProfileData();
    }
  }, [isConnected, wallet?.address]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Get transaction history
      const history = await contractService.getTransactionHistory(wallet.address);
      setTransactionCount(history?.length || 0);
      
      // Get connections/delegations count (placeholder - implement when delegation tracking is ready)
      setConnectionCount(0);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAddressInitials = () => {
    if (!wallet?.address) return '??';
    return wallet.address.slice(2, 4).toUpperCase();
  };

  const getShortAddress = () => {
    if (!wallet?.address) return 'Not connected';
    return `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
  };

  const getShortDID = () => {
    if (!did) return 'No DID created';
    if (did.length < 20) return did;
    return `${did.slice(0, 20)}...${did.slice(-4)}`;
  };

  // Disconnected state
  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.disconnectedContainer}>
          <Text style={styles.disconnectedTitle}>Wallet Not Connected</Text>
          <Text style={styles.disconnectedText}>
            Connect your wallet to view your profile
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{getAddressInitials()}</Text>
          </View>
          <Text style={styles.profileName}>{getShortAddress()}</Text>
          <Text style={styles.profileDID}>{getShortDID()}</Text>
          {!did && (
            <TouchableOpacity 
              style={[styles.editButton, { borderColor: '#ff9800', marginTop: 8 }]}
              onPress={() => navigation.navigate('Identity')}
            >
              <Text style={[styles.editButtonText, { color: '#ff9800' }]}>
                Create DID
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0f3460" />
            <Text style={styles.loadingText}>Loading profile data...</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{reputation || 0}</Text>
              <Text style={styles.statLabel}>Reputation</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{transactionCount}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{connectionCount}</Text>
              <Text style={styles.statLabel}>Connections</Text>
            </View>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert('Private Keys', `Address: ${wallet?.address || 'N/A'}`, [
              { text: 'Copy Address', onPress: () => {} },
              { text: 'Close' }
            ])}
          >
            <Text style={styles.menuIcon}>🔑</Text>
            <Text style={styles.menuText}>Private Keys</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => Alert.alert('Recovery Phrase', 'Recovery phrase is securely stored in your device keychain.')}
          >
            <Text style={styles.menuIcon}>🔄</Text>
            <Text style={styles.menuText}>Recovery Phrase</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>👥</Text>
            <Text style={styles.menuText}>Social Recovery Guardians</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Identity')}
          >
            <Text style={styles.menuIcon}>📜</Text>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.menuText}>Verifiable Credentials</Text>
              {credentials && credentials.length > 0 && (
                <View style={styles.credentialBadge}>
                  <Text style={styles.credentialBadgeText}>{credentials.length}</Text>
                </View>
              )}
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.menuIcon}>💰</Text>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.menuText}>Assets & Balances</Text>
              <Text style={styles.balanceHint}>{balance || 0} CIV</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.menuIcon}>📊</Text>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.menuText}>Transaction History</Text>
              {transactionCount > 0 && (
                <Text style={styles.balanceHint}>{transactionCount} tx</Text>
              )}
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuText}>Spending Limits</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Governance')}
          >
            <Text style={styles.menuIcon}>🗳️</Text>
            <Text style={styles.menuText}>Governance History</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Marketplace')}
          >
            <Text style={styles.menuIcon}>🛒</Text>
            <Text style={styles.menuText}>Marketplace Orders</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Community')}
          >
            <Text style={styles.menuIcon}>💬</Text>
            <Text style={styles.menuText}>Community Posts</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🌐</Text>
            <Text style={styles.menuText}>Language & Region</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>Notifications</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuText}>Privacy Settings</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🎨</Text>
            <Text style={styles.menuText}>Appearance</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Info</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📚</Text>
            <Text style={styles.menuText}>Help Center</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📖</Text>
            <Text style={styles.menuText}>Documentation</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>ℹ️</Text>
            <Text style={styles.menuText}>About CIVITAS</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>📄</Text>
            <Text style={styles.menuText}>Terms & Privacy Policy</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <TouchableOpacity style={styles.dangerButton}>
            <Text style={styles.dangerButtonText}>🚪 Sign Out</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dangerButton}>
            <Text style={[styles.dangerButtonText, { color: '#f44336' }]}>
              ⚠️ Delete Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>CIVITAS v1.0.0</Text>
          <Text style={styles.versionText}>Build 2026.02.26</Text>
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#8b8b8b',
    marginTop: 12,
  },
  header: {
    alignItems: 'center',
    padding: 40,
    paddingBottom: 30,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#1a1a2e',
  },
  profileAvatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  profileDID: {
    fontSize: 12,
    color: '#8b8b8b',
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0f3460',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#0f3460',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#16213e',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f3460',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8b8b8b',
    marginLeft: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    marginHorizontal: 20,
    marginBottom: 2,
    padding: 16,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    color: '#c4c4c4',
  },
  menuArrow: {
    fontSize: 20,
    color: '#8b8b8b',
  },
  credentialBadge: {
    backgroundColor: '#0f3460',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  credentialBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  balanceHint: {
    fontSize: 12,
    color: '#0f3460',
    fontWeight: '600',
    marginLeft: 8,
  },
  dangerSection: {
    marginVertical: 30,
    paddingHorizontal: 20,
  },
  dangerButton: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff9800',
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  versionText: {
    fontSize: 11,
    color: '#8b8b8b',
    marginBottom: 4,
  },
});
