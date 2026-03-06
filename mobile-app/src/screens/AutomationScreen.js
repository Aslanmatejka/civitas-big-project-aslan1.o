import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useApp } from '../context/AppContext';

export default function AutomationScreen({ navigation }) {
  const { wallet, isConnected, balance } = useApp();
  const [activeTab, setActiveTab] = useState('active'); // active, templates, devices

  const handleCreateAutomation = () => {
    if (!wallet?.address) {
      Alert.alert('Connect Wallet', 'Please connect your wallet first');
      return;
    }
    Alert.alert('Create Automation', 'Automation setup feature coming soon!');
  };

  // Disconnected state
  if (!isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.disconnectedContainer}>
          <Text style={styles.disconnectedTitle}>Wallet Not Connected</Text>
          <Text style={styles.disconnectedText}>
            Connect your wallet to create automations
          </Text>
        </View>
      </View>
    );
  }

  // Mock data for active automations
  const activeAutomations = [
    {
      id: 1,
      name: 'Monthly Rent Payment',
      type: 'Recurring Payment',
      status: 'Active',
      schedule: '1st of every month',
      amount: '500 CIV',
      recipient: 'Landlord (0x742...891)',
      nextExecution: 'March 1, 2026',
      enabled: true,
    },
    {
      id: 2,
      name: 'Savings Circle Auto-Transfer',
      type: 'Conditional Transfer',
      status: 'Active',
      condition: 'When balance > 1000 CIV',
      amount: '10% of income',
      recipient: 'Family Savings Circle',
      lastExecution: 'February 20, 2026',
      enabled: true,
    },
    {
      id: 3,
      name: 'Weekly Wallet Backup',
      type: 'Alert',
      status: 'Active',
      schedule: 'Every Sunday 8:00 PM',
      action: 'Reminder notification',
      lastExecution: 'February 23, 2026',
      enabled: true,
    },
    {
      id: 4,
      name: 'Low Balance Alert',
      type: 'Alert',
      status: 'Paused',
      condition: 'When balance < 100 CIV',
      action: 'Push notification',
      lastExecution: 'February 15, 2026',
      enabled: false,
    },
  ];

  // Automation templates
  const templates = [
    {
      id: 1,
      name: 'Bill Payment',
      description: 'Automatically pay recurring bills like rent, utilities, or subscriptions',
      icon: '💰',
      category: 'Payments',
      popular: true,
    },
    {
      id: 2,
      name: 'Savings Goal',
      description: 'Transfer a percentage of income to savings automatically',
      icon: '🎯',
      category: 'Savings',
      popular: true,
    },
    {
      id: 3,
      name: 'Conditional Transfer',
      description: 'Send funds when certain conditions are met (balance, reputation, date)',
      icon: '⚡',
      category: 'Advanced',
      popular: false,
    },
    {
      id: 4,
      name: 'Morning Routine',
      description: 'Daily check: wallet balance, pending tasks, governance votes',
      icon: '🌅',
      category: 'Life Scripts',
      popular: true,
    },
    {
      id: 5,
      name: 'Evening Backup',
      description: 'Nightly reminder to backup important data and review transactions',
      icon: '🌙',
      category: 'Life Scripts',
      popular: false,
    },
    {
      id: 6,
      name: 'Reputation Milestone Alert',
      description: 'Get notified when your reputation crosses key thresholds',
      icon: '🏆',
      category: 'Alerts',
      popular: false,
    },
    {
      id: 7,
      name: 'Community Event Reminder',
      description: 'Auto-remind for upcoming community events you RSVP\'d to',
      icon: '📅',
      category: 'Alerts',
      popular: false,
    },
    {
      id: 8,
      name: 'Donation on Reputation Gain',
      description: 'Automatically donate to causes when you gain reputation points',
      icon: '❤️',
      category: 'Advanced',
      popular: false,
    },
  ];

  // IoT devices (expandable for future)
  const iotDevices = [
    // Empty for now, will show "Connect your first device"
  ];

  // Recent automation history
  const automationHistory = [
    { id: 1, name: 'Monthly Rent Payment', action: 'Executed', time: '2 hours ago', status: 'Success' },
    { id: 2, name: 'Weekly Wallet Backup', action: 'Notification sent', time: '3 days ago', status: 'Success' },
    { id: 3, name: 'Savings Circle Auto-Transfer', action: 'Executed', time: '6 days ago', status: 'Success' },
    { id: 4, name: 'Low Balance Alert', action: 'Alert triggered', time: '11 days ago', status: 'Success' },
  ];

  const renderActiveAutomations = () => (
    <View>
      {/* Stats Overview */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{activeAutomations.filter(a => a.enabled).length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{activeAutomations.filter(a => !a.enabled).length}</Text>
          <Text style={styles.statLabel}>Paused</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>142</Text>
          <Text style={styles.statLabel}>Total Runs</Text>
        </View>
      </View>

      {/* Create New Button */}
      <TouchableOpacity style={styles.createButton}>
        <Text style={styles.createButtonIcon}>➕</Text>
        <Text style={styles.createButtonText}>Create New Automation</Text>
      </TouchableOpacity>

      {/* Active Automations List */}
      <Text style={styles.sectionTitle}>Your Automations</Text>
      {activeAutomations.map((automation) => (
        <View key={automation.id} style={styles.automationCard}>
          <View style={styles.automationHeader}>
            <View style={styles.automationTitleRow}>
              <Text style={styles.automationName}>{automation.name}</Text>
              <View style={[styles.statusBadge, !automation.enabled && styles.statusBadgePaused]}>
                <Text style={styles.statusBadgeText}>{automation.status}</Text>
              </View>
            </View>
            <Text style={styles.automationType}>{automation.type}</Text>
          </View>

          <View style={styles.automationDetails}>
            {automation.schedule && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📅 Schedule:</Text>
                <Text style={styles.detailValue}>{automation.schedule}</Text>
              </View>
            )}
            {automation.condition && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>⚡ Condition:</Text>
                <Text style={styles.detailValue}>{automation.condition}</Text>
              </View>
            )}
            {automation.amount && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>💰 Amount:</Text>
                <Text style={styles.detailValue}>{automation.amount}</Text>
              </View>
            )}
            {automation.recipient && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>👤 Recipient:</Text>
                <Text style={styles.detailValue}>{automation.recipient}</Text>
              </View>
            )}
            {automation.action && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>🔔 Action:</Text>
                <Text style={styles.detailValue}>{automation.action}</Text>
              </View>
            )}
            {automation.nextExecution && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>⏰ Next Run:</Text>
                <Text style={styles.detailValueHighlight}>{automation.nextExecution}</Text>
              </View>
            )}
            {automation.lastExecution && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>✅ Last Run:</Text>
                <Text style={styles.detailValue}>{automation.lastExecution}</Text>
              </View>
            )}
          </View>

          <View style={styles.automationActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>⚙️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>
                {automation.enabled ? '⏸️ Pause' : '▶️ Resume'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonDanger}>
              <Text style={styles.actionButtonTextDanger}>🗑️ Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Recent History */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {automationHistory.map((item) => (
        <View key={item.id} style={styles.historyCard}>
          <View style={styles.historyLeft}>
            <Text style={styles.historyName}>{item.name}</Text>
            <Text style={styles.historyAction}>{item.action}</Text>
          </View>
          <View style={styles.historyRight}>
            <Text style={styles.historyStatus}>{item.status}</Text>
            <Text style={styles.historyTime}>{item.time}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderTemplates = () => (
    <View>
      {/* Popular Templates */}
      <Text style={styles.sectionTitle}>Popular Templates</Text>
      {templates.filter(t => t.popular).map((template) => (
        <TouchableOpacity key={template.id} style={styles.templateCard}>
          <Text style={styles.templateIcon}>{template.icon}</Text>
          <View style={styles.templateInfo}>
            <Text style={styles.templateName}>{template.name}</Text>
            <Text style={styles.templateDescription}>{template.description}</Text>
            <Text style={styles.templateCategory}>{template.category}</Text>
          </View>
          <Text style={styles.templateArrow}>➡️</Text>
        </TouchableOpacity>
      ))}

      {/* All Templates by Category */}
      <Text style={styles.sectionTitle}>All Templates</Text>
      
      {/* Payments */}
      <Text style={styles.categoryTitle}>💰 Payments</Text>
      {templates.filter(t => t.category === 'Payments').map((template) => (
        <TouchableOpacity key={template.id} style={styles.templateCardSmall}>
          <Text style={styles.templateIconSmall}>{template.icon}</Text>
          <View style={styles.templateInfoSmall}>
            <Text style={styles.templateNameSmall}>{template.name}</Text>
            <Text style={styles.templateDescriptionSmall}>{template.description}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Savings */}
      <Text style={styles.categoryTitle}>🎯 Savings</Text>
      {templates.filter(t => t.category === 'Savings').map((template) => (
        <TouchableOpacity key={template.id} style={styles.templateCardSmall}>
          <Text style={styles.templateIconSmall}>{template.icon}</Text>
          <View style={styles.templateInfoSmall}>
            <Text style={styles.templateNameSmall}>{template.name}</Text>
            <Text style={styles.templateDescriptionSmall}>{template.description}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Life Scripts */}
      <Text style={styles.categoryTitle}>🌅 Life Scripts</Text>
      {templates.filter(t => t.category === 'Life Scripts').map((template) => (
        <TouchableOpacity key={template.id} style={styles.templateCardSmall}>
          <Text style={styles.templateIconSmall}>{template.icon}</Text>
          <View style={styles.templateInfoSmall}>
            <Text style={styles.templateNameSmall}>{template.name}</Text>
            <Text style={styles.templateDescriptionSmall}>{template.description}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Alerts */}
      <Text style={styles.categoryTitle}>🔔 Alerts</Text>
      {templates.filter(t => t.category === 'Alerts').map((template) => (
        <TouchableOpacity key={template.id} style={styles.templateCardSmall}>
          <Text style={styles.templateIconSmall}>{template.icon}</Text>
          <View style={styles.templateInfoSmall}>
            <Text style={styles.templateNameSmall}>{template.name}</Text>
            <Text style={styles.templateDescriptionSmall}>{template.description}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* Advanced */}
      <Text style={styles.categoryTitle}>⚡ Advanced</Text>
      {templates.filter(t => t.category === 'Advanced').map((template) => (
        <TouchableOpacity key={template.id} style={styles.templateCardSmall}>
          <Text style={styles.templateIconSmall}>{template.icon}</Text>
          <View style={styles.templateInfoSmall}>
            <Text style={styles.templateNameSmall}>{template.name}</Text>
            <Text style={styles.templateDescriptionSmall}>{template.description}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDevices = () => (
    <View>
      {/* IoT Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>🔌</Text>
        <Text style={styles.infoTitle}>IoT Integration</Text>
        <Text style={styles.infoText}>
          Connect physical devices to automate asset tokenization, smart home controls, and real-world triggers.
        </Text>
      </View>

      {iotDevices.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📱</Text>
          <Text style={styles.emptyTitle}>No Devices Connected</Text>
          <Text style={styles.emptyText}>
            Connect your first IoT device to unlock automation possibilities like:
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Tokenize physical assets (solar panels, vehicles)</Text>
            <Text style={styles.featureItem}>• Trigger payments based on sensor data</Text>
            <Text style={styles.featureItem}>• Automate smart home with blockchain</Text>
            <Text style={styles.featureItem}>• Track environmental impact in real-time</Text>
          </View>
          <TouchableOpacity style={styles.connectButton}>
            <Text style={styles.connectButtonText}>🔗 Connect Device</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {/* Device list would go here */}
          <Text style={styles.sectionTitle}>Connected Devices</Text>
        </View>
      )}

      {/* Supported Devices */}
      <Text style={styles.sectionTitle}>Supported Device Types</Text>
      <View style={styles.deviceTypesGrid}>
        <View style={styles.deviceTypeCard}>
          <Text style={styles.deviceTypeIcon}>☀️</Text>
          <Text style={styles.deviceTypeText}>Solar Panels</Text>
        </View>
        <View style={styles.deviceTypeCard}>
          <Text style={styles.deviceTypeIcon}>🏠</Text>
          <Text style={styles.deviceTypeText}>Smart Home</Text>
        </View>
        <View style={styles.deviceTypeCard}>
          <Text style={styles.deviceTypeIcon}>🚗</Text>
          <Text style={styles.deviceTypeText}>Vehicles</Text>
        </View>
        <View style={styles.deviceTypeCard}>
          <Text style={styles.deviceTypeIcon}>🌡️</Text>
          <Text style={styles.deviceTypeText}>Sensors</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Automation</Text>
        <TouchableOpacity style={styles.helpButton}>
          <Text style={styles.helpButtonText}>❓</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'templates' && styles.tabActive]}
          onPress={() => setActiveTab('templates')}
        >
          <Text style={[styles.tabText, activeTab === 'templates' && styles.tabTextActive]}>
            Templates
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'devices' && styles.tabActive]}
          onPress={() => setActiveTab('devices')}
        >
          <Text style={[styles.tabText, activeTab === 'devices' && styles.tabTextActive]}>
            IoT Devices
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'active' && renderActiveAutomations()}
        {activeTab === 'templates' && renderTemplates()}
        {activeTab === 'devices' && renderDevices()}
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
  helpButton: {
    padding: 8,
  },
  helpButtonText: {
    fontSize: 20,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0f3460',
  },
  tabText: {
    color: '#8b8b8b',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  createButton: {
    backgroundColor: '#0f3460',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  createButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    marginTop: 8,
  },
  automationCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
    padding: 16,
    marginBottom: 12,
  },
  automationHeader: {
    marginBottom: 12,
  },
  automationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  automationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgePaused: {
    backgroundColor: '#ff9800',
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  automationType: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  automationDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#8b8b8b',
    minWidth: 100,
  },
  detailValue: {
    fontSize: 13,
    color: '#c4c4c4',
    flex: 1,
  },
  detailValueHighlight: {
    fontSize: 13,
    color: '#0f3460',
    fontWeight: 'bold',
    flex: 1,
  },
  automationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#16213e',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    backgroundColor: '#0f3460',
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonDanger: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonTextDanger: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyLeft: {
    flex: 1,
  },
  historyName: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 2,
  },
  historyAction: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyStatus: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: '600',
    marginBottom: 2,
  },
  historyTime: {
    fontSize: 11,
    color: '#8b8b8b',
  },
  templateCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 13,
    color: '#8b8b8b',
    marginBottom: 4,
  },
  templateCategory: {
    fontSize: 11,
    color: '#0f3460',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  templateArrow: {
    fontSize: 20,
    color: '#0f3460',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#c4c4c4',
    marginBottom: 8,
    marginTop: 12,
  },
  templateCardSmall: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#16213e',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateIconSmall: {
    fontSize: 24,
    marginRight: 12,
  },
  templateInfoSmall: {
    flex: 1,
  },
  templateNameSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  templateDescriptionSmall: {
    fontSize: 12,
    color: '#8b8b8b',
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
  },
  emptyState: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
    padding: 24,
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
    marginBottom: 16,
    lineHeight: 20,
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: 20,
  },
  featureItem: {
    fontSize: 13,
    color: '#c4c4c4',
    marginVertical: 4,
  },
  connectButton: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  deviceTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  deviceTypeCard: {
    width: '48%',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  deviceTypeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  deviceTypeText: {
    fontSize: 13,
    color: '#c4c4c4',
    fontWeight: '600',
  },
});
