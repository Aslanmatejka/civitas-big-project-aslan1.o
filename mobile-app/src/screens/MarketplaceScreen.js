import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useServices } from '../hooks/useServices';

export default function MarketplaceScreen() {
  const { wallet, isConnected, balance } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && wallet?.address) {
      loadMarketplaceData();
    }
  }, [isConnected, wallet?.address]);

  const loadMarketplaceData = async () => {
    try {
      setLoading(false);
      // TODO: Load actual marketplace listings from IPFS/blockchain
    } catch (error) {
      console.error('Error loading marketplace data:', error);
      setLoading(false);
    }
  };

  const handleCreateListing = () => {
    if (!wallet?.address) {
      Alert.alert('Connect Wallet', 'Please connect your wallet to create a listing');
      return;
    }
    Alert.alert('Create Listing', 'Marketplace listing creation coming soon!');
  };

  // Disconnected state
  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.disconnectedContainer}>
          <Text style={styles.disconnectedTitle}>Wallet Not Connected</Text>
          <Text style={styles.disconnectedText}>
            Connect your wallet to access the marketplace
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Marketplace</Text>
          <Text style={styles.subtitle}>P2P Trading • No Middlemen</Text>
        </View>

        {/* Balance Summary */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{balance || 0} CIV</Text>
          <TouchableOpacity style={styles.sellButton} onPress={handleCreateListing}>
            <Text style={styles.sellButtonText}>+ Create Listing</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categories}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'all' && styles.categoryTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryChip, selectedCategory === 'services' && styles.categoryChipActive]}
              onPress={() => setSelectedCategory('services')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'services' && styles.categoryTextActive]}>
                Services
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryChip, selectedCategory === 'goods' && styles.categoryChipActive]}
              onPress={() => setSelectedCategory('goods')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'goods' && styles.categoryTextActive]}>
                Goods
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryChip, selectedCategory === 'assets' && styles.categoryChipActive]}
              onPress={() => setSelectedCategory('assets')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'assets' && styles.categoryTextActive]}>
                Digital Assets
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryChip, selectedCategory === 'impact' && styles.categoryChipActive]}
              onPress={() => setSelectedCategory('impact')}
            >
              <Text style={[styles.categoryText, selectedCategory === 'impact' && styles.categoryTextActive]}>
                Impact NFTs
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Featured Listing */}
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>⭐ Featured</Text>
          <View style={styles.featuredCard}>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>VERIFIED</Text>
            </View>
            <Text style={styles.listingTitle}>Web Development Services</Text>
            <Text style={styles.listingDescription}>
              Professional full-stack development for decentralized apps
            </Text>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerAvatarText}>JD</Text>
              </View>
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>John Developer</Text>
                <Text style={styles.sellerRating}>⭐ 4.9 (127 reviews)</Text>
              </View>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.price}>50 CIV</Text>
              <TouchableOpacity style={styles.buyButton}>
                <Text style={styles.buyButtonText}>Contact Seller</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Listings */}
        <View style={styles.listingsSection}>
          <Text style={styles.sectionTitle}>Active Listings</Text>

          <View style={styles.listingCard}>
            <View style={styles.listingHeader}>
              <Text style={styles.listingCategory}>💼 Service</Text>
              <Text style={styles.listingTime}>2 hours ago</Text>
            </View>
            <Text style={styles.listingTitle}>Graphic Design</Text>
            <Text style={styles.listingDescription}>
              Logo design, branding, social media graphics
            </Text>
            <View style={styles.listingFooter}>
              <Text style={styles.listingPrice}>25 CIV</Text>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.listingCard}>
            <View style={styles.listingHeader}>
              <Text style={styles.listingCategory}>📦 Goods</Text>
              <Text style={styles.listingTime}>1 day ago</Text>
            </View>
            <Text style={styles.listingTitle}>Solar Panel Kit</Text>
            <Text style={styles.listingDescription}>
              50W portable solar panel with battery - global shipping
            </Text>
            <View style={styles.listingFooter}>
              <Text style={styles.listingPrice}>150 CIV</Text>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.listingCard}>
            <View style={styles.listingHeader}>
              <Text style={styles.listingCategory}>🎨 Impact NFT</Text>
              <Text style={styles.listingTime}>3 days ago</Text>
            </View>
            <Text style={styles.listingTitle}>Clean Water Project</Text>
            <Text style={styles.listingDescription}>
              Support village water well - 100% proceeds to construction
            </Text>
            <View style={styles.listingFooter}>
              <Text style={styles.listingPrice}>10 CIV</Text>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>Support Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🛡️ Smart Escrow Protection</Text>
          <Text style={styles.infoText}>
            All transactions use smart contract escrows. Funds are released only when both parties confirm completion.
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
  balanceCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16213e',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8b8b8b',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0f3460',
    marginBottom: 16,
  },
  sellButton: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sellButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  categories: {
    paddingLeft: 20,
    marginBottom: 20,
  },
  categoryChip: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  categoryChipActive: {
    backgroundColor: '#0f3460',
    borderColor: '#0f3460',
  },
  categoryText: {
    color: '#8b8b8b',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  featuredSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  featuredCard: {
    backgroundColor: '#1a1a2e',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0f3460',
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0f3460',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  featuredBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  listingDescription: {
    fontSize: 14,
    color: '#c4c4c4',
    lineHeight: 20,
    marginBottom: 16,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f3460',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerAvatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  sellerDetails: {},
  sellerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  sellerRating: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f3460',
  },
  buyButton: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  listingsSection: {
    padding: 20,
  },
  listingCard: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#16213e',
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listingCategory: {
    fontSize: 12,
    color: '#0f3460',
    fontWeight: '600',
  },
  listingTime: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f3460',
  },
  viewButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0f3460',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#0f3460',
    fontWeight: '600',
    fontSize: 12,
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
});
