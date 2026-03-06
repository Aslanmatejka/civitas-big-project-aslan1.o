import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';

export default function CommunityScreen() {
  const { wallet, isConnected } = useApp();
  const [selectedTab, setSelectedTab] = useState('feed');

  const getUserInitials = () => {
    if (!wallet?.address) return 'ME';
    return wallet.address.slice(2, 4).toUpperCase();
  };

  const handleCreatePost = () => {
    if (!wallet?.address) {
      Alert.alert('Connect Wallet', 'Please connect your wallet to post');
      return;
    }
    Alert.alert('Create Post', 'Community posting feature coming soon!');
  };

  // Disconnected state
  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.disconnectedContainer}>
          <Text style={styles.disconnectedTitle}>Wallet Not Connected</Text>
          <Text style={styles.disconnectedText}>
            Connect your wallet to join the community
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community</Text>
        <TouchableOpacity style={styles.searchIcon}>
          <Text style={styles.searchIconText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'feed' && styles.tabActive]}
          onPress={() => setSelectedTab('feed')}
        >
          <Text style={[styles.tabText, selectedTab === 'feed' && styles.tabTextActive]}>
            Feed
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
          style={[styles.tab, selectedTab === 'events' && styles.tabActive]}
          onPress={() => setSelectedTab('events')}
        >
          <Text style={[styles.tabText, selectedTab === 'events' && styles.tabTextActive]}>
            Events
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {selectedTab === 'feed' && (
          <>
            {/* Create Post */}
            <View style={styles.createPostCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{getUserInitials()}</Text>
              </View>
              <TouchableOpacity
                style={styles.createPostInput}
                onPress={handleCreatePost}
              >
                <Text style={styles.createPostPlaceholder}>Share with the community...</Text>
              </TouchableOpacity>
            </View>

            {/* Feed Posts */}
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.postAvatar}>
                  <Text style={styles.postAvatarText}>MS</Text>
                </View>
                <View style={styles.postInfo}>
                  <Text style={styles.postAuthor}>Maria Santos</Text>
                  <Text style={styles.postMeta}>Philippines • 2 hours ago</Text>
                </View>
              </View>
              <Text style={styles.postContent}>
                Just completed my first CIV payment to a vendor! No banks, no delays, just instant peer-to-peer transactions. This is the future! 🚀
              </Text>
              <View style={styles.postStats}>
                <Text style={styles.postStat}>❤️ 42</Text>
                <Text style={styles.postStat}>💬 8</Text>
                <Text style={styles.postStat}>🔄 5</Text>
              </View>
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.postAction}>
                  <Text style={styles.postActionText}>Like</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postAction}>
                  <Text style={styles.postActionText}>Comment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postAction}>
                  <Text style={styles.postActionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.postAvatar}>
                  <Text style={styles.postAvatarText}>AP</Text>
                </View>
                <View style={styles.postInfo}>
                  <Text style={styles.postAuthor}>Arjun Patel</Text>
                  <Text style={styles.postMeta}>India • 5 hours ago</Text>
                </View>
              </View>
              <Text style={styles.postContent}>
                Our farming cooperative just tokenized our coffee harvest! Now we can access global buyers directly through CIVITAS marketplace. Thank you community! ☕️🌍
              </Text>
              <View style={styles.postImage}>
                <Text style={styles.postImagePlaceholder}>📸 Coffee Harvest Photo</Text>
              </View>
              <View style={styles.postStats}>
                <Text style={styles.postStat}>❤️ 87</Text>
                <Text style={styles.postStat}>💬 15</Text>
                <Text style={styles.postStat}>🔄 12</Text>
              </View>
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.postAction}>
                  <Text style={styles.postActionText}>Like</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postAction}>
                  <Text style={styles.postActionText}>Comment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postAction}>
                  <Text style={styles.postActionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.postAvatar}>
                  <Text style={styles.postAvatarText}>CF</Text>
                </View>
                <View style={styles.postInfo}>
                  <Text style={styles.postAuthor}>CIVITAS Foundation</Text>
                  <Text style={styles.postMeta}>Official • 1 day ago</Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>✓</Text>
                </View>
              </View>
              <Text style={styles.postContent}>
                🎉 We've reached 2.5 MILLION users! Thank you for building a truly decentralized future together. Phase 3 roadmap announcement coming next week.
              </Text>
              <View style={styles.postStats}>
                <Text style={styles.postStat}>❤️ 1.2K</Text>
                <Text style={styles.postStat}>💬 134</Text>
                <Text style={styles.postStat}>🔄 245</Text>
              </View>
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.postAction}>
                  <Text style={styles.postActionText}>Like</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postAction}>
                  <Text style={styles.postActionText}>Comment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postAction}>
                  <Text style={styles.postActionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {selectedTab === 'groups' && (
          <View style={styles.groupsContainer}>
            <View style={styles.groupCard}>
              <Text style={styles.groupIcon}>🌾</Text>
              <Text style={styles.groupName}>Agriculture & Farming</Text>
              <Text style={styles.groupMembers}>12,456 members</Text>
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Join Group</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.groupCard}>
              <Text style={styles.groupIcon}>💼</Text>
              <Text style={styles.groupName}>Entrepreneurs Network</Text>
              <Text style={styles.groupMembers}>8,932 members</Text>
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Join Group</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.groupCard}>
              <Text style={styles.groupIcon}>👨‍💻</Text>
              <Text style={styles.groupName}>Developers & Builders</Text>
              <Text style={styles.groupMembers}>5,421 members</Text>
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Join Group</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.groupCard}>
              <Text style={styles.groupIcon}>🎓</Text>
              <Text style={styles.groupName}>Education & Learning</Text>
              <Text style={styles.groupMembers}>15,678 members</Text>
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Join Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {selectedTab === 'events' && (
          <View style={styles.eventsContainer}>
            <View style={styles.eventCard}>
              <View style={styles.eventDate}>
                <Text style={styles.eventDay}>15</Text>
                <Text style={styles.eventMonth}>MAR</Text>
              </View>
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>DeFi Workshop: Jakarta</Text>
                <Text style={styles.eventLocation}>📍 Jakarta, Indonesia</Text>
                <Text style={styles.eventTime}>🕐 2:00 PM - 5:00 PM</Text>
                <TouchableOpacity style={styles.rsvpButton}>
                  <Text style={styles.rsvpButtonText}>RSVP</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.eventCard}>
              <View style={styles.eventDate}>
                <Text style={styles.eventDay}>22</Text>
                <Text style={styles.eventMonth}>MAR</Text>
              </View>
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>Virtual Town Hall</Text>
                <Text style={styles.eventLocation}>📍 Online (Global)</Text>
                <Text style={styles.eventTime}>🕐 10:00 AM UTC</Text>
                <TouchableOpacity style={styles.rsvpButton}>
                  <Text style={styles.rsvpButtonText}>RSVP</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.eventCard}>
              <View style={styles.eventDate}>
                <Text style={styles.eventDay}>05</Text>
                <Text style={styles.eventMonth}>APR</Text>
              </View>
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle}>Blockchain Hackathon</Text>
                <Text style={styles.eventLocation}>📍 São Paulo, Brazil</Text>
                <Text style={styles.eventTime}>🕐 9:00 AM - 6:00 PM</Text>
                <TouchableOpacity style={styles.rsvpButton}>
                  <Text style={styles.rsvpButtonText}>RSVP</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  searchIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconText: {
    fontSize: 20,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#8b8b8b',
  },
  tabTextActive: {
    color: '#0f3460',
  },
  createPostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a1a2e',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  createPostInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    justifyContent: 'center',
  },
  createPostPlaceholder: {
    color: '#8b8b8b',
    fontSize: 14,
  },
  postCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  postAvatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  postInfo: {
    flex: 1,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  postMeta: {
    fontSize: 11,
    color: '#8b8b8b',
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  postContent: {
    fontSize: 14,
    color: '#c4c4c4',
    lineHeight: 20,
    marginBottom: 12,
  },
  postImage: {
    height: 150,
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  postImagePlaceholder: {
    fontSize: 32,
  },
  postStats: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#16213e',
    gap: 20,
  },
  postStat: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  postActions: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#16213e',
  },
  postAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  postActionText: {
    fontSize: 12,
    color: '#0f3460',
    fontWeight: '600',
  },
  groupsContainer: {
    padding: 20,
  },
  groupCard: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  groupIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  groupMembers: {
    fontSize: 12,
    color: '#8b8b8b',
    marginBottom: 16,
  },
  joinButton: {
    backgroundColor: '#0f3460',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  eventsContainer: {
    padding: 20,
  },
  eventCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  eventDate: {
    width: 60,
    height: 60,
    backgroundColor: '#0f3460',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  eventMonth: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  eventLocation: {
    fontSize: 12,
    color: '#8b8b8b',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 12,
    color: '#8b8b8b',
    marginBottom: 12,
  },
  rsvpButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0f3460',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  rsvpButtonText: {
    color: '#0f3460',
    fontWeight: '600',
    fontSize: 12,
  },
});
