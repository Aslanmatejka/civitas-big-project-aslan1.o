/**
 * CIVITAS Protocol — Full Deployment Script
 *
 * Deploys all 12 contracts in dependency order:
 *   1.  CIVToken            (no deps)
 *   2.  DIDRegistry         (no deps)
 *   3.  StakingPool         (CIVToken)
 *   4.  ZKVerifier          (no deps)
 *   5.  CIVITASWallet       (CIVToken)
 *   6.  CIVITASGovernance   (no deps — CIVToken/DID checked off-chain)
 *   7.  SmartEscrow         (CIVToken)
 *   8.  AutomationEngine    (CIVToken)
 *   9.  NodeRegistry        (CIVToken, StakingPool)
 *   10. SocialRecovery      (no deps)
 *   11. MultiSigTreasury    (treasury address)
 *   12. AirdropDistributor  (CIVToken, treasury, DIDRegistry)
 *
 * After deployment:
 *   - Cross-contract role wiring
 *   - Writes deployment artifacts → deployments/<network>.json
 *   - Writes env vars → web-app/.env.contracts
 */

const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

function section(title) {
  console.log("\n" + "═".repeat(60));
  console.log(`  ${title}`);
  console.log("═".repeat(60));
}
function deployed(name, address) {
  console.log(`  ✓  ${name.padEnd(22)} → ${address}`);
}

async function main() {
  const [deployer, treasury, team, community] = await ethers.getSigners();

  section("CIVITAS Protocol Deployment");
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  Treasury : ${treasury.address}`);
  console.log(`  Network  : ${(await ethers.provider.getNetwork()).name}`);
  console.log(`  Block    : ${await ethers.provider.getBlockNumber()}`);

  // ── 1. CIVToken ─────────────────────────────────────────────────────────────
  section("1 / 12  CIVToken");
  const CIVToken = await ethers.getContractFactory("CIVToken");
  const civToken = await CIVToken.deploy(
    treasury.address,
    deployer.address,   // nodeRewardsAddress — deployer acts as node-reward holder initially
    team.address,
    community.address
  );
  await civToken.waitForDeployment();
  const civTokenAddr = await civToken.getAddress();
  deployed("CIVToken", civTokenAddr);

  // ── 2. DIDRegistry ──────────────────────────────────────────────────────────
  section("2 / 12  DIDRegistry");
  const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
  const didRegistry = await DIDRegistry.deploy();
  await didRegistry.waitForDeployment();
  const didRegistryAddr = await didRegistry.getAddress();
  deployed("DIDRegistry", didRegistryAddr);

  // ── 3. StakingPool ──────────────────────────────────────────────────────────
  section("3 / 12  StakingPool");
  const StakingPool = await ethers.getContractFactory("StakingPool");
  const stakingPool = await StakingPool.deploy(civTokenAddr, treasury.address);
  await stakingPool.waitForDeployment();
  const stakingPoolAddr = await stakingPool.getAddress();
  deployed("StakingPool", stakingPoolAddr);

  // ── 4. ZKVerifier ───────────────────────────────────────────────────────────
  section("4 / 12  ZKVerifier");
  const ZKVerifier = await ethers.getContractFactory("ZKVerifier");
  const zkVerifier = await ZKVerifier.deploy();
  await zkVerifier.waitForDeployment();
  const zkVerifierAddr = await zkVerifier.getAddress();
  deployed("ZKVerifier", zkVerifierAddr);

  // ── 5. CIVITASWallet ────────────────────────────────────────────────────────
  section("5 / 12  CIVITASWallet");
  const CIVITASWallet = await ethers.getContractFactory("CIVITASWallet");
  // Constructor expects (address[] owners, uint256 requiredConfirmations)
  const civWallet = await CIVITASWallet.deploy(
    [deployer.address, treasury.address],
    1 // require 1-of-2 for dev; increase for production
  );
  await civWallet.waitForDeployment();
  const civWalletAddr = await civWallet.getAddress();
  deployed("CIVITASWallet", civWalletAddr);

  // ── 6. CIVITASGovernance ────────────────────────────────────────────────────
  section("6 / 12  CIVITASGovernance");
  const CIVITASGovernance = await ethers.getContractFactory("CIVITASGovernance");
  // Constructor takes no arguments — CIVToken/DID read off-chain or via future integration
  const governance = await CIVITASGovernance.deploy();
  await governance.waitForDeployment();
  const governanceAddr = await governance.getAddress();
  deployed("CIVITASGovernance", governanceAddr);

  // ── 7. SmartEscrow ──────────────────────────────────────────────────────────
  section("7 / 12  SmartEscrow");
  const SmartEscrow = await ethers.getContractFactory("SmartEscrow");
  const escrow = await SmartEscrow.deploy(civTokenAddr, treasury.address);
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  deployed("SmartEscrow", escrowAddr);

  // ── 8. AutomationEngine ─────────────────────────────────────────────────────
  section("8 / 12  AutomationEngine");
  const AutomationEngine = await ethers.getContractFactory("AutomationEngine");
  const automation = await AutomationEngine.deploy(civTokenAddr, treasury.address);
  await automation.waitForDeployment();
  const automationAddr = await automation.getAddress();
  deployed("AutomationEngine", automationAddr);

  // ── 9. NodeRegistry ─────────────────────────────────────────────────────────
  section("9 / 12  NodeRegistry");
  const NodeRegistry = await ethers.getContractFactory("NodeRegistry");
  const nodeRegistry = await NodeRegistry.deploy(civTokenAddr, treasury.address);
  await nodeRegistry.waitForDeployment();
  const nodeRegistryAddr = await nodeRegistry.getAddress();
  deployed("NodeRegistry", nodeRegistryAddr);

  // ── 10. SocialRecovery ──────────────────────────────────────────────────────
  section("10 / 12  SocialRecovery");
  const SocialRecovery = await ethers.getContractFactory("SocialRecovery");
  const socialRecovery = await SocialRecovery.deploy();
  await socialRecovery.waitForDeployment();
  const socialRecoveryAddr = await socialRecovery.getAddress();
  deployed("SocialRecovery", socialRecoveryAddr);

  // ── 11. MultiSigTreasury ────────────────────────────────────────────────────
  section("11 / 12  MultiSigTreasury");
  const MultiSigTreasury = await ethers.getContractFactory("MultiSigTreasury");
  // Initial owners: deployer + treasury + team; require 2 of 3
  const multiSigTreasury = await MultiSigTreasury.deploy(
    [deployer.address, treasury.address, team.address],
    2
  );
  await multiSigTreasury.waitForDeployment();
  const multiSigTreasuryAddr = await multiSigTreasury.getAddress();
  deployed("MultiSigTreasury", multiSigTreasuryAddr);

  // ── 12. AirdropDistributor ──────────────────────────────────────────────────
  section("12 / 12  AirdropDistributor");
  const AirdropDistributor = await ethers.getContractFactory("AirdropDistributor");
  const airdrop = await AirdropDistributor.deploy(
    civTokenAddr,
    multiSigTreasuryAddr, // unclaimed tokens flow back to multi-sig treasury
    didRegistryAddr
  );
  await airdrop.waitForDeployment();
  const airdropAddr = await airdrop.getAddress();
  deployed("AirdropDistributor", airdropAddr);

  // Fund AirdropDistributor with 20% of CIV supply (200M tokens)
  const AIRDROP_ALLOC = ethers.parseEther("200000000");
  await civToken.connect(community).transfer(airdropAddr, AIRDROP_ALLOC);
  console.log(`  ✓  Sent 200M CIV to AirdropDistributor`);

  // ── Cross-Contract Role Wiring ───────────────────────────────────────────────
  section("Cross-Contract Role Wiring");

  const SLASHER_ROLE   = ethers.keccak256(ethers.toUtf8Bytes("SLASHER_ROLE"));
  const GOVERNANCE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("GOVERNANCE_ROLE"));
  const KEEPER_ROLE    = ethers.keccak256(ethers.toUtf8Bytes("KEEPER_ROLE"));

  await stakingPool.grantRole(SLASHER_ROLE, governanceAddr);
  console.log("  ✓  Governance → StakingPool.SLASHER_ROLE");

  await nodeRegistry.grantRole(SLASHER_ROLE, governanceAddr);
  console.log("  ✓  Governance → NodeRegistry.SLASHER_ROLE");

  await zkVerifier.grantRole(GOVERNANCE_ROLE, governanceAddr);
  console.log("  ✓  Governance → ZKVerifier.GOVERNANCE_ROLE");

  await automation.grantRole(KEEPER_ROLE, nodeRegistryAddr);
  console.log("  ✓  NodeRegistry → AutomationEngine.KEEPER_ROLE");

  // Wire Governance to CIVToken and DIDRegistry for on-chain checks
  await governance.setCIVToken(civTokenAddr);
  console.log("  ✓  Governance.setCIVToken → CIVToken");

  await governance.setDIDRegistry(didRegistryAddr);
  console.log("  ✓  Governance.setDIDRegistry → DIDRegistry");

  // ── Treasury → StakingPool approval ─────────────────────────────────────────
  section("Treasury Approval for Staking Rewards");
  await civToken.connect(treasury).approve(stakingPoolAddr, ethers.MaxUint256);
  console.log("  ✓  Treasury → StakingPool unlimited CIV approval");

  // Fund NodeRegistry with node-reward allocation (200M CIV = 20% of supply)
  const NODE_ALLOC = ethers.parseEther("200000000");
  await civToken.connect(treasury).transfer(nodeRegistryAddr, NODE_ALLOC);
  console.log(`  ✓  Sent 200M CIV to NodeRegistry for epoch rewards`);

  // ── Summary ──────────────────────────────────────────────────────────────────
  section("Deployment Complete — Address Summary");

  const result = {
    network:     (await ethers.provider.getNetwork()).name,
    blockNumber: await ethers.provider.getBlockNumber(),
    deployer:    deployer.address,
    treasury:    treasury.address,
    timestamp:   new Date().toISOString(),
    contracts: {
      CIVToken:            civTokenAddr,
      DIDRegistry:         didRegistryAddr,
      StakingPool:         stakingPoolAddr,
      ZKVerifier:          zkVerifierAddr,
      CIVITASWallet:       civWalletAddr,
      CIVITASGovernance:   governanceAddr,
      SmartEscrow:         escrowAddr,
      AutomationEngine:    automationAddr,
      NodeRegistry:        nodeRegistryAddr,
      SocialRecovery:      socialRecoveryAddr,
      MultiSigTreasury:    multiSigTreasuryAddr,
      AirdropDistributor:  airdropAddr,
    }
  };
  console.log(JSON.stringify(result, null, 2));

  // Write deployment JSON
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });
  const networkName = result.network === "unknown" ? "hardhat" : result.network;
  const outPath = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\n  › Artifacts → deployments/${networkName}.json`);

  // Write frontend .env.contracts
  const envContent = Object.entries(result.contracts)
    .map(([k, v]) => `VITE_${k.toUpperCase()}_ADDRESS=${v}`)
    .join("\n") + "\n";
  const webAppEnvPath = path.join(__dirname, "..", "..", "web-app", ".env.contracts");
  fs.writeFileSync(webAppEnvPath, envContent);
  console.log(`  › Contract addresses → web-app/.env.contracts`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Deployment failed:", err);
    process.exit(1);
  });
