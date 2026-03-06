import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

export default function MessagingScreen() {
  const { wallet, isConnected } = useApp();
  const [selectedTab, setSelectedTab] = useState('chats'); // chats, groups, contacts

  const getUserInitials = () => {
    if (!wallet?.address) return 'ME';
    return wallet.address.slice(2, 4).toUpperCase();
  };

  const handleSendMessage = () => {
    if (!wallet?.address) {
      Alert.alert('Connect Wallet', 'Please connect your wallet first');
      return;
    }
    Alert.alert('Send Message', 'P2P messaging feature coming soon!');
  };

  // Disconnected state
  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.disconnectedContainer}>
          <Text style={styles.disconnectedTitle}>Wallet Not Connected</Text>
          <Text style={styles.disconnectedText}>
            Connect your wallet to access messaging
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>End-to-End Encrypted</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'chats' && styles.tabActive]}
          onPress={() => setSelectedTab('chats')}
        >
          <Text style={[styles.tabText, selectedTab === 'chats' && styles.tabTextActive]}>
            Chats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'groups' && styles.tabActive]}
          onPress={() => setSelectedTab('groups')}
        >
          <Text style={[styles.tabText, selectedTab === 'groups' && styles.tabTextActive]}>
            Groups
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'contacts' && styles.tabActive]}
          onPress={() => setSelectedTab('contacts')}
        >
          <Text style={[styles.tabText, selectedTab === 'contacts' && styles.tabTextActive]}>
            Contacts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages or contacts..."
          placeholderTextColor="#8b8b8b"
        />
      </View>

      <ScrollView>
        {selectedTab === 'chats' && (
          <View style={styles.chatsList}>
            {/* Chat Item */}
            <TouchableOpacity style={styles.chatItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>JD</Text>
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName}>John Doe</Text>
                  <Text style={styles.chatTime}>2:30 PM</Text>
                </View>
                <View style={styles.chatMessageRow}>
                  <Text style={styles.chatMessage}>
                    Hey! Just sent you the payment 💰
                  </Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>2</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.chatItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>SK</Text>
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName}>Sarah Kim</Text>
                  <Text style={styles.chatTime}>Yesterday</Text>
                </View>
                <Text style={styles.chatMessage}>
                  ✓✓ Great! See you at the DAO meeting
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.chatItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>MN</Text>
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName}>Muhammad Nakato</Text>
                  <Text style={styles.chatTime}>2 days ago</Text>
                </View>
                <Text style={styles.chatMessage}>
                  Can you verify my credential?
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {selectedTab === 'groups' && (
          <View style={styles.chatsList}>
            <TouchableOpacity style={styles.chatItem}>
              <View style={[styles.avatar, styles.avatarGroup]}>
                <Text style={styles.avatarText}>👥</Text>
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName}>CIVITAS Developers</Text>
                  <Text style={styles.chatTime}>1 hour ago</Text>
                </View>
                <Text style={styles.chatMessage}>
                  Alice: New smart contract deployed! 🚀
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.chatItem}>
              <View style={[styles.avatar, styles.avatarGroup]}>
                <Text style={styles.avatarText}>🌍</Text>
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName}>Global South Community</Text>
                  <Text style={styles.chatTime}>5 hours ago</Text>
                </View>
                <Text style={styles.chatMessage}>
                  Felix: Welcome all new members!
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {selectedTab === 'contacts' && (
          <View style={styles.contactsList}>
            <TouchableOpacity style={styles.contactItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>AB</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>Alice Brown</Text>
                <Text style={styles.contactDid}>did:civitas:0x7a2d...4f8b</Text>
              </View>
              <TouchableOpacity style={styles.messageButton}>
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>BC</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>Bob Chen</Text>
                <Text style={styles.contactDid}>did:civitas:0x9c4e...2a1f</Text>
              </View>
              <TouchableOpacity style={styles.messageButton}>
                <Text style={styles.messageButtonText}>Message</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        )}

        {/* Security Info */}
        <View style={styles.securityCard}>
          <Text style={styles.securityTitle}>🔒 Privacy Protected</Text>
          <Text style={styles.securityText}>
            All messages are end-to-end encrypted. Only you and the recipient can read them.
            CIVITAS never has access to your conversations.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabIcon}>✏️</Text>
      </TouchableOpacity>
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0f3460',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b8b8b',
  },
  tabTextActive: {
    color: '#0f3460',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#16213e',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  chatsList: {
    paddingHorizontal: 20,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarGroup: {
    backgroundColor: '#1a1a2e',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  chatTime: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  chatMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatMessage: {
    fontSize: 14,
    color: '#8b8b8b',
    flex: 1,
  },
  badge: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contactsList: {
    paddingHorizontal: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#16213e',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  contactDid: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  messageButton: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  messageButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  securityCard: {
    margin: 20,
    padding: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#8b8b8b',
    lineHeight: 18,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
  fabIcon: {
    fontSize: 24,
  },
});
