/**
 * BACKEND INTEGRATION GUIDE
 * 
 * This guide shows how to integrate UI screens with CIVITAS backend services
 */

// ==========================================
// EXAMPLE 1: WalletScreen Integration
// ==========================================

/*
BEFORE (Mock Data):
--------------------
const WalletScreen = () => {
  const [balance, setBalance] = useState('1,247.50');
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'send', to: 'Jane Doe', amount: '50.00', ... },
    // ... more mock data
  ]);
};

AFTER (Real Backend):
--------------------
*/

import { useApp } from '../context/AppContext';
import { useServices } from '../hooks/useServices';

const WalletScreen = () => {
  const { wallet, balance, isConnected } = useApp();
  const { sendTransaction, getTransactionHistory, refresh } = useServices();
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [wallet]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const result = await getTransactionHistory();
      setTransactions(result.transactions);
    } catch (error) {
      console.error('Load transactions failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (toAddress, amount) => {
    try {
      const receipt = await sendTransaction(toAddress, amount);
      Alert.alert('Success', `Sent ${amount} CIV`);
      await refresh(); // Refresh balance
      await loadTransactions(); // Refresh transaction list
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Display real balance from blockchain
  return (
    <View>
      <Text>{balance} CIV</Text>
      {/* ... rest of UI */}
    </View>
  );
};

// ==========================================
// EXAMPLE 2: IdentityScreen Integration
// ==========================================

/*
BEFORE (Mock Data):
--------------------
const IdentityScreen = () => {
  const [credentials, setCredentials] = useState([
    { id: 1, type: 'education', issuer: 'University', ... },
  ]);
};

AFTER (Real Backend):
--------------------
*/

const IdentityScreen = () => {
  const { did, credentials, reputation } = useApp();
  const { createNewDID, issueNewCredential, verifyCredential } = useServices();
  
  const [loading, setLoading] = useState(false);

  const handleCreateDID = async () => {
    try {
      setLoading(true);
      const didData = {
        name: 'John Doe',
        birthdate: '1990-01-01',
        nationality: 'Indonesia',
      };
      
      const result = await createNewDID(didData);
      Alert.alert('Success', 'DID Created!');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCredential = async () => {
    try {
      const result = await issueNewCredential(
        did.id,
        'education',
        { degree: 'BSc Computer Science', university: 'Universitas Indonesia' }
      );
      Alert.alert('Success', 'Credential Issued!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <Text>Reputation: {reputation}/1000</Text>
      <Text>DID: {did?.id || 'Not created'}</Text>
      <Text>Credentials: {credentials.length}</Text>
      {/* ... rest of UI */}
    </View>
  );
};

// ==========================================
// EXAMPLE 3: GovernanceScreen Integration
// ==========================================

/*
BEFORE (Mock Data):
--------------------
const GovernanceScreen = () => {
  const [proposals, setProposals] = useState([
    { id: 1, title: 'CIP-003', status: 'Active', ... },
  ]);
};

AFTER (Real Backend):
--------------------
*/

const GovernanceScreen = () => {
  const { wallet } = useApp();
  const { createNewProposal, vote, getProposal, hasVoted } = useServices();
  
  const [proposals, setProposals] = useState([]);

  const loadProposals = async () => {
    // In production, fetch from blockchain or indexer API
    // For now, proposals can be loaded from contract events
  };

  const handleVote = async (proposalId, support) => {
    try {
      const alreadyVoted = await hasVoted(proposalId);
      
      if (alreadyVoted) {
        Alert.alert('Already Voted', 'You have already voted on this proposal');
        return;
      }

      await vote(proposalId, support);
      Alert.alert('Success', 'Vote recorded!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCreateProposal = async (title, description) => {
    try {
      const result = await createNewProposal(title, description);
      Alert.alert('Success', `Proposal ${result.proposalId} created!`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      {/* ... UI elements */}
    </View>
  );
};

// ==========================================
// EXAMPLE 4: StorageScreen Integration
// ==========================================

/*
BEFORE (Mock Data):
--------------------
const StorageScreen = () => {
  const [files, setFiles] = useState([
    { id: 1, name: 'document.pdf', size: '2.4 MB', ... },
  ]);
};

AFTER (Real Backend):
--------------------
*/

import * as DocumentPicker from 'expo-document-picker';

const StorageScreen = () => {
  const { uploadFile, downloadFile } = useServices();
  
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    try {
      // Pick file
      const result = await DocumentPicker.getDocumentAsync({});
      
      if (result.type === 'cancel') {
        return;
      }

      setUploading(true);

      // Upload to IPFS with encryption
      const uploadResult = await uploadFile(result.uri, {
        name: result.name,
        type: result.mimeType,
        size: result.size,
      });

      // Store file metadata locally or on-chain
      const fileData = {
        id: Date.now(),
        name: result.name,
        cid: uploadResult.cid,
        encryptionKey: uploadResult.encryptionKey,
        size: result.size,
        uploadedAt: Date.now(),
      };

      setFiles([fileData, ...files]);
      Alert.alert('Success', 'File uploaded to IPFS!');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      const data = await downloadFile(file.cid, file.encryptionKey);
      // Process downloaded data (save to device, display, etc.)
      Alert.alert('Success', 'File downloaded!');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <Button title="Upload File" onPress={handleUpload} disabled={uploading} />
      {files.map(file => (
        <TouchableOpacity key={file.id} onPress={() => handleDownload(file)}>
          <Text>{file.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ==========================================
// EXAMPLE 5: AnalyticsScreen Integration
// ==========================================

/*
BEFORE (Mock Data):
--------------------
const AnalyticsScreen = () => {
  const [stats, setStats] = useState({
    users: '2.4M',
    volume: '$58M',
    // ... mock data
  });
};

AFTER (Real Backend):
--------------------
*/

const AnalyticsScreen = () => {
  const { getGlobalAnalytics, getNetworkStats, getCarbonOffsetData } = useServices();
  
  const [analytics, setAnalytics] = useState(null);
  const [networkStats, setNetworkStats] = useState(null);
  const [carbonData, setCarbonData] = useState(null);

  useEffect(() => {
    loadAllAnalytics();
  }, []);

  const loadAllAnalytics = async () => {
    try {
      const [analyticsData, statsData, carbonInfo] = await Promise.all([
        getGlobalAnalytics(),
        getNetworkStats(),
        getCarbonOffsetData(),
      ]);

      setAnalytics(analyticsData);
      setNetworkStats(statsData);
      setCarbonData(carbonInfo);
    } catch (error) {
      console.error('Load analytics failed:', error);
    }
  };

  return (
    <View>
      <Text>{analytics?.totalUsers} Users</Text>
      <Text>{networkStats?.activeValidators} Validators</Text>
      <Text>{carbonData?.carbonSaved} CO₂ Saved</Text>
      {/* ... rest of UI */}
    </View>
  );
};

// ==========================================
// EXAMPLE 6: NodeScreen Integration
// ==========================================

const NodeScreen = () => {
  const { getValidators, getNetworkStats } = useServices();
  
  const [validators, setValidators] = useState([]);
  const [networkStats, setNetworkStats] = useState(null);

  useEffect(() => {
    loadValidatorData();
  }, []);

  const loadValidatorData = async () => {
    try {
      const [validatorList, stats] = await Promise.all([
        getValidators(20),
        getNetworkStats(),
      ]);

      setValidators(validatorList);
      setNetworkStats(stats);
    } catch (error) {
      console.error('Load validator data failed:', error);
    }
  };

  return (
    <View>
      <Text>{networkStats?.activeValidators} Active Nodes</Text>
      <Text>{networkStats?.networkUptime} Uptime</Text>
      {validators.map(validator => (
        <View key={validator.address}>
          <Text>{validator.name}</Text>
          <Text>{validator.stake} CIV Staked</Text>
          <Text>APR: {validator.apr}</Text>
        </View>
      ))}
    </View>
  );
};

// ==========================================
// INTEGRATION CHECKLIST
// ==========================================

/*
✅ STEP 1: Wrap your app with AppProvider
  - See App.js example below

✅ STEP 2: Import useApp and useServices in your screen
  import { useApp } from '../context/AppContext';
  import { useServices } from '../hooks/useServices';

✅ STEP 3: Replace mock state with context/hooks
  - Remove mock useState calls
  - Use wallet, balance, etc. from useApp()
  - Use service functions from useServices()

✅ STEP 4: Add loading states
  - Show loading indicators while fetching blockchain data
  - Handle errors gracefully with try/catch

✅ STEP 5: Add refresh functionality
  - Use refresh() from useServices() to reload data
  - Implement pull-to-refresh in lists

✅ STEP 6: Handle offline mode
  - Check isOnline from useApp()
  - Queue transactions when offline
  - Show appropriate UI states

✅ STEP 7: Test with real blockchain
  - Connect to testnet first
  - Verify all operations work correctly
  - Handle edge cases (insufficient funds, network errors, etc.)
*/

// ==========================================
// TESTING NOTES
// ==========================================

/*
LOCAL TESTING (Development):
- Services will use mock data when blockchain is unavailable
- Enable __DEV__ flag to use testnet
- Use localhost:8545 for local Hardhat/Ganache node

TESTNET TESTING:
- Update CONTRACT_ADDRESSES in contractService.js
- Update RPC URLs in web3Service.js
- Fund test accounts with testnet CIV tokens

MAINNET DEPLOYMENT:
- Use production CONTRACT_ADDRESSES
- Use production RPC endpoints
- Enable proper encryption for stored wallets
- Implement rate limiting for API calls
- Add analytics and error tracking
*/

export default {
  WalletScreen,
  IdentityScreen,
  GovernanceScreen,
  StorageScreen,
  AnalyticsScreen,
  NodeScreen,
};
