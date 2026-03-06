/**
 * CIVITAS Layer-2 / zk-Rollup Service
 * Implements transaction batching and ZK proof submission for low-fee execution.
 * Architecture: transactions are batched off-chain, a ZK proof is generated
 * (stub — replace with a real prover such as snarkjs/circom or a zkSync/StarkNet
 *  RPC in production), then the batch + proof is submitted to the on-chain
 *  ZKVerifier contract for final settlement.
 *
 * Document reference: "zk-Rollups for low fees; modular upgrades via governance"
 */

import { ethers } from 'ethers';

// ── ZKVerifier on-chain ABI (only the methods we need) ──────────────────────
const ZK_VERIFIER_ABI = [
  'function verifyProof(uint256[2] calldata a, uint256[2][2] calldata b, uint256[2] calldata c, uint256[] calldata publicInputs) external view returns (bool)',
  'function submitBatch(bytes32 batchRoot, uint256[] calldata publicInputs, bytes calldata proof) external returns (uint256 batchId)',
  'function getBatchStatus(uint256 batchId) external view returns (uint8 status, uint256 settledAt)',
  'event BatchSubmitted(uint256 indexed batchId, bytes32 batchRoot, address submitter)',
  'event BatchSettled(uint256 indexed batchId)',
];

// Batch status enum (mirrors the contract)
export const BatchStatus = {
  PENDING: 0,
  PROVING: 1,
  VERIFIED: 2,
  SETTLED: 3,
  FAILED: 4,
};

// Fee reduction factor vs L1 gas (configurable via governance)
const L2_FEE_FACTOR = 0.05; // 5 % of equivalent L1 cost
const MAX_BATCH_SIZE = 50;   // max transactions per batch
const BATCH_INTERVAL_MS = 10_000; // auto-flush every 10 s

class Layer2Service {
  constructor() {
    this.verifierAddress =
      import.meta.env.VITE_ZK_VERIFIER_ADDRESS ||
      '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e';

    this.pendingQueue = [];      // transactions waiting to be batched
    this.submittedBatches = {};  // batchId → { txs, status, submittedAt }
    this.batchCounter = 0;
    this._flushTimer = null;
    this.signer = null;
    this.verifierContract = null;
  }

  // ── Initialise with an ethers signer ──────────────────────────────────────
  async init(signer) {
    this.signer = signer;
    if (signer) {
      this.verifierContract = new ethers.Contract(
        this.verifierAddress,
        ZK_VERIFIER_ABI,
        signer
      );
    }
    this._startAutoFlush();
    console.log('✅ Layer-2 service initialised', {
      verifier: this.verifierAddress,
    });
  }

  destroy() {
    if (this._flushTimer) clearInterval(this._flushTimer);
  }

  // ── Fee estimation ─────────────────────────────────────────────────────────
  /**
   * Estimate the L2 fee for a transaction.
   * Returns BigInt in wei.  Roughly 5 % of the equivalent L1 gas cost.
   */
  async estimateL2Fee(txData) {
    try {
      const provider = this.signer?.provider;
      const gasPrice = provider
        ? await provider.getFeeData().then((d) => d.gasPrice ?? ethers.parseUnits('20', 'gwei'))
        : ethers.parseUnits('20', 'gwei');

      // Simple cost model: fixed 21 000 gas + 68 gas per non-zero byte
      const dataBytes = txData?.data
        ? ethers.getBytes(txData.data).filter((b) => b !== 0).length
        : 0;
      const estimatedGas = BigInt(21_000 + dataBytes * 68);
      const l1Cost = estimatedGas * gasPrice;
      const l2Cost = (l1Cost * BigInt(Math.round(L2_FEE_FACTOR * 100))) / BigInt(100);

      return {
        l1Fee: l1Cost.toString(),
        l2Fee: l2Cost.toString(),
        l2FeeEth: ethers.formatEther(l2Cost),
        savings: `${Math.round((1 - L2_FEE_FACTOR) * 100)} %`,
        gasPrice: gasPrice.toString(),
      };
    } catch (err) {
      console.error('L2 fee estimation error:', err);
      return { l2FeeEth: '0.0001', savings: '95 %', error: err.message };
    }
  }

  // ── Queue a transaction for batching ──────────────────────────────────────
  /**
   * Adds a transaction to the L2 pending queue.
   * Returns a local receipt with a queue index for tracking.
   */
  async queueTransaction(txData) {
    const entry = {
      id: `l2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      from: txData.from || this.signer?.address,
      to: txData.to,
      value: txData.value || '0',
      data: txData.data || '0x',
      nonce: txData.nonce ?? this.pendingQueue.length,
      queuedAt: Date.now(),
      status: 'queued',
    };

    this.pendingQueue.push(entry);
    console.log(`📬 Queued L2 tx: ${entry.id} (queue depth: ${this.pendingQueue.length})`);

    // Auto-flush if batch is full
    if (this.pendingQueue.length >= MAX_BATCH_SIZE) {
      await this.flushBatch();
    }

    return { queued: true, txId: entry.id, position: this.pendingQueue.length };
  }

  // ── Build + submit a batch ─────────────────────────────────────────────────
  /**
   * Flushes pending transactions into a single on-chain batch.
   * Generates a ZK proof stub and calls ZKVerifier.submitBatch().
   */
  async flushBatch() {
    if (this.pendingQueue.length === 0) return null;

    const txs = this.pendingQueue.splice(0, MAX_BATCH_SIZE);
    const batchId = ++this.batchCounter;

    // Build a deterministic batch root (merkle-style hash of all tx hashes)
    const txHashes = txs.map((tx) =>
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['address', 'address', 'uint256', 'bytes'],
          [tx.from || ethers.ZeroAddress, tx.to || ethers.ZeroAddress, tx.value, tx.data]
        )
      )
    );
    const batchRoot = this._merkleRoot(txHashes);

    // Generate ZK proof stub
    // ⚠️  In production replace with snarkjs.plonk.fullProve() or a prover API
    const { proof, publicInputs } = this._generateProofStub(batchRoot, txs);

    let onChainBatchId = batchId;
    let txHash = null;

    if (this.verifierContract && this.signer) {
      try {
        const tx = await this.verifierContract.submitBatch(batchRoot, publicInputs, proof);
        const receipt = await tx.wait();
        txHash = receipt.hash;

        // Parse emitted batchId from event if available
        const event = receipt.logs
          .map((log) => {
            try { return this.verifierContract.interface.parseLog(log); } catch { return null; }
          })
          .find((e) => e?.name === 'BatchSubmitted');
        if (event) onChainBatchId = Number(event.args.batchId);

        console.log(`✅ Batch #${onChainBatchId} submitted on-chain: ${txHash}`);
      } catch (err) {
        console.error('On-chain batch submission failed (running in simulation mode):', err.message);
      }
    } else {
      console.log(`🔵 Batch #${batchId} simulated (no signer — dev mode)`);
    }

    const record = {
      batchId: onChainBatchId,
      batchRoot,
      txs,
      proof,
      publicInputs,
      status: BatchStatus.PENDING,
      submittedAt: Date.now(),
      txHash,
    };
    this.submittedBatches[onChainBatchId] = record;

    return record;
  }

  // ── Batch status polling ───────────────────────────────────────────────────
  async getBatchStatus(batchId) {
    // Check local store first
    const local = this.submittedBatches[batchId];

    if (this.verifierContract) {
      try {
        const [status, settledAt] = await this.verifierContract.getBatchStatus(batchId);
        const s = Number(status);
        if (local) local.status = s;
        return { batchId, status: s, settledAt: Number(settledAt), onChain: true };
      } catch {
        // Contract not yet deployed or call failed — fall through to local
      }
    }

    if (local) {
      // Simulate progression for dev/demo purposes
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

  // ── Queue statistics ───────────────────────────────────────────────────────
  getStats() {
    return {
      pendingTxCount: this.pendingQueue.length,
      submittedBatchCount: Object.keys(this.submittedBatches).length,
      feeReductionFactor: L2_FEE_FACTOR,
      maxBatchSize: MAX_BATCH_SIZE,
      batchIntervalMs: BATCH_INTERVAL_MS,
    };
  }

  // ── All batches (for UI display) ──────────────────────────────────────────
  getAllBatches() {
    return Object.values(this.submittedBatches).sort((a, b) => b.submittedAt - a.submittedAt);
  }

  // ── Internal helpers ──────────────────────────────────────────────────────
  _startAutoFlush() {
    if (this._flushTimer) clearInterval(this._flushTimer);
    this._flushTimer = setInterval(() => {
      if (this.pendingQueue.length > 0) {
        this.flushBatch().catch(console.error);
      }
    }, BATCH_INTERVAL_MS);
  }

  /** Simple binary-tree Merkle root over keccak256 hashes */
  _merkleRoot(hashes) {
    if (hashes.length === 0) return ethers.ZeroHash;
    let layer = [...hashes];
    while (layer.length > 1) {
      const next = [];
      for (let i = 0; i < layer.length; i += 2) {
        const left = layer[i];
        const right = layer[i + 1] ?? layer[i]; // duplicate last if odd
        next.push(
          ethers.keccak256(ethers.concat([ethers.getBytes(left), ethers.getBytes(right)]))
        );
      }
      layer = next;
    }
    return layer[0];
  }

  /**
   * ZK proof stub — replace with a real prover in production.
   * Produces ABI-encoded Groth16-style arrays accepted by ZKVerifier.sol.
   */
  _generateProofStub(batchRoot, txs) {
    // Public inputs: [batchRoot as uint256, txCount]
    const rootAsUint = BigInt(batchRoot);
    const publicInputs = [rootAsUint, BigInt(txs.length)];

    // Encode a dummy proof (4 × 32-byte field elements representing a, b, c)
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

// Export a singleton
const layer2Service = new Layer2Service();
export default layer2Service;
