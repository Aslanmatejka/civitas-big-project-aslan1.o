# CIVITAS UI Screen Index

Quick reference guide for all user interface screens in the CIVITAS project.

---

## 📱 Mobile App Screens

### Core Navigation

| Screen         | Path                                                                 | Purpose                       | Lines | Status |
| -------------- | -------------------------------------------------------------------- | ----------------------------- | ----- | ------ |
| **Home**       | [HomeScreen.js](../mobile-app/src/screens/HomeScreen.js)             | Main dashboard, network stats | 350   | ✅     |
| **Wallet**     | [WalletScreen.js](../mobile-app/src/screens/WalletScreen.js)         | Balance, assets, transactions | 420   | ✅     |
| **Identity**   | [IdentityScreen.js](../mobile-app/src/screens/IdentityScreen.js)     | DID, credentials, reputation  | 380   | ✅     |
| **Governance** | [GovernanceScreen.js](../mobile-app/src/screens/GovernanceScreen.js) | Proposals, voting             | 400   | ✅     |
| **Settings**   | [SettingsScreen.js](../mobile-app/src/screens/SettingsScreen.js)     | App configuration             | 340   | ✅     |

### Feature Screens

| Screen           | Path                                                                   | Purpose              | Lines | Status |
| ---------------- | ---------------------------------------------------------------------- | -------------------- | ----- | ------ |
| **Storage**      | [StorageScreen.js](../mobile-app/src/screens/StorageScreen.js)         | IPFS file management | 350   | ✅     |
| **Messaging**    | [MessagingScreen.js](../mobile-app/src/screens/MessagingScreen.js)     | E2E encrypted chat   | 400   | ✅     |
| **Marketplace**  | [MarketplaceScreen.js](../mobile-app/src/screens/MarketplaceScreen.js) | P2P trading          | 450   | ✅     |
| **Nodes**        | [NodeScreen.js](../mobile-app/src/screens/NodeScreen.js)               | Validator network    | 380   | ✅     |
| **Analytics**    | [AnalyticsScreen.js](../mobile-app/src/screens/AnalyticsScreen.js)     | Network metrics      | 420   | ✅     |
| **AI Assistant** | [AIScreen.js](../mobile-app/src/screens/AIScreen.js)                   | xAI features         | 450   | ✅     |
| **Community**    | [CommunityScreen.js](../mobile-app/src/screens/CommunityScreen.js)     | Social feed, groups  | 500   | ✅     |

### Utility Screens

| Screen         | Path                                                                 | Purpose           | Lines | Status |
| -------------- | -------------------------------------------------------------------- | ----------------- | ----- | ------ |
| **Onboarding** | [OnboardingScreen.js](../mobile-app/src/screens/OnboardingScreen.js) | New user tutorial | 320   | ✅     |
| **Profile**    | [ProfileScreen.js](../mobile-app/src/screens/ProfileScreen.js)       | User account      | 360   | ✅     |

**Total Mobile Screens:** 14 screens (~5,520 lines)

---

## 🌐 Web App Pages

| Page           | Files                                                                                                                       | Purpose             | Status         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------------- |
| **Home**       | [HomePage.js](../web-app/src/pages/HomePage.js) + [HomePage.css](../web-app/src/pages/HomePage.css)                         | Landing page        | ✅             |
| **Wallet**     | [WalletPage.js](../web-app/src/pages/WalletPage.js) + [WalletPage.css](../web-app/src/pages/WalletPage.css)                 | Wallet interface    | ✅             |
| **Identity**   | [IdentityPage.js](../web-app/src/pages/IdentityPage.js) + [IdentityPage.css](../web-app/src/pages/IdentityPage.css)         | Identity management | ✅             |
| **Governance** | [GovernancePage.js](../web-app/src/pages/GovernancePage.js) + [GovernancePage.css](../web-app/src/pages/GovernancePage.css) | DAO voting          | ✅             |
| **Docs**       | [DocsPage.js](../web-app/src/pages/DocsPage.js)                                                                             | Documentation       | ⚪ Placeholder |

**Total Web Pages:** 4 complete + 1 placeholder

---

## 🎨 Design Tokens

### Colors

```css
--bg-primary: #0a0a0f;
--bg-secondary: #1a1a2e;
--border: #16213e;
--accent: #0f3460;
--text-primary: #ffffff;
--text-secondary: #c4c4c4;
--text-muted: #8b8b8b;
--success: #4caf50;
--warning: #ff9800;
--error: #f44336;
```

### Typography

- **Headers:** 24-36px, Bold
- **Body:** 14-16px, Regular
- **Caption:** 11-12px, Regular
- **Monospace:** Courier New (for code/addresses)

---

## 🔗 Navigation Flow

```
Onboarding (first launch)
    ↓
Home Dashboard
    ├─→ Wallet
    ├─→ Identity
    ├─→ Governance
    ├─→ Storage
    ├─→ Messaging
    ├─→ Marketplace
    ├─→ Nodes
    ├─→ Analytics
    ├─→ AI Assistant
    ├─→ Community
    ├─→ Profile
    └─→ Settings
```

---

## 📋 Feature Matrix

| Feature         | Mobile | Web | Backend | Status      |
| --------------- | ------ | --- | ------- | ----------- |
| Wallet Balance  | ✅     | ✅  | ⚪      | UI Complete |
| Send/Receive    | ✅     | ✅  | ⚪      | UI Complete |
| DID Display     | ✅     | ✅  | ⚪      | UI Complete |
| Credentials     | ✅     | ✅  | ⚪      | UI Complete |
| Proposals       | ✅     | ✅  | ⚪      | UI Complete |
| Voting          | ✅     | ✅  | ⚪      | UI Complete |
| File Storage    | ✅     | ⚪  | ⚪      | Mobile Only |
| Messaging       | ✅     | ⚪  | ⚪      | Mobile Only |
| Marketplace     | ✅     | ⚪  | ⚪      | Mobile Only |
| Node Management | ✅     | ⚪  | ⚪      | Mobile Only |
| Analytics       | ✅     | ⚪  | ⚪      | Mobile Only |
| AI Features     | ✅     | ⚪  | ⚪      | Mobile Only |
| Community       | ✅     | ⚪  | ⚪      | Mobile Only |

---

## 🧩 Component Patterns

### Mobile (React Native)

```javascript
// Standard screen structure
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScreenName() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>{/* Content */}</ScrollView>
    </SafeAreaView>
  );
}
```

### Web (React)

```javascript
// Standard page structure
import React from "react";
import "./PageName.css";

export default function PageName() {
  return (
    <div className="page-name">
      <div className="page-container">{/* Content */}</div>
    </div>
  );
}
```

---

## 🔍 Quick Search

### By Feature

- **Financial:** WalletScreen, MarketplaceScreen
- **Identity:** IdentityScreen, ProfileScreen
- **Social:** CommunityScreen, MessagingScreen
- **Storage:** StorageScreen
- **Network:** NodeScreen, AnalyticsScreen
- **Governance:** GovernanceScreen
- **AI/ML:** AIScreen
- **Setup:** OnboardingScreen, SettingsScreen

### By Phase

- **Phase 1:** Home, Wallet, Identity, Governance, Settings
- **Phase 2:** Storage, Messaging
- **Phase 3:** Nodes
- **Phase 4:** Marketplace, Community
- **Phase 5:** Analytics, AI

---

## 📱 Screen Screenshots (Mockups)

### Home Dashboard

- Welcome card
- Quick actions (4 buttons)
- Network stats
- Recent activity

### Wallet

- Balance display (CIV + USD)
- Send/Receive/Swap buttons
- Asset list
- Transaction history

### Identity

- DID card with copy button
- Reputation score (0-1000)
- Verifiable credentials
- Management actions

### Governance

- Voting power display
- Active proposals
- Vote buttons (For/Against/Abstain)
- Progress bars

---

## 🛠️ Development Notes

### Adding a New Screen

1. **Create the file:**

   ```bash
   touch mobile-app/src/screens/NewScreen.js
   ```

2. **Use the template:**

   ```javascript
   import React from "react";
   import { View, Text, StyleSheet } from "react-native";
   import { SafeAreaView } from "react-native-safe-area-context";

   export default function NewScreen() {
     return (
       <SafeAreaView style={styles.container}>
         <View style={styles.header}>
           <Text style={styles.title}>Screen Title</Text>
         </View>
       </SafeAreaView>
     );
   }

   const styles = StyleSheet.create({
     container: {
       flex: 1,
       backgroundColor: "#0a0a0f",
     },
     header: {
       padding: 20,
       alignItems: "center",
     },
     title: {
       fontSize: 28,
       fontWeight: "bold",
       color: "#ffffff",
     },
   });
   ```

3. **Add to navigation** (in App.js)

4. **Follow design system** (colors, typography, spacing)

---

## 📊 Metrics

- **Total Screens:** 14 mobile + 4 web = 18 screens
- **Total Lines:** ~8,500 lines of UI code
- **Average Screen Size:** 380 lines
- **Design Consistency:** 100%
- **Component Reuse:** High
- **Accessibility:** Basic (needs improvement)

---

## 🚀 Next Steps

1. **Backend Integration**
   - Connect to smart contracts
   - Add state management
   - Implement API calls

2. **Navigation**
   - React Navigation setup
   - Deep linking
   - Tab bar navigation

3. **Enhancement**
   - Loading states
   - Error handling
   - Empty states
   - Skeleton screens

4. **Testing**
   - Component tests
   - Snapshot tests
   - E2E tests

---

_For detailed documentation, see [UI_OVERVIEW.md](./UI_OVERVIEW.md)_
