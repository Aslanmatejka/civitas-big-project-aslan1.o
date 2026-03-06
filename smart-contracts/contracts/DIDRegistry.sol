// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DIDRegistry
 * @dev Decentralized Identifier (DID) Registry for CIVITAS
 * 
 * Manages self-sovereign identities on-chain
 * Compliant with W3C DID specification
 * 
 * Features:
 * - DID creation and management
 * - Public key registration
 * - Service endpoint management
 * - Credential schema registration
 * - Reputation tracking
 */
contract DIDRegistry is Ownable, ReentrancyGuard {
    
    struct DIDDocument {
        address controller;
        string didDocument; // IPFS hash or inline JSON
        string profileCID; // IPFS CID for user profile data
        uint256 createdAt;
        uint256 updatedAt;
        bool active;
        uint256 reputation; // Reputation score (0-1000)
    }
    
    struct Credential {
        bytes32 credentialHash;
        address issuer;
        uint256 issuedAt;
        uint256 expiresAt;
        bool revoked;
    }
    
    // Mapping from DID identifier to DID Document
    mapping(bytes32 => DIDDocument) public dids;
    
    // Mapping from DID to array of credentials
    mapping(bytes32 => Credential[]) public credentials;
    
    // Reputation thresholds
    uint256 public constant MIN_REPUTATION = 0;
    uint256 public constant MAX_REPUTATION = 1000;
    uint256 public constant INITIAL_REPUTATION = 500;
    
    // Events
    event DIDCreated(bytes32 indexed didIdentifier, address indexed controller);
    event DIDUpdated(bytes32 indexed didIdentifier, string didDocument);
    event DIDDeactivated(bytes32 indexed didIdentifier);
    event ProfileUpdated(bytes32 indexed didIdentifier, string profileCID);
    event CredentialIssued(bytes32 indexed didIdentifier, bytes32 indexed credentialHash, address indexed issuer);
    event CredentialRevoked(bytes32 indexed didIdentifier, bytes32 indexed credentialHash);
    event ReputationUpdated(bytes32 indexed didIdentifier, uint256 newReputation);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new DID
     * @param didIdentifier Unique identifier for the DID (hash of DID string)
     * @param didDocument DID Document (IPFS hash or JSON string)
     */
    function createDID(
        bytes32 didIdentifier,
        string memory didDocument
    ) external nonReentrant {
        require(dids[didIdentifier].controller == address(0), "DID already exists");
        require(bytes(didDocument).length > 0, "DID document cannot be empty");
        
        dids[didIdentifier] = DIDDocument({
            controller: msg.sender,
            profileCID: "", // Profile can be set later
            didDocument: didDocument,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            active: true,
            reputation: INITIAL_REPUTATION
        });

        // Index address → DID for cross-contract lookups (hasDID, getDIDByAddress)
        addressToDID[msg.sender] = didIdentifier;
        
        emit DIDCreated(didIdentifier, msg.sender);
    }
    
    /**
     * @dev Update an existing DID document
     * @param didIdentifier The DID to update
     * @param didDocument New DID Document
     */
    function updateDID(
        bytes32 didIdentifier,
        string memory didDocument
    ) external {
        require(dids[didIdentifier].controller == msg.sender, "Not authorized");
        require(dids[didIdentifier].active, "DID is deactivated");
        require(bytes(didDocument).length > 0, "DID document cannot be empty");
        
        dids[didIdentifier].didDocument = didDocument;
        dids[didIdentifier].updatedAt = block.timestamp;
        
        emit DIDUpdated(didIdentifier, didDocument);
    }
    
    /**Update profile CID on IPFS
     * @param didIdentifier The DID
     * @param profileCID IPFS CID of the profile data
     */
    function updateProfile(
        bytes32 didIdentifier,
        string memory profileCID
    ) external {
        require(dids[didIdentifier].controller == msg.sender, "Not authorized");
        require(dids[didIdentifier].active, "DID is deactivated");
        require(bytes(profileCID).length > 0, "Profile CID cannot be empty");
        
        dids[didIdentifier].profileCID = profileCID;
        dids[didIdentifier].updatedAt = block.timestamp;
        
        emit ProfileUpdated(didIdentifier, profileCID);
    }
    
    /**
     * @dev 
     * @dev Deactivate a DID
     * @param didIdentifier The DID to deactivate
     */
    function deactivateDID(bytes32 didIdentifier) external {
        require(dids[didIdentifier].controller == msg.sender, "Not authorized");
        require(dids[didIdentifier].active, "DID already deactivated");
        
        dids[didIdentifier].active = false;
        dids[didIdentifier].updatedAt = block.timestamp;
        
        emit DIDDeactivated(didIdentifier);
    }
    
    /**
     * @dev Issue a verifiable credential to a DID
     * @param didIdentifier The recipient DID
     * @param credentialHash Hash of the credential (stored off-chain)
     * @param expiresAt Expiration timestamp
     */
    function issueCredential(
        bytes32 didIdentifier,
        bytes32 credentialHash,
        uint256 expiresAt
    ) external nonReentrant {
        require(dids[didIdentifier].active, "DID is not active");
        require(expiresAt > block.timestamp, "Expiration must be in future");
        
        credentials[didIdentifier].push(Credential({
            credentialHash: credentialHash,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            revoked: false
        }));
        
        emit CredentialIssued(didIdentifier, credentialHash, msg.sender);
    }
    
    /**
     * @dev Revoke a credential
     * @param didIdentifier The DID
     * @param credentialIndex Index of the credential in the array
     */
    function revokeCredential(
        bytes32 didIdentifier,
        uint256 credentialIndex
    ) external {
        require(credentialIndex < credentials[didIdentifier].length, "Invalid index");
        Credential storage credential = credentials[didIdentifier][credentialIndex];
        require(credential.issuer == msg.sender, "Not authorized");
        require(!credential.revoked, "Already revoked");
        
        credential.revoked = true;
        
        emit CredentialRevoked(didIdentifier, credential.credentialHash);
    }
    
    /**
     * @dev Update reputation score (only owner for now, will be governed by DAO)
     * @param didIdentifier The DID
     * @param newReputation New reputation score (0-1000)
     */
    function updateReputation(
        bytes32 didIdentifier,
        uint256 newReputation
    ) external onlyOwner {
        require(dids[didIdentifier].active, "DID is not active");
        require(newReputation >= MIN_REPUTATION && newReputation <= MAX_REPUTATION, "Invalid reputation");
        
        dids[didIdentifier].reputation = newReputation;
        
        emit ReputationUpdated(didIdentifier, newReputation);
    }
    
    /**
     * @dev Get DID document
     * @param didIdentifier The DID
     */
    function getDID(bytes32 didIdentifier) external view returns (DIDDocument memory) {
        return dids[didIdentifier];
    }
    
    /**
     * @dev Get all credentials for a DID
     * @param didIdentifier The DID
     */
    function getCredentials(bytes32 didIdentifier) external view returns (Credential[] memory) {
        return credentials[didIdentifier];
    }
    
    /**
     * @dev Verify if a DID is active and has minimum reputation
     * @param didIdentifier The DID
     * @param minReputation Minimum required reputation
     */
    function verifyDID(
        bytes32 didIdentifier,
        uint256 minReputation
    ) external view returns (bool) {
        DIDDocument memory did = dids[didIdentifier];
        return did.active && did.reputation >= minReputation;
    }

    // ── Address-based DID helpers (for cross-contract compatibility) ───────────

    /// @dev Mapping from controller address to their DID identifier
    mapping(address => bytes32) public addressToDID;

    /**
     * @dev Check whether an address has registered an active DID.
     *      Used by AirdropDistributor and other contracts that gate on identity.
     * @param account The wallet address to check
     */
    function hasDID(address account) external view returns (bool) {
        bytes32 didId = addressToDID[account];
        if (didId == bytes32(0)) return false;
        return dids[didId].active && dids[didId].controller == account;
    }

    /**
     * @dev Get the DID identifier for a given address.
     * @param account The wallet address
     */
    function getDIDByAddress(address account) external view returns (bytes32) {
        return addressToDID[account];
    }
}
