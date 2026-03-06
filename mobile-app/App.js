import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import WalletScreen from './src/screens/WalletScreen';
import IdentityScreen from './src/screens/IdentityScreen';
import GovernanceScreen from './src/screens/GovernanceScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import CommunityScreen from './src/screens/CommunityScreen';
import NodeScreen from './src/screens/NodeScreen';
import AutomationScreen from './src/screens/AutomationScreen';
import AIScreen from './src/screens/AIScreen';
import StorageScreen from './src/screens/StorageScreen';
import MessagingScreen from './src/screens/MessagingScreen';
import OfflineQueueScreen from './src/screens/OfflineQueueScreen';
import BiometricSetupScreen from './src/screens/BiometricSetupScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DataVaultScreen from './src/screens/DataVaultScreen';
import MobileMoneyScreen from './src/screens/MobileMoneyScreen';
import AirdropScreen from './src/screens/AirdropScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#16213e',
        },
        tabBarActiveTintColor: '#0f3460',
        tabBarInactiveTintColor: '#8b8b8b',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          // tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{
          tabBarLabel: 'Wallet',
        }}
      />
      <Tab.Screen 
        name="Identity" 
        component={IdentityScreen}
        options={{
          tabBarLabel: 'Identity',
        }}
      />
      <Tab.Screen 
        name="Governance" 
        component={GovernanceScreen}
        options={{
          tabBarLabel: 'DAO',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} />
            <Stack.Screen name="Community" component={CommunityScreen} />
            <Stack.Screen name="Node" component={NodeScreen} />
            <Stack.Screen name="Automation" component={AutomationScreen} />
            <Stack.Screen name="AI" component={AIScreen} />
            <Stack.Screen name="Storage" component={StorageScreen} />
            <Stack.Screen name="Messaging" component={MessagingScreen} />
            <Stack.Screen name="OfflineQueue" component={OfflineQueueScreen} />
            <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="DataVault" component={DataVaultScreen} />
            <Stack.Screen name="MobileMoney" component={MobileMoneyScreen} />
            <Stack.Screen name="Airdrop" component={AirdropScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </AppProvider>
  );
}
