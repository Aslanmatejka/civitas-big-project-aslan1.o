import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useApp } from '../context/AppContext';

export default function OfflineQueueScreen({ navigation }) {
  const { wallet, isConnected } = useApp();
  const [isOnline, setIsOnline] = useState(false); // Mock online status
  const [autoSync, setAutoSync] = useState(true);

  const handleSyncNow = () => {
    if (!wallet?.address) {
      Alert.alert('Connect Wallet', 'Please connect your wallet first');
      return;
    }
    Alert.alert('Sync Queue', 'Offline queue sync feature coming soon!');
  };

  // Disconnected state
  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.disconnectedContainer}>
          <Text style={styles.disconnectedTitle}>Wallet Not Connected</Text>
          <Text style={styles.disconnectedText}>
            Connect your wallet to view offline queue
          </Text>
        </View>
      </View>
    );
  }

  // Mock queued transactions
  const queuedTransactions = [
    {
      id: 1,
      type: 'payment',
      action: 'Send 50 CIV',
      recipient: 'Maria Santos',
      recipientDID: 'did:civitas:8923...4521',
      amount: '50 CIV',
      queuedTime: '2 hours ago',
      status: 'Pending',
      priority: 'Normal',
      retries: 0,
      estimatedGas: '0.02 CIV',
    },
    {
      id: 2,
      type: 'governance',
      action: 'Vote on CIP-003',
      proposal: 'CIP-003: Increase validator rewards',
      vote: 'For',
      votingPower: '24.9',
      queuedTime: '1 day ago',
      status: 'Pending',
      priority: 'High',
      retries: 2,
      expiresIn: '5 days',
    },
    {
      id: 3,
      type: 'storage',
      action: 'Upload to IPFS',
      fileName: 'health_record_2026.pdf',
      fileSize: '2.4 MB',
      queuedTime: '30 minutes ago',
      status: 'Pending',
      priority: 'Normal',
      retries: 0,
      encryption: 'AES-256',
    },
    {
      id: 4,
      type: 'identity',
      action: 'Issue Credential',
      credentialType: 'Education Certificate',
      issuer: 'Universitas Indonesia',
      queuedTime: '3 days ago',
      status: 'Retrying',
      priority: 'Low',
      retries: 5,
    },
    {
      id: 5,
      type: 'marketplace',
      action: 'Create Listing',
      listingTitle: 'Web Development Services',
      price: '50 CIV/hour',
      queuedTime: '5 hours ago',
      status: 'Pending',
      priority: 'Normal',
      retries: 1,
    },
  ];

  // Failed transactions (for reference)
  const failedTransactions = [
    {
      id: 101,
      type: 'payment',
      action: 'Send 200 CIV',
      recipient: 'Unknown User',
      failedTime: '2 days ago',
      reason: 'Insufficient funds',
      canRetry: false,
    },
    {
      id: 102,
      type: 'governance',
      action: 'Vote on CIP-002',
      proposal: 'CIP-002: Offline transaction queue',
      failedTime: '8 days ago',
      reason: 'Voting period expired',
      canRetry: false,
    },
  ];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'payment': return '💸';
      case 'governance': return '🗳️';
      case 'storage': return '📦';
      case 'identity': return '🆔';
      case 'marketplace': return '🏪';
      default: return '📄';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return '#f44336';
      case 'Normal': return '#0f3460';
      case 'Low': return '#8b8b8b';
      default: return '#8b8b8b';
    }
  };

  const handleCancelTransaction = (id) => {
    console.log('Cancelling transaction:', id);
  };

  const handleRetryTransaction = (id) => {
    console.log('Retrying transaction:', id);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline Queue</Text>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusDot, isOnline && styles.statusDotOnline]} />
          <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Queue Status Banner */}
        <View style={[styles.banner, isOnline ? styles.bannerOnline : styles.bannerOffline]}>
          <Text style={styles.bannerIcon}>{isOnline ? '✅' : '📡'}</Text>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>
              {isOnline ? 'Connected to Network' : 'You are Offline'}
            </Text>
            <Text style={styles.bannerText}>
              {isOnline
                ? `${queuedTransactions.length} transactions ready to sync`
                : 'Your transactions are queued and will be synced when you reconnect'}
            </Text>
          </View>
        </View>

        {/* Sync Controls */}
        {isOnline && queuedTransactions.length > 0 && (
          <TouchableOpacity style={styles.syncButton} onPress={handleSyncNow}>
            <Text style={styles.syncButtonIcon}>🔄</Text>
            <Text style={styles.syncButtonText}>Sync All Now</Text>
          </TouchableOpacity>
        )}

        {/* Queue Statistics */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{queuedTransactions.length}</Text>
            <Text style={styles.statLabel}>Queued</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {queuedTransactions.filter(t => t.priority === 'High').length}
            </Text>
            <Text style={styles.statLabel}>High Priority</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{failedTransactions.length}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        </View>

        {/* Auto-Sync Toggle */}
        <View style={styles.settingCard}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingTitle}>Auto-Sync When Online</Text>
            <Text style={styles.settingDescription}>
              Automatically sync queued transactions when connection is restored
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, autoSync && styles.toggleActive]}
            onPress={() => setAutoSync(!autoSync)}
          >
            <View style={[styles.toggleThumb, autoSync && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>

        {/* Queued Transactions */}
        <Text style={styles.sectionTitle}>Queued Transactions ({queuedTransactions.length})</Text>
        {queuedTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>No Queued Transactions</Text>
            <Text style={styles.emptyText}>
              Your offline transactions will appear here when you're disconnected
            </Text>
          </View>
        ) : (
          queuedTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              {/* Header */}
              <View style={styles.transactionHeader}>
                <Text style={styles.typeIcon}>{getTypeIcon(transaction.type)}</Text>
                <View style={styles.transactionTitleSection}>
                  <Text style={styles.transactionAction}>{transaction.action}</Text>
                  <Text style={styles.transactionTime}>{transaction.queuedTime}</Text>
                </View>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: getPriorityColor(transaction.priority) },
                  ]}
                >
                  <Text style={styles.priorityBadgeText}>{transaction.priority}</Text>
                </View>
              </View>

              {/* Details */}
              <View style={styles.transactionDetails}>
                {transaction.recipient && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Recipient:</Text>
                      <Text style={styles.detailValue}>{transaction.recipient}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>DID:</Text>
                      <Text style={styles.detailValueMono}>{transaction.recipientDID}</Text>
                    </View>
                  </>
                )}
                {transaction.amount && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount:</Text>
                    <Text style={styles.detailValueHighlight}>{transaction.amount}</Text>
                  </View>
                )}
                {transaction.estimatedGas && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Est. Gas:</Text>
                    <Text style={styles.detailValue}>{transaction.estimatedGas}</Text>
                  </View>
                )}
                {transaction.proposal && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Proposal:</Text>
                    <Text style={styles.detailValue}>{transaction.proposal}</Text>
                  </View>
                )}
                {transaction.vote && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Vote:</Text>
                    <Text style={[styles.detailValue, { color: '#4caf50' }]}>
                      {transaction.vote}
                    </Text>
                  </View>
                )}
                {transaction.votingPower && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Voting Power:</Text>
                    <Text style={styles.detailValue}>{transaction.votingPower}</Text>
                  </View>
                )}
                {transaction.expiresIn && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Expires:</Text>
                    <Text style={[styles.detailValue, { color: '#ff9800' }]}>
                      {transaction.expiresIn}
                    </Text>
                  </View>
                )}
                {transaction.fileName && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>File:</Text>
                      <Text style={styles.detailValue}>{transaction.fileName}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Size:</Text>
                      <Text style={styles.detailValue}>{transaction.fileSize}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Encryption:</Text>
                      <Text style={styles.detailValue}>{transaction.encryption}</Text>
                    </View>
                  </>
                )}
                {transaction.credentialType && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Type:</Text>
                      <Text style={styles.detailValue}>{transaction.credentialType}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Issuer:</Text>
                      <Text style={styles.detailValue}>{transaction.issuer}</Text>
                    </View>
                  </>
                )}
                {transaction.listingTitle && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Listing:</Text>
                      <Text style={styles.detailValue}>{transaction.listingTitle}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Price:</Text>
                      <Text style={styles.detailValue}>{transaction.price}</Text>
                    </View>
                  </>
                )}
              </View>

              {/* Status & Retries */}
              <View style={styles.statusSection}>
                <View style={styles.statusLeft}>
                  <Text style={styles.statusLabel}>Status:</Text>
                  <Text
                    style={[
                      styles.statusValue,
                      transaction.status === 'Retrying' && { color: '#ff9800' },
                    ]}
                  >
                    {transaction.status}
                  </Text>
                  {transaction.retries > 0 && (
                    <Text style={styles.retriesText}>({transaction.retries} retries)</Text>
                  )}
                </View>
              </View>

              {/* Actions */}
              <View style={styles.transactionActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleRetryTransaction(transaction.id)}
                >
                  <Text style={styles.actionButtonText}>🔄 Retry Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButtonSecondary}
                  onPress={() => console.log('View details:', transaction.id)}
                >
                  <Text style={styles.actionButtonSecondaryText}>ℹ️ Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButtonDanger}
                  onPress={() => handleCancelTransaction(transaction.id)}
                >
                  <Text style={styles.actionButtonDangerText}>✖️ Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Failed Transactions */}
        {failedTransactions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Failed Transactions ({failedTransactions.length})</Text>
            {failedTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.failedCard}>
                <Text style={styles.typeIcon}>{getTypeIcon(transaction.type)}</Text>
                <View style={styles.failedContent}>
                  <Text style={styles.failedAction}>{transaction.action}</Text>
                  {transaction.proposal && (
                    <Text style={styles.failedDetail}>{transaction.proposal}</Text>
                  )}
                  {transaction.recipient && (
                    <Text style={styles.failedDetail}>To: {transaction.recipient}</Text>
                  )}
                  <Text style={styles.failedReason}>❌ {transaction.reason}</Text>
                  <Text style={styles.failedTime}>{transaction.failedTime}</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>📡</Text>
          <Text style={styles.infoTitle}>How Offline Queue Works</Text>
          <Text style={styles.infoText}>
            When you're offline, CIVITAS queues your transactions locally with end-to-end encryption. 
            Once you reconnect, transactions are automatically synced to the blockchain in order of priority.
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✓ Secure local storage</Text>
            <Text style={styles.featureItem}>✓ Priority-based syncing</Text>
            <Text style={styles.featureItem}>✓ Automatic retry on failure</Text>
            <Text style={styles.featureItem}>✓ Works with mesh networks</Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#0f3460',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f44336',
    marginRight: 6,
  },
  statusDotOnline: {
    backgroundColor: '#4caf50',
  },
  statusText: {
    fontSize: 12,
    color: '#8b8b8b',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  banner: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  bannerOffline: {
    backgroundColor: '#1a1a2e',
    borderColor: '#ff9800',
  },
  bannerOnline: {
    backgroundColor: '#1a1a2e',
    borderColor: '#4caf50',
  },
  bannerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 13,
    color: '#c4c4c4',
    lineHeight: 18,
  },
  syncButton: {
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  syncButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f3460',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  settingCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#8b8b8b',
    lineHeight: 16,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#0f3460',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8b8b8b',
  },
  toggleThumbActive: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-end',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    marginTop: 8,
  },
  emptyState: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8b8b8b',
    textAlign: 'center',
    lineHeight: 20,
  },
  transactionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
    padding: 16,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  transactionTitleSection: {
    flex: 1,
  },
  transactionAction: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  transactionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  detailLabel: {
    fontSize: 13,
    color: '#8b8b8b',
    minWidth: 90,
  },
  detailValue: {
    fontSize: 13,
    color: '#c4c4c4',
    flex: 1,
  },
  detailValueMono: {
    fontSize: 12,
    color: '#c4c4c4',
    fontFamily: 'monospace',
    flex: 1,
  },
  detailValueHighlight: {
    fontSize: 14,
    color: '#0f3460',
    fontWeight: 'bold',
    flex: 1,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#16213e',
    marginBottom: 12,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
    color: '#8b8b8b',
    marginRight: 6,
  },
  statusValue: {
    fontSize: 13,
    color: '#0f3460',
    fontWeight: 'bold',
    marginRight: 6,
  },
  retriesText: {
    fontSize: 11,
    color: '#ff9800',
  },
  transactionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 3,
    backgroundColor: '#0f3460',
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 3,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0f3460',
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonSecondaryText: {
    color: '#0f3460',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonDanger: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 3,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonDangerText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '600',
  },
  failedCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f44336',
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  failedContent: {
    flex: 1,
    marginLeft: 8,
  },
  failedAction: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  failedDetail: {
    fontSize: 12,
    color: '#c4c4c4',
    marginBottom: 2,
  },
  failedReason: {
    fontSize: 12,
    color: '#f44336',
    marginBottom: 4,
  },
  failedTime: {
    fontSize: 11,
    color: '#8b8b8b',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  infoCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#c4c4c4',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  featureList: {
    alignSelf: 'stretch',
  },
  featureItem: {
    fontSize: 13,
    color: '#c4c4c4',
    marginVertical: 3,
  },
});
