/**
 * App.js - Main Application Entry Point with Backend Integration
 * 
 * This shows how to wrap the existing App.js with AppProvider
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Import Context Provider
import { AppProvider, useApp } from './src/context/AppContext';

// Import Screens
import WalletScreen from './src/screens/WalletScreen';
import IdentityScreen from './src/screens/IdentityScreen';
import StorageScreen from './src/screens/StorageScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import GovernanceScreen from './src/screens/GovernanceScreen';
import MessagingScreen from './src/screens/MessagingScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import NodeScreen from './src/screens/NodeScreen';
import AIScreen from './src/screens/AIScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AutomationScreen from './src/screens/AutomationScreen';
import OfflineQueueScreen from './src/screens/OfflineQueueScreen';
import BiometricSetupScreen from './src/screens/BiometricSetupScreen';

const Tab = createBottomTabNavigator();

/**
 * Main Navigation Component
 * This is wrapped by AppProvider to have access to global state
 */
const AppNavigation = () => {
  const { isLoading, isConnected } = useApp();

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f3460" />
      </View>
    );
  }

  // If not connected, show wallet setup screen
  // (You would create a WalletSetupScreen for this)
  if (!isConnected) {
    // For now, still show main navigation
    // In production, show onboarding/wallet creation flow
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            // Map routes to icons
            const iconMap = {
              Wallet: 'wallet',
              Identity: 'person',
              Storage: 'cloud',
              Community: 'people',
              Governance: 'flag',
              Messaging: 'chatbubbles',
              Marketplace: 'storefront',
              Node: 'server',
              AI: 'sparkles',
              Analytics: 'bar-chart',
              Settings: 'settings',
            };

            iconName = iconMap[route.name] || 'help-circle';

            return (
              <Ionicons
                name={focused ? iconName : `${iconName}-outline`}
                size={size}
                color={color}
              />
            );
          },
          tabBarActiveTintColor: '#0f3460',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {
            backgroundColor: '#1a1a2e',
            borderTopColor: '#16213e',
          },
          headerStyle: {
            backgroundColor: '#0a0a0f',
          },
          headerTintColor: '#ffffff',
        })}
      >
        <Tab.Screen name="Wallet" component={WalletScreen} />
        <Tab.Screen name="Identity" component={IdentityScreen} />
        <Tab.Screen name="Storage" component={StorageScreen} />
        <Tab.Screen name="Community" component={CommunityScreen} />
        <Tab.Screen name="Governance" component={GovernanceScreen} />
        <Tab.Screen name="Messaging" component={MessagingScreen} />
        <Tab.Screen name="Marketplace" component={MarketplaceScreen} />
        <Tab.Screen name="Node" component={NodeScreen} />
        <Tab.Screen name="AI" component={AIScreen} />
        <Tab.Screen name="Analytics" component={AnalyticsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
};

/**
 * Root App Component
 * Wraps everything with AppProvider for global state
 */
export default function App() {
  return (
    <AppProvider>
      <AppNavigation />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
  },
});

/**
 * USAGE NOTES:
 * 
 * 1. This App.js wraps the entire application with AppProvider
 * 2. All screens now have access to:
 *    - useApp() hook for global state (wallet, balance, etc.)
 *    - useServices() hook for blockchain operations
 * 
 * 3. The AppProvider automatically:
 *    - Initializes Web3 on app start
 *    - Restores wallet from secure storage
 *    - Loads user data (balance, reputation, etc.)
 *    - Manages connection state
 * 
 * 4. To use in any screen:
 * 
 *    import { useApp } from '../context/AppContext';
 *    import { useServices } from '../hooks/useServices';
 * 
 *    const MyScreen = () => {
 *      const { wallet, balance } = useApp();
 *      const { sendTransaction } = useServices();
 *      // ... use the data and functions
 *    };
 * 
 * 5. The isLoading state prevents rendering until services are ready
 * 6. The isConnected state can be used to show onboarding if no wallet exists
 */
