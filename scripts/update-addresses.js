/**
 * Post-Deployment Configuration Script
 * Automatically updates contract addresses in mobile app after deployment
 */

const fs = require('fs');
const path = require('path');

async function updateContractAddresses() {
  console.log('📝 Updating contract addresses in mobile app...\n');

  // Read deployment info
  const deploymentsPath = path.join(__dirname, '../smart-contracts/deployments.json');
  
  if (!fs.existsSync(deploymentsPath)) {
    console.error('❌ deployments.json not found!');
    console.error('   Please run deployment first: npm run deploy:local');
    process.exit(1);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
  const contracts = deployments.contracts;

  console.log('Deployed contract addresses:');
  console.log('  CIVToken:', contracts.CIVToken);
  console.log('  DIDRegistry:', contracts.DIDRegistry);
  console.log('  CIVITASGovernance:', contracts.CIVITASGovernance);
  console.log('  CIVITASWallet:', contracts.CIVITASWallet);
  console.log('');

  // Update contractService.js
  const contractServicePath = path.join(__dirname, '../mobile-app/src/services/contractService.js');
  
  if (!fs.existsSync(contractServicePath)) {
    console.error('❌ contractService.js not found!');
    process.exit(1);
  }

  let contractService = fs.readFileSync(contractServicePath, 'utf8');

  // Replace contract addresses
  const addressPattern = /const CONTRACT_ADDRESSES = \{[\s\S]*?\};/;
  const newAddresses = `const CONTRACT_ADDRESSES = {
  CIV_TOKEN: '${contracts.CIVToken}',
  DID_REGISTRY: '${contracts.DIDRegistry}',
  GOVERNANCE: '${contracts.CIVITASGovernance}',
  WALLET_FACTORY: '${contracts.CIVITASWallet}',
};`;

  contractService = contractService.replace(addressPattern, newAddresses);
  fs.writeFileSync(contractServicePath, contractService);

  console.log('✅ Updated contract addresses in contractService.js');
  console.log('');

  // Update web3Service.js to use localhost
  const web3ServicePath = path.join(__dirname, '../mobile-app/src/services/web3Service.js');
  
  if (fs.existsSync(web3ServicePath)) {
    let web3Service = fs.readFileSync(web3ServicePath, 'utf8');
    
    // Add localhost configuration
    const localhostConfig = `

// Local Development Configuration (Hardhat)
const CIVITAS_LOCAL_CONFIG = {
  chainId: '0x7A69', // 31337 in hex
  chainName: 'Hardhat Local',
  nativeCurrency: {
    name: 'Test Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['http://127.0.0.1:8545'],
  blockExplorerUrls: [],
};

`;

    // Add after the testnet config
    if (!web3Service.includes('CIVITAS_LOCAL_CONFIG')) {
      web3Service = web3Service.replace(
        /const CIVITAS_TESTNET_CONFIG = \{[\s\S]*?\};/,
        (match) => match + localhostConfig
      );
    }

    // Update constructor to use local config in dev
    web3Service = web3Service.replace(
      /this\.isTestnet = __DEV__;/,
      `this.isTestnet = __DEV__;
    this.useLocal = true; // Set to false for testnet`
    );

    // Update initialize method
    web3Service = web3Service.replace(
      /const config = this\.isTestnet \? CIVITAS_TESTNET_CONFIG : CIVITAS_CHAIN_CONFIG;/,
      `const config = this.useLocal ? CIVITAS_LOCAL_CONFIG : (this.isTestnet ? CIVITAS_TESTNET_CONFIG : CIVITAS_CHAIN_CONFIG);`
    );

    fs.writeFileSync(web3ServicePath, web3Service);
    console.log('✅ Updated web3Service.js with localhost configuration');
    console.log('');
  }

  // Create deployment info file for mobile app
  const mobileDeploymentPath = path.join(__dirname, '../mobile-app/deployments.local.json');
  fs.writeFileSync(mobileDeploymentPath, JSON.stringify(deployments, null, 2));
  console.log('✅ Created deployments.local.json in mobile-app');
  console.log('');

  console.log('🎉 Configuration complete!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. cd mobile-app');
  console.log('   2. npm install (if not done yet)');
  console.log('   3. npm start');
  console.log('');
  console.log('💡 The app will connect to:');
  console.log('   RPC: http://127.0.0.1:8545');
  console.log('   Chain ID: 31337');
  console.log('');
}

updateContractAddresses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
