import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';

// Context
import { AppProvider } from './context/AppContext';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import WalletPage from './pages/WalletPage';
import IdentityPage from './pages/IdentityPage';
import GovernancePage from './pages/GovernancePage';
import ProfilePage from './pages/ProfilePage';
import MarketplacePage from './pages/MarketplacePage';
import AnalyticsPage from './pages/AnalyticsPage';
import CommunityPage from './pages/CommunityPage';
import NodePage from './pages/NodePage';
import AutomationPage from './pages/AutomationPage';
import AIPage from './pages/AIPage';
import StoragePage from './pages/StoragePage';
import MessagingPage from './pages/MessagingPage';
import OfflineQueuePage from './pages/OfflineQueuePage';
import DocsPage from './pages/DocsPage';
import AppStorePage from './pages/AppStorePage';
import DataVaultPage from './pages/DataVaultPage';
import MobileMoneyPage from './pages/MobileMoneyPage';
import AirdropPage from './pages/AirdropPage';

function AppLayout() {
  const location = useLocation();
  const hideFooter = location.pathname === '/messaging';

  return (
    <div className="App">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/identity" element={<IdentityPage />} />
          <Route path="/governance" element={<GovernancePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/node" element={<NodePage />} />
          <Route path="/automation" element={<AutomationPage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/storage" element={<StoragePage />} />
          <Route path="/messaging" element={<MessagingPage />} />
          <Route path="/offline-queue" element={<OfflineQueuePage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/appstore" element={<AppStorePage />} />
          <Route path="/datavault" element={<DataVaultPage />} />
          <Route path="/mobile-money" element={<MobileMoneyPage />} />
          <Route path="/airdrop" element={<AirdropPage />} />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <AppLayout />
      </Router>
    </AppProvider>
  );
}

export default App;
