// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CIVToken
 * @dev CIVITAS utility token (CIV) for governance, fees, staking, and ecosystem access
 * 
 * Tokenomics:
 * - Fixed supply: 1,000,000,000 CIV
 * - 20% initial release
 * - 30% treasury
 * - 20% node incentives
 * - 10% team (vested)
 * - 20% community airdrops
 * 
 * Features:
 * - Burnable for deflationary pressure
 * - Role-based minting control
 * - Anti-whale mechanisms via transfer limits (to be implemented)
 */
contract CIVToken is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant INITIAL_RELEASE = 200_000_000 * 10**18; // 20%
    uint256 public constant TREASURY_ALLOCATION = 300_000_000 * 10**18; // 30%
    uint256 public constant NODE_ALLOCATION = 200_000_000 * 10**18; // 20%
    uint256 public constant TEAM_ALLOCATION = 100_000_000 * 10**18; // 10%
    uint256 public constant COMMUNITY_ALLOCATION = 200_000_000 * 10**18; // 20%
    
    address public treasuryAddress;
    address public nodeRewardsAddress;
    address public teamVestingAddress;
    address public communityAddress;
    
    event TreasuryAddressUpdated(address indexed newAddress);
    event NodeRewardsAddressUpdated(address indexed newAddress);
    
    constructor(
        address _treasuryAddress,
        address _nodeRewardsAddress,
        address _teamVestingAddress,
        address _communityAddress
    ) ERC20("CIVITAS", "CIV") {
        require(_treasuryAddress != address(0), "Invalid treasury address");
        require(_nodeRewardsAddress != address(0), "Invalid node rewards address");
        require(_teamVestingAddress != address(0), "Invalid team vesting address");
        require(_communityAddress != address(0), "Invalid community address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(TREASURY_ROLE, _treasuryAddress);
        
        treasuryAddress = _treasuryAddress;
        nodeRewardsAddress = _nodeRewardsAddress;
        teamVestingAddress = _teamVestingAddress;
        communityAddress = _communityAddress;
        
        // Initial distribution
        _mint(msg.sender, INITIAL_RELEASE);
        _mint(_treasuryAddress, TREASURY_ALLOCATION);
        _mint(_nodeRewardsAddress, NODE_ALLOCATION);
        _mint(_teamVestingAddress, TEAM_ALLOCATION);
        _mint(_communityAddress, COMMUNITY_ALLOCATION);
    }
    
    /**
     * @dev Mint new tokens (only for authorized addresses, respecting MAX_SUPPLY)
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    /**
     * @dev Update treasury address
     */
    function updateTreasuryAddress(address newAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newAddress != address(0), "Invalid address");
        treasuryAddress = newAddress;
        emit TreasuryAddressUpdated(newAddress);
    }
    
    /**
     * @dev Update node rewards address
     */
    function updateNodeRewardsAddress(address newAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newAddress != address(0), "Invalid address");
        nodeRewardsAddress = newAddress;
        emit NodeRewardsAddressUpdated(newAddress);
    }
    
    /**
     * @dev Returns the decimals places of the token
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
