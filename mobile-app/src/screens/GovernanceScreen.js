import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useServices } from '../hooks/useServices';

export default function GovernanceScreen() {
  const { wallet, isConnected, balance, reputation, contractService } = useApp();
  const { vote, createNewProposal, getProposal } = useServices();

  const [votingPower, setVotingPower] = useState(0);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (isConnected && wallet?.address) {
      loadGovernanceData();
    }
  }, [isConnected, wallet?.address]);

  const loadGovernanceData = async () => {
    try {
      setLoading(true);

      // Get voting power from contract
      const power = await contractService.getVotingPower(wallet.address);
      setVotingPower(power);

      // Try to load recent proposals (IDs 0-5)
      const loadedProposals = [];
      for (let i = 0; i < 5; i++) {
        const proposalData = await getProposal(i);
        if (proposalData) {
          const hasVoted = await contractService.hasVoted(i, wallet.address);
          loadedProposals.push({
            id: i,
            ...proposalData,
            hasVoted,
          });
        }
      }

      setProposals(loadedProposals);
    } catch (error) {
      console.error('Failed to load governance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId, support) => {
    if (!isConnected) {
      Alert.alert('Not Connected', 'Please connect your wallet first');
      return;
    }

    try {
      setVoting(true);
      Alert.alert(
        'Cast Vote',
        `Vote ${support ? 'FOR' : 'AGAINST'} this proposal?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              try {
                await vote(proposalId, support);
                Alert.alert('Success', 'Your vote has been recorded!');
                loadGovernanceData(); // Refresh
              } catch (error) {
                Alert.alert('Error', error.message || 'Failed to cast vote');
              }
            },
          },
        ]
      );
    } finally {
      setVoting(false);
    }
  };

  const handleCreateProposal = () => {
    Alert.alert(
      'Create Proposal',
      'Creating governance proposals requires a minimum reputation and CIV stake. This feature will be enabled in the full version.',
      [{ text: 'OK' }]
    );
  };

  const getTimeRemaining = (endTime) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = endTime - now;
    const days = Math.floor(remaining / 86400);
    return days > 0 ? `${days} days left` : 'Voting ended';
  };

  const getVotePercentage = (forVotes, againstVotes) => {
    const total = forVotes + againstVotes;
    if (total === 0) return { forPercent: 0, againstPercent: 0 };
    return {
      forPercent: Math.round((forVotes / total) * 100),
      againstPercent: Math.round((againstVotes / total) * 100),
    };
  };

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.disconnectedContainer}>
          <Text style={styles.disconnectedTitle}>🔌 Wallet Not Connected</Text>
          <Text style={styles.disconnectedText}>
            Connect your wallet to participate in governance
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Governance</Text>
          <Text style={styles.subtitle}>DAO • Decentralized Decision Making</Text>
        </View>

        <View style={styles.votingPowerCard}>
          <Text style={styles.votingPowerLabel}>Your Voting Power</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#0f3460" />
          ) : (
            <>
              <Text style={styles.votingPowerValue}>{votingPower.toLocaleString()}</Text>
              <Text style={styles.votingPowerDescription}>
                Based on CIV stake ({balance?.toFixed(2)} CIV) + reputation ({reputation})
              </Text>
            </>
          )}
        </View>

        <View style={styles.proposalsSection}>
          <Text style={styles.sectionTitle}>
            {proposals.length > 0 ? 'Active Proposals' : 'No Active Proposals'}
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0f3460" />
              <Text style={styles.loadingText}>Loading proposals...</Text>
            </View>
          ) : proposals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No proposals yet. Be the first to create one!
              </Text>
            </View>
          ) : (
            proposals.map((proposal) => {
              const { forPercent, againstPercent } = getVotePercentage(
                proposal.forVotes,
                proposal.againstVotes
              );
              const timeLeft = getTimeRemaining(proposal.endTime);
              const isActive = proposal.status === 0; // 0 = Active

              return (
                <View key={proposal.id} style={styles.proposalCard}>
                  <View style={styles.proposalHeader}>
                    <Text style={[styles.proposalBadge, !isActive && styles.inactiveBadge]}>
                      {isActive ? '🔴 Active' : '⚪ Closed'}
                    </Text>
                    <Text style={styles.proposalDeadline}>{timeLeft}</Text>
                  </View>
                  <Text style={styles.proposalTitle}>
                    #{proposal.id}: {proposal.title}
                  </Text>
                  <Text style={styles.proposalDescription}>
                    {proposal.description}
                  </Text>
                  <View style={styles.voteStats}>
                    <View style={styles.voteBar}>
                      <View style={[styles.voteBarFill, { width: `${forPercent}%` }]} />
                    </View>
                    <View style={styles.voteNumbers}>
                      <Text style={styles.voteFor}>For: {forPercent}%</Text>
                      <Text style={styles.voteAgainst}>Against: {againstPercent}%</Text>
                    </View>
                    <Text style={styles.totalVotes}>
                      Total: {(proposal.forVotes + proposal.againstVotes).toLocaleString()} votes
                    </Text>
                  </View>
                  
                  {proposal.hasVoted ? (
                    <View style={styles.votedBadge}>
                      <Text style={styles.votedText}>✓ You voted</Text>
                    </View>
                  ) : isActive ? (
                    <View style={styles.voteButtons}>
                      <TouchableOpacity
                        style={[styles.voteButton, styles.voteForButton]}
                        onPress={() => handleVote(proposal.id, true)}
                        disabled={voting}
                      >
                        <Text style={styles.voteButtonText}>Vote For</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.voteButton, styles.voteAgainstButton]}
                        onPress={() => handleVote(proposal.id, false)}
                        disabled={voting}
                      >
                        <Text style={styles.voteButtonText}>Vote Against</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        <TouchableOpacity style={styles.createProposalButton} onPress={handleCreateProposal}>
          <Text style={styles.createProposalText}>+ Create New Proposal</Text>
        </TouchableOpacity>

        <View style={styles.infoNote}>
          <Text style={styles.infoNoteTitle}>📊 Quadratic Voting</Text>
          <Text style={styles.infoNoteText}>
            CIVITAS uses quadratic voting to prevent whale dominance. 
            Your vote weight is calculated using both token stake and reputation.
          </Text>
        </View>

        <View style={styles.statusNote}>
          <Text style={styles.statusNoteTitle}>🔗 Connected to Hardhat Local Network</Text>
          <Text style={styles.statusNoteText}>
            Address: {wallet?.address?.slice(0, 10)}...{wallet?.address?.slice(-8)}
          </Text>
          <Text style={styles.statusNoteText}>
            Voting Power: {votingPower} | Balance: {balance?.toFixed(4)} CIV
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
  votingPowerCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  votingPowerLabel: {
    fontSize: 14,
    color: '#8b8b8b',
    marginBottom: 8,
  },
  votingPowerValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0f3460',
    marginBottom: 8,
  },
  votingPowerDescription: {
    fontSize: 12,
    color: '#8b8b8b',
    textAlign: 'center',
  },
  proposalsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#8b8b8b',
    marginTop: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
  },
  emptyStateText: {
    color: '#8b8b8b',
    textAlign: 'center',
    fontSize: 14,
  },
  proposalCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  proposalBadge: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: '600',
  },
  inactiveBadge: {
    color: '#8b8b8b',
  },
  proposalDeadline: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  proposalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  proposalDescription: {
    fontSize: 13,
    color: '#c4c4c4',
    lineHeight: 20,
    marginBottom: 16,
  },
  voteStats: {
    marginBottom: 16,
  },
  voteBar: {
    height: 8,
    backgroundColor: '#16213e',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  voteBarFill: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  voteNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  voteFor: {
    fontSize: 12,
    color: '#4caf50',
  },
  voteAgainst: {
    fontSize: 12,
    color: '#f44336',
  },
  totalVotes: {
    fontSize: 11,
    color: '#8b8b8b',
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  voteButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  voteForButton: {
    backgroundColor: '#4caf50',
  },
  voteAgainstButton: {
    backgroundColor: '#f44336',
  },
  voteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  votedBadge: {
    backgroundColor: '#16213e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  votedText: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: '600',
  },
  createProposalButton: {
    margin: 20,
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f3460',
    borderStyle: 'dashed',
  },
  createProposalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f3460',
  },
  infoNote: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  infoNoteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  infoNoteText: {
    fontSize: 12,
    color: '#8b8b8b',
    lineHeight: 18,
  },
  statusNote: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#16213e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  statusNoteTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f3460',
    marginBottom: 6,
  },
  statusNoteText: {
    fontSize: 11,
    color: '#8b8b8b',
    marginTop: 2,
  },
});
