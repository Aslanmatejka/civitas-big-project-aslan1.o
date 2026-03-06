import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

export default function SettingsScreen({ navigation }) {
  const { wallet, isConnected, balance } = useApp();
  const [biometricsEnabled, setBiometricsEnabled] = React.useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [offlineModeEnabled, setOfflineModeEnabled] = React.useState(false);
  const [meshNetworkEnabled, setMeshNetworkEnabled] = React.useState(true);
  const [dataRelayEnabled, setDataRelayEnabled] = React.useState(true);

  const getShortAddress = () => {
    if (!wallet?.address) return 'Not connected';
    return `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
  };

  const handleBackupKeys = () => {
    if (!wallet?.address) {
      Alert.alert('No Wallet', 'Connect your wallet first');
      return;
    }
    Alert.alert(
      'Backup Keys',
      `Your wallet address:\n${wallet.address}\n\nKeep your private keys secure and never share them.`,
      [
        { text: 'Copy Address', onPress: () => {} },
        { text: 'Close' }
      ]
    );
  };

  const handleRecoveryPhrase = () => {
    Alert.alert(
      'Recovery Phrase',
      'Your 12-word recovery phrase is securely stored in your device keychain. Never share it with anyone.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize Your Experience</Text>
          {wallet?.address && (
            <View style={styles.walletInfoCard}>
              <Text style={styles.walletInfoLabel}>Connected Wallet</Text>
              <Text style={styles.walletInfoAddress}>{getShortAddress()}</Text>
              <Text style={styles.walletInfoBalance}>{balance || 0} CIV</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Biometric Authentication</Text>
              <Text style={styles.settingDescription}>
                Use fingerprint or face ID to unlock
              </Text>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={setBiometricsEnabled}
              trackColor={{ false: '#16213e', true: '#0f3460' }}
            />
          </View>

          <TouchableOpacity style={styles.settingRow} onPress={handleBackupKeys}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Backup Keys</Text>
              <Text style={styles.settingDescription}>
                Export and secure your private keys
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={handleRecoveryPhrase}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Recovery Phrase</Text>
              <Text style={styles.settingDescription}>
                View your 12-word recovery phrase
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Get alerts for transactions and governance
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#16213e', true: '#0f3460' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Offline Mode</Text>
              <Text style={styles.settingDescription}>
                Queue transactions when offline
              </Text>
            </View>
            <Switch
              value={offlineModeEnabled}
              onValueChange={setOfflineModeEnabled}
              trackColor={{ false: '#16213e', true: '#0f3460' }}
            />
          </View>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Language</Text>
              <Text style={styles.settingDescription}>English</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Currency</Text>
              <Text style={styles.settingDescription}>USD</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network</Text>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>RPC Endpoint</Text>
              <Text style={styles.settingDescription}>http://localhost:8545</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Network Status</Text>
              <Text style={[
                styles.settingDescription,
                isConnected ? styles.statusOnline : styles.statusOffline
              ]}>
                ● {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          {/* Mesh Network Section */}
          <View style={styles.meshNetworkCard}>
            <View style={styles.meshHeader}>
              <Text style={styles.meshTitle}>🌐 Mesh Network</Text>
              <Switch
                value={meshNetworkEnabled}
                onValueChange={setMeshNetworkEnabled}
                trackColor={{ false: '#16213e', true: '#0f3460' }}
              />
            </View>
            
            {meshNetworkEnabled && (
              <>
                <Text style={styles.meshDescription}>
                  Connect to nearby CIVITAS users for peer-to-peer connectivity
                </Text>

                {/* Mesh Status */}
                <View style={styles.meshStatusCard}>
                  <View style={styles.meshStatusRow}>
                    <Text style={styles.meshStatusLabel}>Status:</Text>
                    <Text style={styles.meshStatusValue}>Connected</Text>
                  </View>
                  <View style={styles.meshStatusRow}>
                    <Text style={styles.meshStatusLabel}>Active Peers:</Text>
                    <Text style={styles.meshStatusValue}>3 nearby</Text>
                  </View>
                  <View style={styles.meshStatusRow}>
                    <Text style={styles.meshStatusLabel}>Signal Strength:</Text>
                    <Text style={[styles.meshStatusValue, { color: '#4caf50' }]}>Strong</Text>
                  </View>
                  <View style={styles.meshStatusRow}>
                    <Text style={styles.meshStatusLabel}>Data Relayed:</Text>
                    <Text style={styles.meshStatusValue}>2.4 MB today</Text>
                  </View>
                </View>

                {/* Peer List */}
                <View style={styles.peerList}>
                  <Text style={styles.peerListTitle}>Connected Peers:</Text>
                  <View style={styles.peerCard}>
                    <Text style={styles.peerIcon}>👤</Text>
                    <View style={styles.peerInfo}>
                      <Text style={styles.peerName}>Peer #a8f3</Text>
                      <Text style={styles.peerDistance}>~50m away • Strong signal</Text>
                    </View>
                    <View style={styles.peerStatusDot} />
                  </View>
                  <View style={styles.peerCard}>
                    <Text style={styles.peerIcon}>👤</Text>
                    <View style={styles.peerInfo}>
                      <Text style={styles.peerName}>Peer #b2e7</Text>
                      <Text style={styles.peerDistance}>~120m away • Medium signal</Text>
                    </View>
                    <View style={[styles.peerStatusDot, { backgroundColor: '#ff9800' }]} />
                  </View>
                  <View style={styles.peerCard}>
                    <Text style={styles.peerIcon}>👤</Text>
                    <View style={styles.peerInfo}>
                      <Text style={styles.peerName}>Peer #c9d1</Text>
                      <Text style={styles.peerDistance}>~200m away • Weak signal</Text>
                    </View>
                    <View style={[styles.peerStatusDot, { backgroundColor: '#f44336' }]} />
                  </View>
                </View>

                {/* Data Relay Toggle */}
                <View style={styles.relayToggleRow}>
                  <View style={styles.relayInfo}>
                    <Text style={styles.relayTitle}>Help Relay Data</Text>
                    <Text style={styles.relayDescription}>
                      Share your connection to help others in rural areas
                    </Text>
                  </View>
                  <Switch
                    value={dataRelayEnabled}
                    onValueChange={setDataRelayEnabled}
                    trackColor={{ false: '#16213e', true: '#0f3460' }}
                  />
                </View>

                {/* Mesh Info */}
                <View style={styles.meshInfoCard}>
                  <Text style={styles.meshInfoIcon}>ℹ️</Text>
                  <Text style={styles.meshInfoText}>
                    Mesh networking allows CIVITAS to work in areas with limited internet. 
                    Your data is end-to-end encrypted and never stored on relay peers.
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.settingDescription}>0.1.0 (Beta)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow}>
            <Text style={styles.settingLabel}>Open Source Licenses</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.dangerButton}>
          <Text style={styles.dangerButtonText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            CIVITAS • Building Digital Sovereignty
          </Text>
          <Text style={styles.footerSubtext}>
            Your keys, your data, your freedom
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
  walletInfoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#16213e',
    alignItems: 'center',
  },
  walletInfoLabel: {
    fontSize: 11,
    color: '#8b8b8b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  walletInfoAddress: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#0f3460',
    fontWeight: '600',
    marginBottom: 4,
  },
  walletInfoBalance: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f3460',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingRow: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16213e',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  statusOnline: {
    color: '#4caf50',
  },
  statusOffline: {
    color: '#f44336',
  },
  arrow: {
    fontSize: 20,
    color: '#8b8b8b',
    marginLeft: 12,
  },
  dangerButton: {
    margin: 20,
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  dangerButtonText: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#8b8b8b',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 10,
    color: '#6b6b6b',
  },
  meshNetworkCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  meshHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  meshTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  meshDescription: {
    fontSize: 13,
    color: '#8b8b8b',
    marginBottom: 16,
    lineHeight: 18,
  },
  meshStatusCard: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  meshStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  meshStatusLabel: {
    fontSize: 13,
    color: '#c4c4c4',
  },
  meshStatusValue: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  peerList: {
    marginBottom: 16,
  },
  peerListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
  },
  peerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  peerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  peerInfo: {
    flex: 1,
  },
  peerName: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 2,
  },
  peerDistance: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  peerStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4caf50',
  },
  relayToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#16213e',
    borderRadius: 10,
    marginBottom: 12,
  },
  relayInfo: {
    flex: 1,
    marginRight: 12,
  },
  relayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  relayDescription: {
    fontSize: 12,
    color: '#8b8b8b',
    lineHeight: 16,
  },
  meshInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  meshInfoIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  meshInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#c4c4c4',
    lineHeight: 17,
  },
});
