import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useServices } from '../hooks/useServices';

export default function WalletScreen() {
  const { balance, address, isConnected, refreshBalance } = useApp();
  const { sendTransaction, getTransactionHistory } = useServices();
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    loadTransactions();
  }, [address]);

  const loadTransactions = async () => {
    if (!isConnected || !address) return;
    
    try {
      setLoading(true);
      const txHistory = await getTransactionHistory(address, 10);
      setTransactions(txHistory);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!recipient || !amount) {
      Alert.alert('Error', 'Please enter recipient and amount');
      return;
    }

    try {
      setLoading(true);
      const tx = await sendTransaction(recipient, amount);
      Alert.alert('Success', `Transaction sent: ${tx.hash}`);
      setSendModalVisible(false);
      setRecipient('');
      setAmount('');
      await refreshBalance();
      await loadTransactions();
    } catch (error) {
      Alert.alert('Error', error.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (bal) => {
    if (!bal) return '0.00';
    return parseFloat(bal).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now - date;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 1) return 'Just now';
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffHrs < 48) return 'Yesterday';
    return date.toLocaleDateString();
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
          <Text style={styles.title}>Wallet</Text>
          <Text style={styles.subtitle}>Non-Custodial • Self-Sovereign</Text>
          <Text style={styles.addressText}>{formatAddress(address)}</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>{formatBalance(balance)} CIV</Text>
          <TouchableOpacity onPress={refreshBalance} style={styles.refreshButton}>
            <Text style={styles.refreshText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setSendModalVisible(true)}
          >
            <Text style={styles.actionButtonIcon}>↑</Text>
            <Text style={styles.actionButtonText}>Send</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>↓</Text>
            <Text style={styles.actionButtonText}>Receive</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>⟳</Text>
            <Text style={styles.actionButtonText}>Swap</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#0f3460" style={styles.loader} />
          ) : transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet</Text>
          ) : (
            transactions.map((tx, index) => (
              <View key={index} style={styles.transactionCard}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionType}>
                    {tx.from.toLowerCase() === address.toLowerCase() ? 'Sent' : 'Received'}
                  </Text>
                  <Text style={styles.transactionDate}>{formatDate(tx.timestamp)}</Text>
                  <Text style={styles.transactionHash}>{formatAddress(tx.hash)}</Text>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  tx.from.toLowerCase() === address.toLowerCase() && styles.transactionNegative
                ]}>
                  {tx.from.toLowerCase() === address.toLowerCase() ? '-' : '+'}
                  {formatBalance(tx.value)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.securityNote}>
          <Text style={styles.securityNoteTitle}>🔒 Your Keys, Your Crypto</Text>
          <Text style={styles.securityNoteText}>
            This wallet is non-custodial. You control your private keys. 
            CIVITAS never has access to your funds.
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={sendModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSendModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send CIV Tokens</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Recipient Address"
              placeholderTextColor="#8b8b8b"
              value={recipient}
              onChangeText={setRecipient}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor="#8b8b8b"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setSendModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.sendButton]}
                onPress={handleSend}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
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
    marginBottom: 8,
  },
  addressText: {
    fontSize: 12,
    color: '#0f3460',
    fontFamily: 'monospace',
  },
  balanceCard: {
    margin: 20,
    padding: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16213e',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8b8b8b',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  refreshButton: {
    marginTop: 8,
  },
  refreshText: {
    fontSize: 14,
    color: '#0f3460',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionButtonIcon: {
    fontSize: 28,
    color: '#0f3460',
    marginBottom: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#ffffff',
  },
  transactionsSection: {
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
  transactionCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16213e',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#8b8b8b',
    marginBottom: 4,
  },
  transactionHash: {
    fontSize: 10,
    color: '#0f3460',
    fontFamily: 'monospace',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
    marginLeft: 12,
  },
  transactionNegative: {
    color: '#f44336',
  },
  securityNote: {
    margin: 20,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  securityNoteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  securityNoteText: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#16213e',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#0f3460',
    marginLeft: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
