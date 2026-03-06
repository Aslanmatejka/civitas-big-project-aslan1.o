import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useServices } from '../hooks/useServices';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { wallet, isConnected, balance, reputation } = useApp();
  const { contractService } = useServices();
  const [timePeriod, setTimePeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [networkStats, setNetworkStats] = useState(null);
  const [userStats, setUserStats] = useState({
    transactions: 0,
    governanceVotes: 0,
    totalVotes: 0
  });

  useEffect(() => {
    if (isConnected && wallet?.address) {
      loadAnalyticsData();
    }
  }, [isConnected, wallet?.address, timePeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Get user transaction history
      const history = await contractService.getTransactionHistory(wallet.address);
      
      // Get governance participation
      let votesParticipated = 0;
      let totalProposals = 0;
      for (let i = 0; i < 10; i++) {
        try {
          const proposal = await contractService.getProposal(i);
          if (proposal && proposal.id !== undefined) {
            totalProposals++;
            const hasVoted = await contractService.hasVoted(i, wallet.address);
            if (hasVoted) votesParticipated++;
          }
        } catch (e) {
          break; // No more proposals
        }
      }
      
      setUserStats({
        transactions: history?.length || 0,
        governanceVotes: votesParticipated,
        totalVotes: totalProposals
      });
      
      // Mock network stats (in production, get from backend API)
      setNetworkStats({
        activeUsers: 2400000,
        totalVolume: 58000000,
        transactions: 450000,
        countries: 147
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGovernancePercentage = () => {
    if (userStats.totalVotes === 0) return 0;
    return Math.round((userStats.governanceVotes / userStats.totalVotes) * 100);
  };

  // Disconnected state
  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.disconnectedContainer}>
          <Text style={styles.disconnectedTitle}>Wallet Not Connected</Text>
          <Text style={styles.disconnectedText}>
            Connect your wallet to view analytics
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Network Insights & Your Impact</Text>
        </View>

        {/* Time Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity 
            style={[styles.periodButton, timePeriod === 'day' && styles.periodButtonActive]}
            onPress={() => setTimePeriod('day')}
          >
            <Text style={[styles.periodText, timePeriod === 'day' && styles.periodTextActive]}>24H</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.periodButton, timePeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setTimePeriod('week')}
          >
            <Text style={[styles.periodText, timePeriod === 'week' && styles.periodTextActive]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.periodButton, timePeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setTimePeriod('month')}
          >
            <Text style={[styles.periodText, timePeriod === 'month' && styles.periodTextActive]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.periodButton, timePeriod === 'year' && styles.periodButtonActive]}
            onPress={() => setTimePeriod('year')}
          >
            <Text style={[styles.periodText, timePeriod === 'year' && styles.periodTextActive]}>Year</Text>
          </TouchableOpacity>
        </View>

        {/* Network Overview */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Network Overview</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#0f3460" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricIcon}>👥</Text>
                <Text style={styles.metricValue}>{networkStats ? (networkStats.activeUsers / 1000000).toFixed(1) + 'M' : '0'}</Text>
                <Text style={styles.metricLabel}>Active Users</Text>
                <Text style={styles.metricChange}>+12.5%</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricIcon}>💰</Text>
                <Text style={styles.metricValue}>${networkStats ? (networkStats.totalVolume / 1000000).toFixed(0) + 'M' : '0'}</Text>
                <Text style={styles.metricLabel}>Total Volume</Text>
                <Text style={styles.metricChange}>+8.3%</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricIcon}>📝</Text>
                <Text style={styles.metricValue}>{networkStats ? (networkStats.transactions / 1000).toFixed(0) + 'K' : '0'}</Text>
                <Text style={styles.metricLabel}>Transactions</Text>
                <Text style={styles.metricChange}>+15.7%</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricIcon}>🌍</Text>
                <Text style={styles.metricValue}>{networkStats?.countries || 0}</Text>
                <Text style={styles.metricLabel}>Countries</Text>
                <Text style={styles.metricChange}>+3</Text>
              </View>
            </View>
          )}
        </View>

        {/* Simple Chart Visualization */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Transaction Volume</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chart}>
              {/* Simulated bar chart */}
              <View style={styles.chartBars}>
                <View style={[styles.bar, { height: '45%' }]} />
                <View style={[styles.bar, { height: '60%' }]} />
                <View style={[styles.bar, { height: '52%' }]} />
                <View style={[styles.bar, { height: '78%' }]} />
                <View style={[styles.bar, { height: '85%' }]} />
                <View style={[styles.bar, { height: '92%' }]} />
                <View style={[styles.bar, { height: '100%', backgroundColor: '#0f3460' }]} />
              </View>
              <View style={styles.chartLabels}>
                <Text style={styles.chartLabel}>Mon</Text>
                <Text style={styles.chartLabel}>Tue</Text>
                <Text style={styles.chartLabel}>Wed</Text>
                <Text style={styles.chartLabel}>Thu</Text>
                <Text style={styles.chartLabel}>Fri</Text>
                <Text style={styles.chartLabel}>Sat</Text>
                <Text style={styles.chartLabel}>Sun</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Your Impact */}
        <View style={styles.impactSection}>
          <Text style={styles.sectionTitle}>Your Impact</Text>
          
          <View style={styles.impactCard}>
            <View style={styles.impactHeader}>
              <Text style={styles.impactTitle}>Transactions Made</Text>
              <Text style={styles.impactValue}>{userStats.transactions}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: Math.min(userStats.transactions * 0.5, 100) + '%' }]} />
            </View>
            <Text style={styles.impactSubtext}>Your transaction history</Text>
          </View>

          <View style={styles.impactCard}>
            <View style={styles.impactHeader}>
              <Text style={styles.impactTitle}>Your Reputation</Text>
              <Text style={styles.impactValue}>{reputation || 0}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: Math.min((reputation || 0) * 0.1, 100) + '%', backgroundColor: '#4caf50' }]} />
            </View>
            <Text style={styles.impactSubtext}>Earned through participation</Text>
          </View>

          <View style={styles.impactCard}>
            <View style={styles.impactHeader}>
              <Text style={styles.impactTitle}>Governance Participation</Text>
              <Text style={styles.impactValue}>{userStats.governanceVotes}/{userStats.totalVotes}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: getGovernancePercentage() + '%', backgroundColor: '#ff9800' }]} />
            </View>
            <Text style={styles.impactSubtext}>Voted on {userStats.governanceVotes} of {userStats.totalVotes} proposals</Text>
          </View>
        </View>

        {/* Regional Distribution */}
        <View style={styles.regionalSection}>
          <Text style={styles.sectionTitle}>Regional Distribution</Text>

          <View style={styles.regionItem}>
            <Text style={styles.regionName}>🌍 Africa</Text>
            <View style={styles.regionBar}>
              <View style={[styles.regionFill, { width: '28%' }]} />
            </View>
            <Text style={styles.regionPercentage}>28%</Text>
          </View>

          <View style={styles.regionItem}>
            <Text style={styles.regionName}>🇸🇬 SE Asia</Text>
            <View style={styles.regionBar}>
              <View style={[styles.regionFill, { width: '24%' }]} />
            </View>
            <Text style={styles.regionPercentage}>24%</Text>
          </View>

          <View style={styles.regionItem}>
            <Text style={styles.regionName}>🇮🇳 South Asia</Text>
            <View style={styles.regionBar}>
              <View style={[styles.regionFill, { width: '20%' }]} />
            </View>
            <Text style={styles.regionPercentage}>20%</Text>
          </View>

          <View style={styles.regionItem}>
            <Text style={styles.regionName}>🇧🇷 Latin America</Text>
            <View style={styles.regionBar}>
              <View style={[styles.regionFill, { width: '16%' }]} />
            </View>
            <Text style={styles.regionPercentage}>16%</Text>
          </View>

          <View style={styles.regionItem}>
            <Text style={styles.regionName}>🇸🇦 MENA</Text>
            <View style={styles.regionBar}>
              <View style={[styles.regionFill, { width: '8%' }]} />
            </View>
            <Text style={styles.regionPercentage}>8%</Text>
          </View>

          <View style={styles.regionItem}>
            <Text style={styles.regionName}>🌎 Others</Text>
            <View style={styles.regionBar}>
              <View style={[styles.regionFill, { width: '4%' }]} />
            </View>
            <Text style={styles.regionPercentage}>4%</Text>
          </View>
        </View>

        {/* Environmental Impact / Carbon Offset */}
        <View style={styles.environmentalSection}>
          <Text style={styles.sectionTitle}>🌱 Environmental Impact</Text>
          
          {/* Carbon Offset Summary Card */}
          <View style={styles.carbonSummaryCard}>
            <View style={styles.carbonHeader}>
              <Text style={styles.carbonIcon}>🌍</Text>
              <View style={styles.carbonHeaderText}>
                <Text style={styles.carbonTitle}>Your Carbon Savings</Text>
                <Text style={styles.carbonSubtitle}>vs. Traditional Banking</Text>
              </View>
            </View>

            <View style={styles.carbonMainStat}>
              <Text style={styles.carbonValue}>142</Text>
              <Text style={styles.carbonUnit}>kg CO₂</Text>
            </View>
            <Text style={styles.carbonEquivalent}>
              equivalent to planting 8 trees 🌳
            </Text>

            <View style={styles.carbonBreakdown}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>This Month:</Text>
                <Text style={styles.breakdownValue}>32 kg</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Since Joining:</Text>
                <Text style={styles.breakdownValue}>142 kg</Text>
              </View>
            </View>
          </View>

          {/* Green Consensus Benefits */}
          <View style={styles.greenConsensusCard}>
            <Text style={styles.consensusTitle}>♻️ Green Consensus</Text>
            <Text style={styles.consensusDescription}>
              CIVITAS uses Proof-of-Stake consensus, which consumes 99.95% less energy than traditional Proof-of-Work blockchains.
            </Text>
            
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Traditional Banking</Text>
                <View style={styles.comparisonBar}>
                  <View style={[styles.comparisonFill, { width: '100%', backgroundColor: '#f44336' }]} />
                </View>
                <Text style={styles.comparisonValue}>~263 TWh/year</Text>
              </View>
              
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Bitcoin (PoW)</Text>
                <View style={styles.comparisonBar}>
                  <View style={[styles.comparisonFill, { width: '60%', backgroundColor: '#ff9800' }]} />
                </View>
                <Text style={styles.comparisonValue}>~150 TWh/year</Text>
              </View>
              
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>CIVITAS (PoS)</Text>
                <View style={styles.comparisonBar}>
                  <View style={[styles.comparisonFill, { width: '2%', backgroundColor: '#4caf50' }]} />
                </View>
                <Text style={styles.comparisonValue}>~0.05 TWh/year</Text>
              </View>
            </View>
          </View>

          {/* Tree Planting Contributions */}
          <View style={styles.treePlantingCard}>
            <Text style={styles.treePlantingTitle}>🌳 Carbon Offset Program</Text>
            <Text style={styles.treePlantingDescription}>
              A portion of network transaction fees funds tree planting and reforestation projects across underserved communities in Africa, Asia, and Latin America
            </Text>

            <View style={styles.treePlantingStats}>
              <View style={styles.treeStat}>
                <Text style={styles.treeStatValue}>1,247</Text>
                <Text style={styles.treeStatLabel}>Trees Planted</Text>
              </View>
              <View style={styles.treeStat}>
                <Text style={styles.treeStatValue}>42</Text>
                <Text style={styles.treeStatLabel}>Tons CO₂/year</Text>
              </View>
              <View style={styles.treeStat}>
                <Text style={styles.treeStatValue}>12</Text>
                <Text style={styles.treeStatLabel}>Communities</Text>
              </View>
            </View>

            <View style={styles.treePlantingProgress}>
              <Text style={styles.progressLabel}>Progress to Next 1,000 Trees:</Text>
              <View style={styles.progressBarLarge}>
                <View style={[styles.progressFillLarge, { width: '24.7%' }]} />
              </View>
              <Text style={styles.progressText}>247 / 1,000</Text>
            </View>

            <TouchableOpacity style={styles.contributeButton}>
              <Text style={styles.contributeButtonText}>🌱 Contribute 1 CIV = 1 Tree</Text>
            </TouchableOpacity>
          </View>

          {/* Sustainable Practices */}
          <View style={styles.sustainablePracticesCard}>
            <Text style={styles.practicesTitle}>✨ Sustainable Practices</Text>
            <View style={styles.practicesList}>
              <View style={styles.practiceItem}>
                <Text style={styles.practiceIcon}>✓</Text>
                <Text style={styles.practiceText}>
                  Renewable energy validators prioritized
                </Text>
              </View>
              <View style={styles.practiceItem}>
                <Text style={styles.practiceIcon}>✓</Text>
                <Text style={styles.practiceText}>
                  Carbon-neutral IPFS storage nodes
                </Text>
              </View>
              <View style={styles.practiceItem}>
                <Text style={styles.practiceIcon}>✓</Text>
                <Text style={styles.practiceText}>
                  Mobile-first design reduces device energy
                </Text>
              </View>
              <View style={styles.practiceItem}>
                <Text style={styles.practiceIcon}>✓</Text>
                <Text style={styles.practiceText}>
                  Offline modes minimize data transmission
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Export Data */}
        <View style={styles.exportSection}>
          <TouchableOpacity style={styles.exportButton}>
            <Text style={styles.exportButtonText}>📊 Export Full Report</Text>
          </TouchableOpacity>
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
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16213e',
  },
  periodButtonActive: {
    backgroundColor: '#0f3460',
    borderColor: '#0f3460',
  },
  periodText: {
    color: '#8b8b8b',
    fontSize: 12,
    fontWeight: '600',
  },
  periodTextActive: {
    color: '#ffffff',
  },
  overviewSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16213e',
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#8b8b8b',
    marginBottom: 6,
  },
  metricChange: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '600',
  },
  chartSection: {
    padding: 20,
    paddingTop: 0,
  },
  chartContainer: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  chart: {
    height: 200,
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  bar: {
    flex: 1,
    backgroundColor: '#0f3460aa',
    marginHorizontal: 2,
    borderRadius: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  chartLabel: {
    fontSize: 10,
    color: '#8b8b8b',
    flex: 1,
    textAlign: 'center',
  },
  impactSection: {
    padding: 20,
    paddingTop: 0,
  },
  impactCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  impactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  impactTitle: {
    fontSize: 14,
    color: '#c4c4c4',
  },
  impactValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#0a0a0f',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0f3460',
    borderRadius: 4,
  },
  impactSubtext: {
    fontSize: 11,
    color: '#8b8b8b',
  },
  regionalSection: {
    padding: 20,
    paddingTop: 0,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  regionName: {
    width: 100,
    fontSize: 14,
    color: '#c4c4c4',
  },
  regionBar: {
    flex: 1,
    height: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  regionFill: {
    height: '100%',
    backgroundColor: '#0f3460',
  },
  regionPercentage: {
    width: 40,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'right',
  },
  exportSection: {
    padding: 20,
    paddingTop: 0,
  },
  exportButton: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  exportButtonText: {
    color: '#0f3460',
    fontSize: 14,
    fontWeight: '600',
  },
  environmentalSection: {
    padding: 20,
    paddingTop: 0,
  },
  carbonSummaryCard: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4caf50',
    marginBottom: 16,
    alignItems: 'center',
  },
  carbonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  carbonIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  carbonHeaderText: {
    flex: 1,
  },
  carbonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  carbonSubtitle: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  carbonMainStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  carbonValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4caf50',
    marginRight: 8,
  },
  carbonUnit: {
    fontSize: 20,
    color: '#c4c4c4',
  },
  carbonEquivalent: {
    fontSize: 14,
    color: '#8b8b8b',
    marginBottom: 16,
  },
  carbonBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#16213e',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#8b8b8b',
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  greenConsensusCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
    marginBottom: 16,
  },
  consensusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  consensusDescription: {
    fontSize: 13,
    color: '#c4c4c4',
    lineHeight: 18,
    marginBottom: 16,
  },
  comparisonRow: {
    gap: 12,
  },
  comparisonItem: {
    marginBottom: 12,
  },
  comparisonLabel: {
    fontSize: 13,
    color: '#c4c4c4',
    marginBottom: 6,
  },
  comparisonBar: {
    height: 8,
    backgroundColor: '#16213e',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  comparisonFill: {
    height: '100%',
  },
  comparisonValue: {
    fontSize: 11,
    color: '#8b8b8b',
  },
  treePlantingCard: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
    marginBottom: 16,
  },
  treePlantingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  treePlantingDescription: {
    fontSize: 13,
    color: '#8b8b8b',
    lineHeight: 18,
    marginBottom: 16,
  },
  treePlantingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#16213e',
    borderRadius: 8,
  },
  treeStat: {
    alignItems: 'center',
  },
  treeStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 4,
  },
  treeStatLabel: {
    fontSize: 11,
    color: '#8b8b8b',
    textAlign: 'center',
  },
  treePlantingProgress: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 13,
    color: '#c4c4c4',
    marginBottom: 8,
  },
  progressBarLarge: {
    height: 12,
    backgroundColor: '#16213e',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFillLarge: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  progressText: {
    fontSize: 12,
    color: '#8b8b8b',
    textAlign: 'center',
  },
  contributeButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  contributeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sustainablePracticesCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  practicesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  practicesList: {
    gap: 10,
  },
  practiceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  practiceIcon: {
    fontSize: 16,
    color: '#4caf50',
    marginRight: 10,
    marginTop: 2,
  },
  practiceText: {
    flex: 1,
    fontSize: 13,
    color: '#c4c4c4',
    lineHeight: 18,
  },
});
