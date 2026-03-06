import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

export default function AIScreen() {
  const { wallet, isConnected, balance, reputation } = useApp();
  const [query, setQuery] = useState('');

  const handleAskAI = (question) => {
    if (!wallet?.address) {
      Alert.alert('Connect Wallet', 'Please connect your wallet first');
      return;
    }
    Alert.alert('AI Assistant', `AI feature coming soon!\n\nQuestion: ${question}`);
  };

  // Disconnected state
  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.disconnectedContainer}>
          <Text style={styles.disconnectedTitle}>Wallet Not Connected</Text>
          <Text style={styles.disconnectedText}>
            Connect your wallet to use AI Assistant
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>AI Assistant</Text>
          <Text style={styles.subtitle}>Powered by xAI Integration</Text>
        </View>

        {/* AI Chat Interface */}
        <View style={styles.chatSection}>
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>🤖</Text>
          </View>
          <Text style={styles.welcomeText}>
            Hello! I'm your CIVITAS AI assistant. I can help you with:
          </Text>
          
          <View style={styles.capabilitiesGrid}>
            <View style={styles.capabilityCard}>
              <Text style={styles.capabilityIcon}>💡</Text>
              <Text style={styles.capabilityText}>Smart Contract Insights</Text>
            </View>
            <View style={styles.capabilityCard}>
              <Text style={styles.capabilityIcon}>🔍</Text>
              <Text style={styles.capabilityText}>Transaction Analysis</Text>
            </View>
            <View style={styles.capabilityCard}>
              <Text style={styles.capabilityIcon}>📊</Text>
              <Text style={styles.capabilityText}>Market Trends</Text>
            </View>
            <View style={styles.capabilityCard}>
              <Text style={styles.capabilityIcon}>🎯</Text>
              <Text style={styles.capabilityText}>DeFi Strategies</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Questions</Text>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleAskAI('What are the best staking opportunities?')}
          >
            <Text style={styles.quickActionText}>
              💰 What are the best staking opportunities?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleAskAI('Analyze my transaction patterns')}
          >
            <Text style={styles.quickActionText}>
              📈 Analyze my transaction patterns
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleAskAI('How can I improve my security?')}
          >
            <Text style={styles.quickActionText}>
              🔐 How can I improve my security?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleAskAI('Show me impact projects in my region')}
          >
            <Text style={styles.quickActionText}>
              🌍 Show me impact projects in my region
            </Text>
          </TouchableOpacity>
        </View>

        {/* AI Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>AI-Powered Features</Text>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureIcon}>🛡️</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Fraud Detection</Text>
                <Text style={styles.featureStatus}>Active</Text>
              </View>
            </View>
            <Text style={styles.featureDescription}>
              Real-time monitoring of transactions for suspicious patterns
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureIcon}>⭐</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Reputation Scoring</Text>
                <Text style={styles.featureStatus}>Active</Text>
              </View>
            </View>
            <Text style={styles.featureDescription}>
              AI analyzes on-chain behavior to calculate trust scores
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureIcon}>📝</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Content Moderation</Text>
                <Text style={styles.featureStatus}>Active</Text>
              </View>
            </View>
            <Text style={styles.featureDescription}>
              Automated filtering of harmful content in community spaces
            </Text>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureIcon}>🎓</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>Personalized Learning</Text>
                <Text style={styles.featureStatus}>Beta</Text>
              </View>
            </View>
            <Text style={styles.featureDescription}>
              Customized blockchain education based on your experience level
            </Text>
          </View>
        </View>

        {/* Recent AI Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Recent Insights</Text>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightBadge}>💡 TIP</Text>
              <Text style={styles.insightTime}>2 hours ago</Text>
            </View>
            <Text style={styles.insightText}>
              Your staking rewards could increase by 15% if you delegate to validators with lower commission rates.
            </Text>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightBadge}>📊 TREND</Text>
              <Text style={styles.insightTime}>1 day ago</Text>
            </View>
            <Text style={styles.insightText}>
              Marketplace activity in the Services category is up 42% this week - good time to list your skills.
            </Text>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightBadge}>⚠️ ALERT</Text>
              <Text style={styles.insightTime}>3 days ago</Text>
            </View>
            <Text style={styles.insightText}>
              Unusual transaction pattern detected - consider reviewing your recent activity for security.
            </Text>
          </View>
        </View>

        {/* Chat Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.input}
            placeholder="Ask me anything about CIVITAS..."
            placeholderTextColor="#8b8b8b"
            value={query}
            onChangeText={setQuery}
            multiline
          />
          <TouchableOpacity style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>🔒 Privacy First</Text>
          <Text style={styles.privacyText}>
            All AI processing happens with encrypted data. Your personal information never leaves your device unencrypted.
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
  chatSection: {
    padding: 20,
    alignItems: 'center',
  },
  aiAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#0f3460',
  },
  aiAvatarText: {
    fontSize: 36,
  },
  welcomeText: {
    fontSize: 14,
    color: '#c4c4c4',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  capabilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  capabilityCard: {
    width: '48%',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16213e',
  },
  capabilityIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  capabilityText: {
    fontSize: 12,
    color: '#c4c4c4',
    textAlign: 'center',
  },
  quickActionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  quickActionButton: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  quickActionText: {
    fontSize: 14,
    color: '#c4c4c4',
  },
  featuresSection: {
    padding: 20,
    paddingTop: 0,
  },
  featureCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  featureStatus: {
    fontSize: 11,
    color: '#4caf50',
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: 13,
    color: '#8b8b8b',
    lineHeight: 18,
  },
  insightsSection: {
    padding: 20,
    paddingTop: 0,
  },
  insightCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  insightBadge: {
    fontSize: 11,
    color: '#0f3460',
    fontWeight: 'bold',
  },
  insightTime: {
    fontSize: 11,
    color: '#8b8b8b',
  },
  insightText: {
    fontSize: 13,
    color: '#c4c4c4',
    lineHeight: 18,
  },
  inputSection: {
    padding: 20,
    paddingTop: 0,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  sendButton: {
    backgroundColor: '#0f3460',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  privacyCard: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 12,
    color: '#8b8b8b',
    lineHeight: 18,
  },
});
