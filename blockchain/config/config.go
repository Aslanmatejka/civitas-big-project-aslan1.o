// Package config holds the CIVITAS chain network configuration.
package config

import "time"

// NetworkConfig holds all chain-level configuration parameters.
type NetworkConfig struct {
	// ChainID is the Tendermint chain identifier.
	ChainID string

	// NativeDenom is the base staking denomination.
	NativeDenom string

	// BridgeDenom is the EVM-side CIV ERC-20 wrapped denom (ICS-20).
	BridgeDenom string

	// BlockTime target.
	BlockTime time.Duration

	// MaxValidators is the maximum number of active validators.
	MaxValidators int

	// UnbondingTime is the staking unbonding period.
	UnbondingTime time.Duration

	// MinGovDeposit is the minimum governance deposit in uciv.
	MinGovDeposit int64

	// VotingPeriod is the length of governance voting period.
	VotingPeriod time.Duration

	// EnableEVMBridge enables the IBC bridge to the EVM layer.
	EnableEVMBridge bool

	// EVMChainID is the target EVM network chain ID.
	EVMChainID int64

	// RPCListenAddr is the default Tendermint RPC listen address.
	RPCListenAddr string

	// GRPCListenAddr is the default gRPC listen address for SDK queries.
	GRPCListenAddr string

	// P2PListenAddr is the default P2P listen address.
	P2PListenAddr string

	// APIListenAddr is the default REST API listen address.
	APIListenAddr string
}

// Mainnet returns the CIVITAS mainnet configuration.
func Mainnet() NetworkConfig {
	return NetworkConfig{
		ChainID:         "civitas-1",
		NativeDenom:     "uciv",
		BridgeDenom:     "ibc/CIV",
		BlockTime:       5 * time.Second,
		MaxValidators:   100,
		UnbondingTime:   21 * 24 * time.Hour,
		MinGovDeposit:   10_000_000_000, // 10,000 CIV in uciv
		VotingPeriod:    7 * 24 * time.Hour,
		EnableEVMBridge: true,
		EVMChainID:      31337, // Hardhat — update to mainnet chain ID on launch
		RPCListenAddr:   "tcp://0.0.0.0:26657",
		GRPCListenAddr:  "0.0.0.0:9090",
		P2PListenAddr:   "tcp://0.0.0.0:26656",
		APIListenAddr:   "tcp://0.0.0.0:1317",
	}
}

// Testnet returns the CIVITAS testnet configuration.
func Testnet() NetworkConfig {
	cfg := Mainnet()
	cfg.ChainID = "civitas-testnet-1"
	cfg.MaxValidators = 20
	cfg.UnbondingTime = 3 * 24 * time.Hour
	cfg.VotingPeriod = 1 * 24 * time.Hour
	cfg.MinGovDeposit = 1_000_000_000 // 1,000 CIV
	return cfg
}

// Local returns the CIVITAS local development configuration.
func Local() NetworkConfig {
	cfg := Testnet()
	cfg.ChainID = "civitas-local"
	cfg.MaxValidators = 4
	cfg.UnbondingTime = 1 * time.Hour
	cfg.VotingPeriod = 30 * time.Minute
	cfg.MinGovDeposit = 100_000_000 // 100 CIV
	cfg.BlockTime = 1 * time.Second
	return cfg
}

// NodeDefaultPorts documents the default port assignments.
// These are the Tendermint / Cosmos SDK standard port layout.
var NodeDefaultPorts = map[string]string{
	"p2p":   "26656",
	"rpc":   "26657",
	"grpc":  "9090",
	"api":   "1317",
	"pprof": "6060",
}

// GenesisValidators defines the initial validator set for a "civitas-local" devnet.
// In production this is replaced by the validator ceremony / gentx process.
var LocalGenesisValidators = []GenesisValidator{
	{
		Moniker: "civitas-node-0",
		Power:   1_000_000, // 1M uciv as voting power
	},
}

// GenesisValidator is a placeholder entry for a genesis validator node.
type GenesisValidator struct {
	Moniker string
	Power   int64
}
