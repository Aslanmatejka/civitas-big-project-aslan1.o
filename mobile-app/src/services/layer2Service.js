/**
 * CIVITAS Layer-2 / zk-Rollup Service  (React Native / Expo)
 * Implements transaction batching and ZK proof submission for low-fee execution.
 *
 * Same architecture as the web-app service:
 *   - Queue transactions off-chain
 *   - Build a Merkle batch root
 *   - Generate ZK proof stub (replace with snarkjs in production)
 *   - Submit batch to on-chain ZKVerifier contract
 *
 * Document reference: "zk-Rollups for low fees; modular upgrades via governance"
 */

import { ethers } from 'ethers';
import { ZK_VERIFIER_ADDRESS } from './contractService';

// ── Constants ─────────────────────────────────────────────────────────────────
const ZK_VERIFIER_ABI = [
  'function verifyProof(uint256[2] calldata a, uint256[2][2] calldata b, uint256[2] calldata c, uint256[] calldata publicInputs) external view returns (bool)',
  'function submitBatch(bytes32 batchRoot, uint256[] calldata publicInputs, bytes calldata proof) external returns (uint256 batchId)',
  'function getBatchStatus(uint256 batchId) external view returns (uint8 status, uint256 settledAt)',
  'event BatchSubmitted(uint256 indexed batchId, bytes32 batchRoot, address submitter)',
  'event BatchSettled(uint256 indexed batchId)',
];

export const BatchStatus = {
  PENDING:  0,
  PROVING:  1,
  VERIFIED: 2,
  SETTLED:  3,
  FAILED:   4,
};

const L2_FEE_FACTOR   = 0.05;   // 5 % of equivalent L1 cost
const MAX_BATCH_SIZE  = 50;
const BATCH_INTERVAL_MS = 10_000;

// ── Service Class ─────────────────────────────────────────────────────────────
class Layer2Service {
  constructor() {
    this.pendingQueue     = [];
    this.submittedBatches = {};
    this.batchCounter     = 0;
    this._flushTimer      = null;
    this.signer           = null;
    this.verifierContract = null;
  }

  /* Initialise with an ethers Signer (from web3Service / ethers.Wallet) */
  async init(signer) {
    this.signer = signer;
    if (signer) {
      this.verifierContract = new ethers.Contract(
        ZK_VERIFIER_ADDRESS,
        ZK_VERIFIER_ABI,
        signer
      );
    }
    this._startAutoFlush();
    console.log('[L2] Service initialised');
  }

  destroy() {
    if (this._flushTimer) clearInterval(this._flushTimer);
  }

  // ── Fee estimation ─────────────────────────────────────────────────────────
  async estimateL2Fee(txData = {}) {
    try {
      const provider = this.signer?.provider;
      let gasPrice = ethers.parseUnits('20', 'gwei');
      if (provider) {
        const feeData = await provider.getFeeData();
        gasPrice = feeData.gasPrice ?? gasPrice;
      }

      const dataBytes = txData?.data
        ? ethers.getBytes(txData.data).filter((b) => b !== 0).length
        : 0;
      const estimatedGas = BigInt(21_000 + dataBytes * 68);
      const l1Cost  = estimatedGas * gasPrice;
      const l2Cost  = (l1Cost * BigInt(Math.round(L2_FEE_FACTOR * 100))) / BigInt(100);

      return {
        l1Fee:    l1Cost.toString(),
        l2Fee:    l2Cost.toString(),
        l2FeeEth: ethers.formatEther(l2Cost),
        savings:  `${Math.round((1 - L2_FEE_FACTOR) * 100)} %`,
      };
    } catch (err) {
      return { l2FeeEth: '0.0001', savings: '95 %', error: err.message };
    }
  }

  // ── Queue a transaction ────────────────────────────────────────────────────
  async queueTransaction(txData) {
    const entry = {
      id:       `l2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      from:     txData.from || this.signer?.address,
      to:       txData.to,
      value:    txData.value || '0',
      data:     txData.data  || '0x',
      nonce:    txData.nonce ?? this.pendingQueue.length,
      queuedAt: Date.now(),
      status:   'queued',
    };

    this.pendingQueue.push(entry);
    console.log(`[L2] Queued tx: ${entry.id} (depth: ${this.pendingQueue.length})`);

    if (this.pendingQueue.length >= MAX_BATCH_SIZE) {
      await this.flushBatch();
    }

    return { queued: true, txId: entry.id, position: this.pendingQueue.length };
  }

  // ── Flush batch to chain ───────────────────────────────────────────────────
  async flushBatch() {
    if (this.pendingQueue.length === 0) return null;

    const txs       = this.pendingQueue.splice(0, MAX_BATCH_SIZE);
    const batchId   = ++this.batchCounter;
    const txHashes  = txs.map((tx) =>
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['address', 'address', 'uint256', 'bytes'],
          [
            tx.from  || ethers.ZeroAddress,
            tx.to    || ethers.ZeroAddress,
            tx.value,
            tx.data,
          ]
        )
      )
    );
    const batchRoot           = this._merkleRoot(txHashes);
    const { proof, publicInputs } = this._generateProofStub(batchRoot, txs);

    let onChainBatchId = batchId;
    let txHash         = null;

    if (this.verifierContract && this.signer) {
      try {
        const tx      = await this.verifierContract.submitBatch(batchRoot, publicInputs, proof);
        const receipt = await tx.wait();
        txHash        = receipt.hash;

        const event = receipt.logs
          .map((log) => {
            try { return this.verifierContract.interface.parseLog(log); } catch { return null; }
          })
          .find((e) => e?.name === 'BatchSubmitted');
        if (event) onChainBatchId = Number(event.args.batchId);

        console.log(`[L2] Batch #${onChainBatchId} on-chain: ${txHash}`);
      } catch (err) {
        console.warn('[L2] On-chain submission failed (simulation mode):', err.message);
      }
    } else {
      console.log(`[L2] Batch #${batchId} simulated`);
    }

    const record = {
      batchId: onChainBatchId, batchRoot, txs, proof, publicInputs,
      status: BatchStatus.PENDING, submittedAt: Date.now(), txHash,
    };
    this.submittedBatches[onChainBatchId] = record;
    return record;
  }

  // ── Batch status ───────────────────────────────────────────────────────────
  async getBatchStatus(batchId) {
    const local = this.submittedBatches[batchId];

    if (this.verifierContract) {
      try {
        const [status, settledAt] = await this.verifierContract.getBatchStatus(batchId);
        const s = Number(status);
        if (local) local.status = s;
        return { batchId, status: s, settledAt: Number(settledAt), onChain: true };
      } catch { /* fall through */ }
    }

    if (local) {
      const age = (Date.now() - local.submittedAt) / 1000;
      let status = BatchStatus.PENDING;
      if (age > 5)  status = BatchStatus.PROVING;
      if (age > 15) status = BatchStatus.VERIFIED;
      if (age > 30) status = BatchStatus.SETTLED;
      local.status = status;
      return { batchId, status, settledAt: age > 30 ? local.submittedAt + 30_000 : 0, onChain: false };
    }
    return { batchId, status: BatchStatus.FAILED, error: 'Batch not found' };
  }

  getStats() {
    return {
      pendingTxCount:      this.pendingQueue.length,
      submittedBatchCount: Object.keys(this.submittedBatches).length,
      feeReductionFactor:  L2_FEE_FACTOR,
      maxBatchSize:        MAX_BATCH_SIZE,
    };
  }

  getAllBatches() {
    return Object.values(this.submittedBatches).sort((a, b) => b.submittedAt - a.submittedAt);
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  _startAutoFlush() {
    if (this._flushTimer) clearInterval(this._flushTimer);
    this._flushTimer = setInterval(() => {
      if (this.pendingQueue.length > 0) this.flushBatch().catch(console.error);
    }, BATCH_INTERVAL_MS);
  }

  _merkleRoot(hashes) {
    if (hashes.length === 0) return ethers.ZeroHash;
    let layer = [...hashes];
    while (layer.length > 1) {
      const next = [];
      for (let i = 0; i < layer.length; i += 2) {
        const left  = layer[i];
        const right = layer[i + 1] ?? layer[i];
        next.push(
          ethers.keccak256(ethers.concat([ethers.getBytes(left), ethers.getBytes(right)]))
        );
      }
      layer = next;
    }
    return layer[0];
  }

  _generateProofStub(batchRoot, txs) {
    const rootAsUint = BigInt(batchRoot);
    const publicInputs = [rootAsUint, BigInt(txs.length)];
    const proof = ethers.AbiCoder.defaultAbiCoder().encode(
      ['uint256[2]', 'uint256[2][2]', 'uint256[2]'],
      [
        [rootAsUint % (2n ** 254n), BigInt(txs.length)],
        [[1n, 2n], [3n, 4n]],
        [5n, 6n],
      ]
    );
    return { proof, publicInputs };
  }
}

const layer2Service = new Layer2Service();
export default layer2Service;
