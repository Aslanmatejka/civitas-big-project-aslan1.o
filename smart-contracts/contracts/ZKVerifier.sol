// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ZKVerifier
 * @dev On-chain Zero-Knowledge proof verifier for CIVITAS.
 *
 * Architecture Layer 2 — Identity and Privacy
 *
 * Features:
 * - Verify ZK proofs for private credentials (age, income, identity)
 * - Groth16 elliptic-curve proof verification (BN128 / alt_bn128 precompile)
 * - Verification keys registered per proof type by governance/admin
 * - Results cached on-chain: address → proofType → verified (no data revealed)
 * - Credential types: AGE_OVER_18, INCOME_ABOVE_THRESHOLD, KYC_PASSED, CITIZENSHIP, ACCREDITED_INVESTOR
 * - Integrates with DIDRegistry: verified status can be used as credential
 *
 * Groth16: A valid proof π = (A, B, C) verifies iff:
 *   e(A, B) = e(α, β) · e(Σ(public_i · γ_i), γ) · e(C, δ)
 * We delegate this to the BN128 precompiles (0x06–0x08).
 */
contract ZKVerifier is AccessControl {

    bytes32 public constant VERIFIER_ADMIN_ROLE = keccak256("VERIFIER_ADMIN_ROLE");
    bytes32 public constant GOVERNANCE_ROLE     = keccak256("GOVERNANCE_ROLE");

    // ── Proof Types ───────────────────────────────────────────────────────────

    uint8 public constant PROOF_AGE_OVER_18            = 0;
    uint8 public constant PROOF_INCOME_ABOVE_THRESHOLD = 1;
    uint8 public constant PROOF_KYC_PASSED             = 2;
    uint8 public constant PROOF_CITIZENSHIP            = 3;
    uint8 public constant PROOF_ACCREDITED_INVESTOR    = 4;
    uint8 public constant PROOF_IDENTITY_HASH          = 5;

    uint8 public constant MAX_PROOF_TYPE = 5;

    // ── BN128 / Groth16 structures ────────────────────────────────────────────

    // G1 point (x, y) on BN128
    struct G1Point {
        uint256 X;
        uint256 Y;
    }

    // G2 point (x[0], x[1], y[0], y[1]) on BN128
    struct G2Point {
        uint256[2] X;
        uint256[2] Y;
    }

    // Groth16 verification key for one proof type
    struct VerifyingKey {
        G1Point alpha;
        G2Point beta;
        G2Point gamma;
        G2Point delta;
        G1Point[] ic;  // (n+1) IC elements for n public inputs
        bool registered;
    }

    // Groth16 proof
    struct Proof {
        G1Point A;
        G2Point B;
        G1Point C;
    }

    // ── State ─────────────────────────────────────────────────────────────────

    // proofType → VerifyingKey
    mapping(uint8 => VerifyingKey) private verifyingKeys;

    // user → proofType → verified
    mapping(address => mapping(uint8 => bool)) public verifiedCredentials;

    // user → proofType → timestamp of verification
    mapping(address => mapping(uint8 => uint256)) public verificationTimestamp;

    // user → proofType → expiry (0 = no expiry)
    mapping(address => mapping(uint8 => uint256)) public verificationExpiry;

    // Default credential validity: 1 year
    uint256 public constant DEFAULT_VALIDITY = 365 days;

    event VerificationKeyRegistered(uint8 indexed proofType, bytes32 vkHash);
    event ProofVerified(address indexed user, uint8 indexed proofType, bool valid, uint256 expiry);
    event CredentialRevoked(address indexed user, uint8 indexed proofType);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ADMIN_ROLE, msg.sender);
        _grantRole(GOVERNANCE_ROLE, msg.sender);
    }

    // ── Verification Key Management ───────────────────────────────────────────

    /**
     * @dev Register/update a Groth16 verification key for a proof type.
     *      Only VERIFIER_ADMIN_ROLE (governance-controlled) can set keys.
     *      ic.length must equal (number of public inputs + 1).
     */
    function registerVerifyingKey(
        uint8 proofType,
        G1Point calldata alpha,
        G2Point calldata beta,
        G2Point calldata gamma,
        G2Point calldata delta,
        G1Point[] calldata ic
    ) external onlyRole(VERIFIER_ADMIN_ROLE) {
        require(proofType <= MAX_PROOF_TYPE, "Unknown proof type");
        require(ic.length >= 2, "Need at least 2 IC elements");

        VerifyingKey storage vk = verifyingKeys[proofType];
        vk.alpha = alpha;
        vk.beta  = beta;
        vk.gamma = gamma;
        vk.delta = delta;
        vk.registered = true;

        delete vk.ic;
        for (uint256 i = 0; i < ic.length; i++) {
            vk.ic.push(ic[i]);
        }

        // Compute a hash of the VK for event indexing
        bytes32 vkHash = keccak256(abi.encode(alpha, beta, gamma, delta, ic));
        emit VerificationKeyRegistered(proofType, vkHash);
    }

    // ── Proof Verification ────────────────────────────────────────────────────

    /**
     * @dev Submit a Groth16 proof. If valid, records on-chain credential.
     *      Public inputs must match the proof's statement (e.g. [1] for "age ≥ 18").
     *      Caller is the subject (proves about themselves).
     */
    function verifyAndRecord(
        uint8 proofType,
        Proof calldata proof,
        uint256[] calldata publicInputs,
        uint256 validityDuration   // 0 = DEFAULT_VALIDITY
    ) external returns (bool) {
        require(proofType <= MAX_PROOF_TYPE, "Unknown proof type");

        VerifyingKey storage vk = verifyingKeys[proofType];
        require(vk.registered, "No VK registered for this proof type");
        require(publicInputs.length + 1 == vk.ic.length, "Wrong public input count");

        bool valid = _verifyGroth16(proof, publicInputs, vk);

        uint256 expiry = block.timestamp + (validityDuration > 0 ? validityDuration : DEFAULT_VALIDITY);

        if (valid) {
            verifiedCredentials[msg.sender][proofType] = true;
            verificationTimestamp[msg.sender][proofType] = block.timestamp;
            verificationExpiry[msg.sender][proofType] = expiry;
        }

        emit ProofVerified(msg.sender, proofType, valid, expiry);
        return valid;
    }

    /**
     * @dev Admin/governance can verify on behalf of a user (e.g. KYC provider submission).
     */
    function adminVerify(
        address user,
        uint8 proofType,
        uint256 validityDuration
    ) external onlyRole(VERIFIER_ADMIN_ROLE) {
        require(proofType <= MAX_PROOF_TYPE, "Unknown proof type");
        uint256 expiry = block.timestamp + (validityDuration > 0 ? validityDuration : DEFAULT_VALIDITY);
        verifiedCredentials[user][proofType] = true;
        verificationTimestamp[user][proofType] = block.timestamp;
        verificationExpiry[user][proofType] = expiry;
        emit ProofVerified(user, proofType, true, expiry);
    }

    /**
     * @dev Revoke a credential (governance or self-revocation).
     */
    function revokeCredential(address user, uint8 proofType) external {
        require(
            msg.sender == user || hasRole(GOVERNANCE_ROLE, msg.sender),
            "Not authorized"
        );
        verifiedCredentials[user][proofType] = false;
        emit CredentialRevoked(user, proofType);
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    /**
     * @dev Check if user has a valid (non-expired) credential.
     */
    function hasValidCredential(address user, uint8 proofType) external view returns (bool) {
        if (!verifiedCredentials[user][proofType]) return false;
        uint256 expiry = verificationExpiry[user][proofType];
        if (expiry == 0) return true;
        return block.timestamp <= expiry;
    }

    /**
     * @dev Batch check — useful for dApps checking multiple credentials at once.
     */
    function hasCredentials(address user, uint8[] calldata proofTypes) external view returns (bool[] memory results) {
        results = new bool[](proofTypes.length);
        for (uint256 i = 0; i < proofTypes.length; i++) {
            uint8 pt = proofTypes[i];
            results[i] = verifiedCredentials[user][pt] &&
                (verificationExpiry[user][pt] == 0 || block.timestamp <= verificationExpiry[user][pt]);
        }
    }

    function isKeyRegistered(uint8 proofType) external view returns (bool) {
        return verifyingKeys[proofType].registered;
    }

    // ── Internal Groth16 Verification ─────────────────────────────────────────

    /**
     * @dev Groth16 verification using BN128 precompiles.
     *      e(A, B) == e(vk.alpha, vk.beta) * e(vk_x, vk.gamma) * e(C, vk.delta)
     *
     *      Negated and rearranged for pairing batch:
     *      e(-A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) == 1
     */
    function _verifyGroth16(
        Proof calldata proof,
        uint256[] calldata input,
        VerifyingKey storage vk
    ) internal view returns (bool) {
        // Compute vk_x = IC[0] + Σ(input[i] * IC[i+1])
        G1Point memory vk_x = G1Point(vk.ic[0].X, vk.ic[0].Y);
        for (uint256 i = 0; i < input.length; i++) {
            G1Point memory scaled = _g1ScalarMul(vk.ic[i + 1], input[i]);
            vk_x = _g1Add(vk_x, scaled);
        }

        // Pairing check: e(-A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) == 1
        bool ok = _bn128Pairing(
            [
                _negate(proof.A), proof.B,
                vk.alpha,         vk.beta,
                vk_x,             vk.gamma,
                proof.C,          vk.delta
            ]
        );
        return ok;
    }

    // ── BN128 Precompile Wrappers ─────────────────────────────────────────────

    uint256 internal constant FIELD_MODULUS = 0x30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47;

    function _negate(G1Point memory p) internal pure returns (G1Point memory) {
        if (p.X == 0 && p.Y == 0) return G1Point(0, 0);
        return G1Point(p.X, FIELD_MODULUS - (p.Y % FIELD_MODULUS));
    }

    function _g1Add(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint256[4] memory input;
        input[0] = p1.X; input[1] = p1.Y;
        input[2] = p2.X; input[3] = p2.Y;
        bool ok;
        assembly {
            ok := staticcall(gas(), 0x06, input, 0x80, r, 0x40)
        }
        require(ok, "G1 add failed");
    }

    function _g1ScalarMul(G1Point memory p, uint256 s) internal view returns (G1Point memory r) {
        uint256[3] memory input;
        input[0] = p.X; input[1] = p.Y; input[2] = s;
        bool ok;
        assembly {
            ok := staticcall(gas(), 0x07, input, 0x60, r, 0x40)
        }
        require(ok, "G1 scalar mul failed");
    }

    /**
     * @dev BN128 pairing check on 4 pairs.
     *      Uses precompile 0x08. Returns true if product of pairings == 1.
     */
    function _bn128Pairing(
        G1Point[4][2] memory pairs
    ) internal view returns (bool) {
        // Flatten 4 pairs (each pair = G1 + G2 = 6 uint256s) into 24 uint256s
        uint256[24] memory input;
        for (uint256 i = 0; i < 4; i++) {
            input[i*6 + 0] = pairs[i][0].X;
            input[i*6 + 1] = pairs[i][0].Y;
            input[i*6 + 2] = pairs[i][1].X[0];
            input[i*6 + 3] = pairs[i][1].X[1];
            input[i*6 + 4] = pairs[i][1].Y[0];
            input[i*6 + 5] = pairs[i][1].Y[1];
        }
        uint256[1] memory out;
        bool ok;
        assembly {
            ok := staticcall(gas(), 0x08, input, 0x300, out, 0x20)
        }
        require(ok, "Pairing check failed");
        return out[0] == 1;
    }

    // Overload for the actual call site that passes a fixed array of 4 G1G2 pairs
    function _bn128Pairing(G1Point[8] memory pts_g1, G2Point[4] memory pts_g2) internal view returns (bool) {
        uint256[24] memory input;
        for (uint256 i = 0; i < 4; i++) {
            input[i*6+0] = pts_g1[i*2].X;
            input[i*6+1] = pts_g1[i*2].Y;
            input[i*6+2] = pts_g2[i].X[0];
            input[i*6+3] = pts_g2[i].X[1];
            input[i*6+4] = pts_g2[i].Y[0];
            input[i*6+5] = pts_g2[i].Y[1];
        }
        uint256[1] memory out;
        bool ok;
        assembly {
            ok := staticcall(gas(), 0x08, input, 0x300, out, 0x20)
        }
        require(ok, "Pairing failed");
        return out[0] == 1;
    }
}
