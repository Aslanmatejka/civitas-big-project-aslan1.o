import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

export default function NodeScreen() {
  const { wallet, isConnected, balance } = useApp();
  const [isOperator] = useState(false); // User is not a node operator yet
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && wallet?.address) {
      loadNodeData();
    }
  }, [isConnected, wallet?.address]);

  const loadNodeData = async () => {
    try {
      setLoading(false);
      // TODO: Load actual node operator status from blockchain
    } catch (error) {
      console.error('Error loading node data:', error);
      setLoading(false);
    }
  };

  const handleApplyNode = () => {
    if (!wallet?.address) {
      Alert.alert('Connect Wallet', 'Please connect your wallet first');
      return;
    }
    if ((balance || 0) < 10000) {
      Alert.alert('Insufficient Balance', 'You need at least 10,000 CIV to run a node');
      return;
    }
    Alert.alert('Apply to Run Node', 'Node operator application coming soon!');
  };

  const handleDelegate = () => {
    if (!wallet?.address) {
      Alert.alert('Connect Wallet', 'Please connect your wallet first');
      return;
    }
    Alert.alert('Delegate Stake', 'Staking delegation feature coming soon!');
  };

  // Disconnected state
  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.disconnectedContainer}>
          <Text style={styles.disconnectedTitle}>Wallet Not Connected</Text>
          <Text style={styles.disconnectedText}>
            Connect your wallet to view node network
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Node Network</Text>
          <Text style={styles.subtitle}>Become a Validator • Earn Rewards</Text>
        </View>

        {/* Network Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>247</Text>
            <Text style={styles.statLabel}>Active Nodes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>99.9%</Text>
            <Text style={styles.statLabel}>Uptime</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>5.2s</Text>
            <Text style={styles.statLabel}>Block Time</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>12%</Text>
            <Text style={styles.statLabel}>APY Rewards</Text>
          </View>
        </View>

        {!isOperator ? (
          <>
            {/* Become a Node Operator */}
            <View style={styles.becomeOperatorCard}>
              <Text style={styles.cardTitle}>🚀 Become a Node Operator</Text>
              <Text style={styles.cardDescription}>
                Run a validator node and earn CIV rewards while securing the network.
              </Text>
              <View style={styles.requirementsList}>
                <View style={styles.requirementItem}>
                  <Text style={styles.requirementIcon}>✓</Text>
                  <Text style={styles.requirementText}>
                    Minimum 10,000 CIV stake
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <Text style={styles.requirementIcon}>✓</Text>
                  <Text style={styles.requirementText}>
                    99% uptime commitment
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <Text style={styles.requirementIcon}>✓</Text>
                  <Text style={styles.requirementText}>
                    Technical knowledge required
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.applyButton} onPress={handleApplyNode}>
                <Text style={styles.applyButtonText}>Apply to Run Node</Text>
              </TouchableOpacity>
              <Text style={styles.balanceNote}>
                Your balance: {balance || 0} CIV
              </Text>
            </View>

            {/* Delegation Option */}
            <View style={styles.delegationCard}>
              <Text style={styles.cardTitle}>💰 Delegate Your Stake</Text>
              <Text style={styles.cardDescription}>
                Don't want to run a node? Delegate your CIV to a validator and earn passive rewards.
              </Text>
              <View style={styles.rewardsInfo}>
                <Text style={styles.rewardsLabel}>Estimated APY:</Text>
                <Text style={styles.rewardsValue}>10-12%</Text>
              </View>
              <TouchableOpacity style={styles.delegateButton} onPress={handleDelegate}>
                <Text style={styles.delegateButtonText}>Delegate Now</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Node Operator Dashboard */}
            <View style={styles.operatorDashboard}>
              <Text style={styles.sectionTitle}>Your Node Status</Text>
              <View style={styles.nodeStatusCard}>
                <View style={styles.statusIndicator}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Online</Text>
                </View>
                <View style={styles.nodeStats}>
                  <View style={styles.nodeStat}>
                    <Text style={styles.nodeStatLabel}>Uptime</Text>
                    <Text style={styles.nodeStatValue}>99.8%</Text>
                  </View>
                  <View style={styles.nodeStat}>
                    <Text style={styles.nodeStatLabel}>Blocks Signed</Text>
                    <Text style={styles.nodeStatValue}>12,456</Text>
                  </View>
                  <View style={styles.nodeStat}>
                    <Text style={styles.nodeStatLabel}>Missed Blocks</Text>
                    <Text style={styles.nodeStatValue}>23</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Top Validators */}
        <View style={styles.validatorsSection}>
          <Text style={styles.sectionTitle}>Top Validators</Text>
          
          <View style={styles.validatorCard}>
            <View style={styles.validatorRank}>
              <Text style={styles.rankNumber}>1</Text>
            </View>
            <View style={styles.validatorInfo}>
              <Text style={styles.validatorName}>CIVITAS Foundation</Text>
              <Text style={styles.validatorStats}>
                Stake: 1.2M CIV • Commission: 10%
              </Text>
            </View>
            <TouchableOpacity style={styles.delegateSmallButton}>
              <Text style={styles.delegateSmallText}>Delegate</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.validatorCard}>
            <View style={styles.validatorRank}>
              <Text style={styles.rankNumber}>2</Text>
            </View>
            <View style={styles.validatorInfo}>
              <Text style={styles.validatorName}>Southeast Asia Nodes</Text>
              <Text style={styles.validatorStats}>
                Stake: 850K CIV • Commission: 8%
              </Text>
            </View>
            <TouchableOpacity style={styles.delegateSmallButton}>
              <Text style={styles.delegateSmallText}>Delegate</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.validatorCard}>
            <View style={styles.validatorRank}>
              <Text style={styles.rankNumber}>3</Text>
            </View>
            <View style={styles.validatorInfo}>
              <Text style={styles.validatorName}>Latin America Collective</Text>
              <Text style={styles.validatorStats}>
                Stake: 720K CIV • Commission: 9%
              </Text>
            </View>
            <TouchableOpacity style={styles.delegateSmallButton}>
              <Text style={styles.delegateSmallText}>Delegate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>⚡ Node Rewards</Text>
          <Text style={styles.infoText}>
            Validators earn block rewards and transaction fees. Delegators receive a share of rewards minus the validator's commission.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({  container: {
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16213e',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f3460',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#8b8b8b',
    textAlign: 'center',
  },
  becomeOperatorCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: '#c4c4c4',
    lineHeight: 20,
    marginBottom: 16,
  },
  requirementsList: {
    marginBottom: 20,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  requirementIcon: {
    fontSize: 16,
    color: '#4caf50',
    marginRight: 10,
  },
  requirementText: {
    fontSize: 14,
    color: '#c4c4c4',
  },
  applyButton: {
    backgroundColor: '#0f3460',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  delegationCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  rewardsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  rewardsLabel: {
    fontSize: 14,
    color: '#8b8b8b',
  },
  rewardsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  delegateButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0f3460',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  delegateButtonText: {
    color: '#0f3460',
    fontSize: 14,
    fontWeight: '600',
  },
  validatorsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  validatorCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16213e',
  },
  validatorRank: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  validatorInfo: {
    flex: 1,
  },
  validatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  validatorStats: {
    fontSize: 11,
    color: '#8b8b8b',
  },
  delegateSmallButton: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  delegateSmallText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
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
  operatorDashboard: {
    padding: 20,
  },
  nodeStatusCard: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4caf50',
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
  },
  nodeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nodeStat: {
    alignItems: 'center',
  },
  nodeStatLabel: {
    fontSize: 12,
    color: '#8b8b8b',
    marginBottom: 6,
  },
  nodeStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f3460',
  },
});
