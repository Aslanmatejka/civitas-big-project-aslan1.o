import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useServices } from '../hooks/useServices';

export default function IdentityScreen() {
  const { did, credentials, reputation, wallet, isConnected } = useApp();
  const { createNewDID, issueNewCredential, verifyCredential, refresh } = useServices();
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (isConnected && wallet) {
      loadData();
    }
  }, [wallet?.address]);

  const loadData = async () => {
    try {
      setLoading(true);
      await refresh();
    } catch (error) {
      console.error('Failed to load identity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDID = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      const didData = {
        controller: wallet.address,
        publicKey: wallet.address,
        authentication: [wallet.address],
      };
      
      const result = await createNewDID(didData);
      Alert.alert('Success', 'DID created successfully!');
      await loadData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create DID');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyDID = () => {
    if (did?.id) {
      Clipboard.setString(did.id);
      Alert.alert('Copied', 'DID copied to clipboard');
    }
  };

  const handleVerifyCredential = async (credentialId) => {
    try {
      setVerifying(true);
      const isValid = await verifyCredential(credentialId);
      Alert.alert('Verification', isValid ? 'Credential is valid ✓' : 'Credential is invalid ✗');
    } catch (error) {
      Alert.alert('Error', 'Failed to verify credential');
    } finally {
      setVerifying(false);
    }
  };

  const formatDID = (didId) => {
    if (!didId) return 'No DID';
    return didId.length > 30 ? `${didId.slice(0, 18)}...${didId.slice(-8)}` : didId;
  };

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Wallet not connected</Text>
          <Text style={styles.errorSubtext}>Please connect your wallet in Settings</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Digital Identity</Text>
          <Text style={styles.subtitle}>Self-Sovereign • Verifiable</Text>
        </View>

        <View style={styles.didCard}>
          <Text style={styles.didLabel}>Your DID</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#0f3460" />
          ) : did?.id ? (
            <>
              <Text style={styles.didValue}>{formatDID(did.id)}</Text>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyDID}>
                <Text style={styles.copyButtonText}>Copy</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.noDIDText}>No DID created yet</Text>
              <TouchableOpacity style={styles.createDIDButton} onPress={handleCreateDID}>
                <Text style={styles.createDIDButtonText}>Create DID</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.reputationCard}>
          <Text style={styles.reputationLabel}>Reputation Score</Text>
          <Text style={styles.reputationValue}>{reputation}/1000</Text>
          <View style={styles.reputationBar}>
            <View style={[styles.reputationFill, { width: `${(reputation / 1000) * 100}%` }]} />
          </View>
          <Text style={styles.reputationDescription}>
            High reputation enables more governance weight and trust
          </Text>
        </View>

        <View style={styles.credentialsSection}>
          <Text style={styles.sectionTitle}>Verifiable Credentials</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#0f3460" style={styles.loader} />
          ) : credentials && credentials.length > 0 ? (
            credentials.map((credential, index) => (
              <View key={index} style={styles.credentialCard}>
                <View style={styles.credentialIcon}>
                  <Text style={styles.credentialEmoji}>
                    {credential.type === 'education' ? '🎓' : credential.type === 'employment' ? '💼' : '📜'}
                  </Text>
                </View>
                <View style={styles.credentialInfo}>
                  <Text style={styles.credentialTitle}>
                    {credential.type || 'Credential'}
                  </Text>
                  <Text style={styles.credentialIssuer}>
                    Issued: {new Date(credential.issuedAt).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity onPress={() => handleVerifyCredential(credential.id)}>
                    <Text style={styles.credentialVerify}>
                      {verifying ? 'Verifying...' : 'Verify ➔'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No credentials yet</Text>
          )}
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Identity Actions</Text>
          
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionTitle}>📤 Share Credentials</Text>
            <Text style={styles.actionDescription}>
              Generate QR code for verification
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionTitle}>🔐 Manage Keys</Text>
            <Text style={styles.actionDescription}>
              View and backup your identity keys
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionTitle}>👥 Recovery Guardians</Text>
            <Text style={styles.actionDescription}>
              Set up social recovery for your identity
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyNoteTitle}>🛡️ Zero-Knowledge Privacy</Text>
          <Text style={styles.privacyNoteText}>
            Your credentials are encrypted and stored on IPFS. 
            Share proofs without revealing raw data using zero-knowledge protocols.
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#8b8b8b',
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
  didCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
    alignItems: 'center',
  },
  didLabel: {
    fontSize: 12,
    color: '#8b8b8b',
    marginBottom: 8,
  },
  didValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  noDIDText: {
    fontSize: 14,
    color: '#8b8b8b',
    marginBottom: 12,
  },
  copyButton: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  createDIDButton: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createDIDButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  reputationCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  reputationLabel: {
    fontSize: 14,
    color: '#8b8b8b',
    marginBottom: 8,
  },
  reputationValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f3460',
    marginBottom: 12,
  },
  reputationBar: {
    height: 8,
    backgroundColor: '#16213e',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  reputationFill: {
    height: '100%',
    backgroundColor: '#0f3460',
  },
  reputationDescription: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  credentialsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#8b8b8b',
    textAlign: 'center',
    marginVertical: 20,
  },
  credentialCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#16213e',
  },
  credentialIcon: {
    marginRight: 16,
  },
  credentialEmoji: {
    fontSize: 40,
  },
  credentialInfo: {
    flex: 1,
  },
  credentialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
    textTransform: 'capitalize',
  },
  credentialIssuer: {
    fontSize: 12,
    color: '#8b8b8b',
    marginBottom: 8,
  },
  credentialVerify: {
    fontSize: 12,
    color: '#0f3460',
    fontWeight: '600',
  },
  actionsSection: {
    padding: 20,
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
  privacyNote: {
    margin: 20,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  privacyNoteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  privacyNoteText: {
    fontSize: 12,
    color: '#8b8b8b',
    lineHeight: 18,
  },
});
