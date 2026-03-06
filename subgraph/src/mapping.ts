/**
 * CIVITAS Subgraph — AssemblyScript Event Handlers
 * Processes DIDRegistry and CIVITASGovernance events into GraphQL entities.
 */

import { BigInt, Bytes, log } from '@graphprotocol/graph-ts';

// Auto-generated type-safe bindings (output of `graph codegen`)
import {
  DIDCreated,
  DIDUpdated,
  DIDDeactivated,
  ProfileUpdated,
  CredentialIssued,
  CredentialRevoked,
  ReputationUpdated,
} from '../generated/DIDRegistry/DIDRegistry';

import {
  ProposalCreated,
  VoteCast,
  ProposalExecuted,
  ProposalCanceled,
} from '../generated/CIVITASGovernance/CIVITASGovernance';

import {
  EscrowCreated,
  EscrowReleased,
  EscrowRefunded,
  DisputeOpened,
} from '../generated/SmartEscrow/SmartEscrow';

import {
  NodeRegistered,
  NodeDeregistered,
  UptimeRecorded,
} from '../generated/NodeRegistry/NodeRegistry';

import {
  Staked,
  Unstaked,
  RewardClaimed,
} from '../generated/StakingPool/StakingPool';

import {
  TaskCreated,
  TaskExecuted,
  TaskDeactivated,
} from '../generated/AutomationEngine/AutomationEngine';

import {
  Transfer as CIVTransfer,
} from '../generated/CIVToken/CIVToken';

import {
  AccountFrozen,
  AccountUnfrozen,
} from '../generated/CIVITASWallet/CIVITASWallet';

import {
  RecoveryInitiated,
  RecoveryExecuted,
} from '../generated/SocialRecovery/SocialRecovery';

import {
  TxProposed,
  TxConfirmed,
  TxExecuted,
} from '../generated/MultiSigTreasury/MultiSigTreasury';

import {
  Claimed as AirdropClaimed,
  VestingClaimed,
} from '../generated/AirdropDistributor/AirdropDistributor';

import {
  ProofVerified,
} from '../generated/ZKVerifier/ZKVerifier';

import {
  DIDIdentity,
  IssuedCredential,
  ReputationEvent,
  Proposal,
  VoteRecord,
  CivitasStats,
  EscrowDeal,
  RegisteredNode,
  StakePosition,
  StakeEvent,
  AutomationTask,
  TaskExecution,
  TokenBurnEvent,
  WalletFreezeEvent,
  RecoveryEvent,
  TreasuryTx,
  AirdropClaim,
  ZKProofEvent,
} from '../generated/schema';

// ── Helpers ────────────────────────────────────────────────────────────────────

function getOrCreateStats(): CivitasStats {
  let stats = CivitasStats.load('global');
  if (!stats) {
    stats = new CivitasStats('global');
    stats.totalDIDs         = BigInt.fromI32(0);
    stats.totalCredentials  = BigInt.fromI32(0);
    stats.totalProposals    = BigInt.fromI32(0);
    stats.totalVotes        = BigInt.fromI32(0);
    stats.totalEscrows      = BigInt.fromI32(0);
    stats.totalNodes        = BigInt.fromI32(0);
    stats.totalStaked       = BigInt.fromI32(0);
    stats.totalTasksCreated = BigInt.fromI32(0);
    stats.totalTokensBurned = BigInt.fromI32(0);
    stats.lastUpdatedAt     = BigInt.fromI32(0);
  }
  return stats as CivitasStats;
}

// ── DIDRegistry Handlers ───────────────────────────────────────────────────────

export function handleDIDCreated(event: DIDCreated): void {
  const id = event.params.didIdentifier.toHexString();

  let entity = new DIDIdentity(id);
  entity.controller  = event.params.controller;
  entity.didDocument = '';
  entity.profileCID  = '';
  entity.reputation  = BigInt.fromI32(500); // INITIAL_REPUTATION from contract
  entity.active      = true;
  entity.createdAt   = event.block.timestamp;
  entity.updatedAt   = event.block.timestamp;
  entity.createdAtBlock = event.block.number;
  entity.save();

  const stats = getOrCreateStats();
  stats.totalDIDs = stats.totalDIDs.plus(BigInt.fromI32(1));
  stats.lastUpdatedAt = event.block.timestamp;
  stats.save();

  log.info('DIDCreated: {} controller={}', [id, event.params.controller.toHexString()]);
}

export function handleDIDUpdated(event: DIDUpdated): void {
  const id = event.params.didIdentifier.toHexString();
  let entity = DIDIdentity.load(id);
  if (!entity) {
    log.warning('DIDUpdated: DID {} not found', [id]);
    return;
  }
  entity.didDocument = event.params.didDocument;
  entity.updatedAt   = event.block.timestamp;
  entity.save();
}

export function handleDIDDeactivated(event: DIDDeactivated): void {
  const id = event.params.didIdentifier.toHexString();
  let entity = DIDIdentity.load(id);
  if (!entity) return;
  entity.active    = false;
  entity.updatedAt = event.block.timestamp;
  entity.save();
}

export function handleProfileUpdated(event: ProfileUpdated): void {
  const id = event.params.didIdentifier.toHexString();
  let entity = DIDIdentity.load(id);
  if (!entity) return;
  entity.profileCID = event.params.profileCID;
  entity.updatedAt  = event.block.timestamp;
  entity.save();
}

export function handleCredentialIssued(event: CredentialIssued): void {
  const didId = event.params.didIdentifier.toHexString();
  const credId = didId + '-' + event.params.credentialHash.toHexString();

  let cred = new IssuedCredential(credId);
  cred.did            = didId;
  cred.credentialHash = event.params.credentialHash;
  cred.issuer         = event.params.issuer;
  cred.issuedAt       = event.block.timestamp;
  cred.expiresAt      = BigInt.fromI32(0); // populated from contract call if needed
  cred.revoked        = false;
  cred.save();

  const stats = getOrCreateStats();
  stats.totalCredentials = stats.totalCredentials.plus(BigInt.fromI32(1));
  stats.lastUpdatedAt = event.block.timestamp;
  stats.save();
}

export function handleCredentialRevoked(event: CredentialRevoked): void {
  const didId = event.params.didIdentifier.toHexString();
  const credId = didId + '-' + event.params.credentialHash.toHexString();
  let cred = IssuedCredential.load(credId);
  if (!cred) return;
  cred.revoked   = true;
  cred.revokedAt = event.block.timestamp;
  cred.save();
}

export function handleReputationUpdated(event: ReputationUpdated): void {
  const didId = event.params.didIdentifier.toHexString();

  // Update DIDIdentity reputation field
  let entity = DIDIdentity.load(didId);
  if (entity) {
    entity.reputation = event.params.newReputation;
    entity.updatedAt  = event.block.timestamp;
    entity.save();
  }

  // Append to history
  const eventId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
  let repEvent = new ReputationEvent(eventId);
  repEvent.did           = didId;
  repEvent.newReputation = event.params.newReputation;
  repEvent.timestamp     = event.block.timestamp;
  repEvent.blockNumber   = event.block.number;
  repEvent.txHash        = event.transaction.hash;
  repEvent.save();
}

// ── Governance Handlers ────────────────────────────────────────────────────────

export function handleProposalCreated(event: ProposalCreated): void {
  const id = event.params.proposalId.toString();

  let proposal = new Proposal(id);
  proposal.proposer       = event.params.proposer;
  proposal.title          = event.params.title;
  proposal.votingDeadline = event.params.votingDeadline;
  proposal.forVotes       = BigInt.fromI32(0);
  proposal.againstVotes   = BigInt.fromI32(0);
  proposal.abstainVotes   = BigInt.fromI32(0);
  proposal.state          = 'Active';
  proposal.createdAt      = event.block.timestamp;
  proposal.createdAtBlock = event.block.number;
  proposal.save();

  const stats = getOrCreateStats();
  stats.totalProposals = stats.totalProposals.plus(BigInt.fromI32(1));
  stats.lastUpdatedAt = event.block.timestamp;
  stats.save();
}

export function handleVoteCast(event: VoteCast): void {
  const proposalId = event.params.proposalId.toString();
  const voteId = proposalId + '-' + event.params.voter.toHexString();

  let vote = new VoteRecord(voteId);
  vote.proposal  = proposalId;
  vote.voter     = event.params.voter;
  vote.support   = event.params.support;
  // Use decayedWeight (param index 3) as the effective on-chain weight
  vote.weight    = event.params.decayedWeight;
  vote.timestamp = event.block.timestamp;
  vote.txHash    = event.transaction.hash;
  vote.save();

  // Update proposal vote tallies
  let proposal = Proposal.load(proposalId);
  if (proposal) {
    const w = event.params.decayedWeight;
    if (event.params.support == 1)      proposal.forVotes     = proposal.forVotes.plus(w);
    else if (event.params.support == 0) proposal.againstVotes = proposal.againstVotes.plus(w);
    else                                proposal.abstainVotes = proposal.abstainVotes.plus(w);
    proposal.save();
  }

  const stats = getOrCreateStats();
  stats.totalVotes = stats.totalVotes.plus(BigInt.fromI32(1));
  stats.lastUpdatedAt = event.block.timestamp;
  stats.save();
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  let proposal = Proposal.load(event.params.proposalId.toString());
  if (!proposal) return;
  proposal.state = 'Executed';
  proposal.save();
}

export function handleProposalCanceled(event: ProposalCanceled): void {
  let proposal = Proposal.load(event.params.proposalId.toString());
  if (!proposal) return;
  proposal.state = 'Canceled';
  proposal.save();
}

// ── SmartEscrow Handlers ───────────────────────────────────────────────────────

export function handleEscrowCreated(event: EscrowCreated): void {
  const id = event.params.escrowId.toString();

  let deal = new EscrowDeal(id);
  deal.buyer            = event.params.buyer;
  deal.seller           = event.params.seller;
  deal.arbitrator       = event.params.arbitrator;
  deal.amount           = event.params.amount;
  deal.feeBps           = event.params.feeBps;
  deal.deadline         = BigInt.fromI32(0); // populated from contract if needed
  deal.state            = 'FUNDED';
  deal.createdAt        = event.block.timestamp;
  deal.createdAtBlock   = event.block.number;
  deal.txHash           = event.transaction.hash;
  deal.save();

  const stats = getOrCreateStats();
  stats.totalEscrows  = stats.totalEscrows.plus(BigInt.fromI32(1));
  stats.lastUpdatedAt = event.block.timestamp;
  stats.save();
}

export function handleEscrowReleased(event: EscrowReleased): void {
  let deal = EscrowDeal.load(event.params.escrowId.toString());
  if (!deal) return;
  deal.state = 'RELEASED';
  deal.save();
}

export function handleEscrowRefunded(event: EscrowRefunded): void {
  let deal = EscrowDeal.load(event.params.escrowId.toString());
  if (!deal) return;
  deal.state = 'REFUNDED';
  deal.save();
}

export function handleDisputeOpened(event: DisputeOpened): void {
  let deal = EscrowDeal.load(event.params.escrowId.toString());
  if (!deal) return;
  deal.state = 'DISPUTED';
  deal.save();
}

// ── NodeRegistry Handlers ─────────────────────────────────────────────────────

export function handleNodeRegistered(event: NodeRegistered): void {
  const id = event.params.operator.toHexString();

  let node = new RegisteredNode(id);
  node.operator            = event.params.operator;
  node.tier                = event.params.tier;
  node.stakeAmount         = event.params.stakeAmount;
  node.registeredAt        = event.block.timestamp;
  node.registeredAtBlock   = event.block.number;
  node.active              = true;
  node.save();

  const stats = getOrCreateStats();
  stats.totalNodes    = stats.totalNodes.plus(BigInt.fromI32(1));
  stats.lastUpdatedAt = event.block.timestamp;
  stats.save();
}

export function handleNodeDeregistered(event: NodeDeregistered): void {
  let node = RegisteredNode.load(event.params.operator.toHexString());
  if (!node) return;
  node.active = false;
  node.save();
}

export function handleUptimeRecorded(event: UptimeRecorded): void {
  // Uptime is stored in the contract; no new entity needed — just a log
  log.info('UptimeRecorded: operator={} epoch={}', [
    event.params.operator.toHexString(),
    event.params.epoch.toString()
  ]);
}

// ── StakingPool Handlers ──────────────────────────────────────────────────────

export function handleStaked(event: Staked): void {
  const stakerId = event.params.staker.toHexString();

  let pos = StakePosition.load(stakerId);
  if (!pos) {
    pos = new StakePosition(stakerId);
    pos.staker       = event.params.staker;
    pos.amount       = BigInt.fromI32(0);
    pos.since        = event.block.timestamp;
    pos.lastRewardAt = event.block.timestamp;
  }
  pos.amount = pos.amount.plus(event.params.amount);
  pos.save();

  const eventId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
  let se = new StakeEvent(eventId);
  se.staker    = event.params.staker;
  se.kind      = 'Staked';
  se.amount    = event.params.amount;
  se.timestamp = event.block.timestamp;
  se.txHash    = event.transaction.hash;
  se.save();

  const stats = getOrCreateStats();
  stats.totalStaked   = stats.totalStaked.plus(event.params.amount);
  stats.lastUpdatedAt = event.block.timestamp;
  stats.save();
}

export function handleUnstaked(event: Unstaked): void {
  let pos = StakePosition.load(event.params.staker.toHexString());
  if (pos) {
    pos.amount = pos.amount.minus(event.params.amount);
    if (pos.amount.lt(BigInt.fromI32(0))) pos.amount = BigInt.fromI32(0);
    pos.save();
  }

  const eventId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
  let se = new StakeEvent(eventId);
  se.staker    = event.params.staker;
  se.kind      = 'Unstaked';
  se.amount    = event.params.amount;
  se.timestamp = event.block.timestamp;
  se.txHash    = event.transaction.hash;
  se.save();

  const stats = getOrCreateStats();
  stats.totalStaked   = stats.totalStaked.minus(event.params.amount);
  if (stats.totalStaked.lt(BigInt.fromI32(0))) stats.totalStaked = BigInt.fromI32(0);
  stats.lastUpdatedAt = event.block.timestamp;
  stats.save();
}

export function handleRewardClaimed(event: RewardClaimed): void {
  let pos = StakePosition.load(event.params.staker.toHexString());
  if (pos) {
    pos.lastRewardAt = event.block.timestamp;
    pos.save();
  }

  const eventId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
  let se = new StakeEvent(eventId);
  se.staker    = event.params.staker;
  se.kind      = 'RewardClaimed';
  se.amount    = event.params.amount;
  se.timestamp = event.block.timestamp;
  se.txHash    = event.transaction.hash;
  se.save();
}

// ── AutomationEngine Handlers ─────────────────────────────────────────────────

export function handleTaskCreated(event: TaskCreated): void {
  const id = event.params.taskId.toString();

  let task = new AutomationTask(id);
  task.owner          = event.params.owner;
  task.triggerType    = event.params.triggerType;
  task.actionType     = event.params.actionType;
  task.active         = true;
  task.executionCount = BigInt.fromI32(0);
  task.createdAt      = event.block.timestamp;
  task.save();

  const stats = getOrCreateStats();
  stats.totalTasksCreated = stats.totalTasksCreated.plus(BigInt.fromI32(1));
  stats.lastUpdatedAt     = event.block.timestamp;
  stats.save();
}

export function handleTaskExecuted(event: TaskExecuted): void {
  let task = AutomationTask.load(event.params.taskId.toString());
  if (task) {
    task.executionCount = task.executionCount.plus(BigInt.fromI32(1));
    task.save();
  }

  const execId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
  let exec = new TaskExecution(execId);
  exec.task      = event.params.taskId.toString();
  exec.keeper    = event.params.keeper;
  exec.success   = event.params.success;
  exec.timestamp = event.block.timestamp;
  exec.txHash    = event.transaction.hash;
  exec.save();
}

export function handleTaskDeactivated(event: TaskDeactivated): void {
  let task = AutomationTask.load(event.params.taskId.toString());
  if (!task) return;
  task.active = false;
  task.save();
}

// ── CIVToken Handlers ─────────────────────────────────────────────────────────

// Track burns: Transfer to address(0) is an ERC-20 burn
export function handleCIVTokenTransfer(event: CIVTransfer): void {
  const ZERO = '0x0000000000000000000000000000000000000000';
  if (event.params.to.toHexString() != ZERO) return; // not a burn

  const burnId = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
  let burn = new TokenBurnEvent(burnId);
  burn.burner    = event.params.from;
  burn.amount    = event.params.value;
  burn.timestamp = event.block.timestamp;
  burn.txHash    = event.transaction.hash;
  burn.save();

  const stats = getOrCreateStats();
  stats.totalTokensBurned = stats.totalTokensBurned.plus(event.params.value);
  stats.lastUpdatedAt     = event.block.timestamp;
  stats.save();
}

// ── CIVITASWallet Handlers ────────────────────────────────────────────────────

export function handleAccountFrozen(event: AccountFrozen): void {
  const id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
  let freeze = new WalletFreezeEvent(id);
  freeze.account   = event.params.account;
  freeze.frozen    = true;
  freeze.reason    = event.params.reason;
  freeze.timestamp = event.block.timestamp;
  freeze.txHash    = event.transaction.hash;
  freeze.save();
}

export function handleAccountUnfrozen(event: AccountUnfrozen): void {
  const id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
  let unfreeze = new WalletFreezeEvent(id);
  unfreeze.account   = event.params.account;
  unfreeze.frozen    = false;
  unfreeze.reason    = 'unfrozen';
  unfreeze.timestamp = event.block.timestamp;
  unfreeze.txHash    = event.transaction.hash;
  unfreeze.save();
}

// ── SocialRecovery Handlers ───────────────────────────────────────────────────

export function handleRecoveryInitiated(event: RecoveryInitiated): void {
  const id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
  let ev = new RecoveryEvent(id);
  ev.account       = event.params.account;
  ev.kind          = 'Initiated';
  ev.proposedOwner = event.params.proposedOwner;
  ev.newOwner      = null;
  ev.timestamp     = event.block.timestamp;
  ev.txHash        = event.transaction.hash;
  ev.save();
}

export function handleRecoveryExecuted(event: RecoveryExecuted): void {
  const id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
  let ev = new RecoveryEvent(id);
  ev.account       = event.params.account;
  ev.kind          = 'Executed';
  ev.proposedOwner = null;
  ev.newOwner      = event.params.newOwner;
  ev.timestamp     = event.block.timestamp;
  ev.txHash        = event.transaction.hash;
  ev.save();
}

// ── MultiSigTreasury Handlers ─────────────────────────────────────────────────

export function handleTxProposed(event: TxProposed): void {
  const id = event.params.txId.toString();
  let tx = new TreasuryTx(id);
  tx.proposer      = event.params.proposer;
  tx.to            = event.params.to;
  tx.value         = event.params.value;
  tx.token         = event.params.token;
  tx.tokenAmount   = event.params.tokenAmount;
  tx.confirmations = BigInt.fromI32(0);
  tx.executed      = false;
  tx.proposedAt    = event.block.timestamp;
  tx.executedAt    = null;
  tx.txHash        = event.transaction.hash;
  tx.save();
}

export function handleTxConfirmed(event: TxConfirmed): void {
  let tx = TreasuryTx.load(event.params.txId.toString());
  if (!tx) return;
  tx.confirmations = event.params.confirmations;
  tx.save();
}

export function handleTxExecuted(event: TxExecuted): void {
  let tx = TreasuryTx.load(event.params.txId.toString());
  if (!tx) return;
  tx.executed   = true;
  tx.executedAt = event.block.timestamp;
  tx.save();
}

// ── AirdropDistributor Handlers ───────────────────────────────────────────────

export function handleAirdropClaimed(event: AirdropClaimed): void {
  const id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
  let claim = new AirdropClaim(id);
  claim.roundId   = event.params.roundId;
  claim.claimant  = event.params.claimant;
  claim.amount    = event.params.amount;
  claim.regional  = event.params.regional;
  claim.timestamp = event.block.timestamp;
  claim.txHash    = event.transaction.hash;
  claim.save();

  const stats = getOrCreateStats();
  stats.lastUpdatedAt = event.block.timestamp;
  stats.save();
}

export function handleVestingClaimed(event: VestingClaimed): void {
  const id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
  let claim = new AirdropClaim(id);
  claim.roundId   = BigInt.fromI32(-1); // vesting release, no round
  claim.claimant  = event.params.claimant;
  claim.amount    = event.params.amount;
  claim.regional  = false;
  claim.timestamp = event.block.timestamp;
  claim.txHash    = event.transaction.hash;
  claim.save();
}

// ── ZKVerifier Handlers ───────────────────────────────────────────────────────

export function handleProofVerified(event: ProofVerified): void {
  const id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString();
  let ev = new ZKProofEvent(id);
  ev.user      = event.params.user;
  ev.proofType = event.params.proofType;
  ev.valid     = event.params.valid;
  ev.expiry    = event.params.expiry;
  ev.timestamp = event.block.timestamp;
  ev.txHash    = event.transaction.hash;
  ev.save();
}
