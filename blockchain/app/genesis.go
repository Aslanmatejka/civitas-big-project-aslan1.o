package app

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
	authtypes "github.com/cosmos/cosmos-sdk/x/auth/types"
	banktypes "github.com/cosmos/cosmos-sdk/x/bank/types"
	govtypes "github.com/cosmos/cosmos-sdk/x/gov/types"
	stakingtypes "github.com/cosmos/cosmos-sdk/x/staking/types"
)

// ChainID is the Tendermint chain identifier.
const ChainID = "civitas-1"

// NativeDenom is the base coin denomination on the CIVITAS chain.
// On the EVM layer, CIV is an ERC-20. On L1, uciv is the staking denom.
const NativeDenom = "uciv"

// NewDefaultGenesisState constructs a complete, ready-to-use genesis state
// for a fresh CIVITAS testnet or mainnet.
func NewDefaultGenesisState(app *CIVITASApp) GenesisState {
	gs := app.DefaultGenesis()

	// ── Auth ───────────────────────────────────────────────────────────────────
	authGenesis := authtypes.DefaultGenesisState()
	authGenesis.Params.MaxMemoCharacters = 512
	authGenesis.Params.TxSigLimit = 7
	authGenesis.Params.TxSizeCostPerByte = 10
	authGenesis.Params.SigVerifyCostED25519 = 590
	authGenesis.Params.SigVerifyCostSecp256k1 = 1000
	gs[authtypes.ModuleName] = app.appCodec.MustMarshalJSON(&authGenesis)

	// ── Bank ───────────────────────────────────────────────────────────────────
	bankGenesis := banktypes.DefaultGenesisState()
	bankGenesis.Params.DefaultSendEnabled = true
	bankGenesis.DenomMetadata = []banktypes.Metadata{
		{
			Description: "The native staking token of the CIVITAS protocol.",
			DenomUnits: []banktypes.DenomUnit{
				{Denom: "uciv", Exponent: 0, Aliases: []string{"microciv"}},
				{Denom: "mciv", Exponent: 3, Aliases: []string{"milliciv"}},
				{Denom: "civ", Exponent: 6, Aliases: nil},
			},
			Base:    "uciv",
			Display: "civ",
			Name:    "CIVITAS",
			Symbol:  "CIV",
		},
	}

	// Initial supply: 1 billion CIV — mirrors ERC-20 counterpart on EVM Layer.
	// 400M to community pool (governance), 300M to foundation multi-sig,
	// 200M to node operator rewards escrow, 100M reserved for bridge.
	// Denominated in uciv (1 CIV = 1_000_000 uciv).
	communityAddr    := "civitas1community0000000000000000000000000000000"
	foundationAddr   := "civitas1foundation00000000000000000000000000000"
	nodeRewardsAddr  := authtypes.NewModuleAddress("noderegistry").String()
	bridgeReserveAddr := "civitas1bridgereserve000000000000000000000000000"

	bankGenesis.Balances = []banktypes.Balance{
		{Address: communityAddr,     Coins: sdk.NewCoins(sdk.NewInt64Coin("uciv", 400_000_000_000_000))},
		{Address: foundationAddr,    Coins: sdk.NewCoins(sdk.NewInt64Coin("uciv", 300_000_000_000_000))},
		{Address: nodeRewardsAddr,   Coins: sdk.NewCoins(sdk.NewInt64Coin("uciv", 200_000_000_000_000))},
		{Address: bridgeReserveAddr, Coins: sdk.NewCoins(sdk.NewInt64Coin("uciv", 100_000_000_000_000))},
	}
	bankGenesis.Supply = sdk.NewCoins(sdk.NewInt64Coin("uciv", 1_000_000_000_000_000))
	gs[banktypes.ModuleName] = app.appCodec.MustMarshalJSON(&bankGenesis)

	// ── Staking ────────────────────────────────────────────────────────────────
	stakingGenesis := stakingtypes.DefaultGenesisState()
	stakingGenesis.Params.BondDenom = "uciv"
	stakingGenesis.Params.MaxValidators = 100
	stakingGenesis.Params.MaxEntries = 7
	stakingGenesis.Params.HistoricalEntries = 10_000
	stakingGenesis.Params.UnbondingTime = 21 * 24 * 3600 * 1e9 // 21 days in nanoseconds
	gs[stakingtypes.ModuleName] = app.appCodec.MustMarshalJSON(&stakingGenesis)

	// ── Governance ─────────────────────────────────────────────────────────────
	govGenesis := govtypes.DefaultGenesisState()
	// Deposit: minimum 10,000 CIV
	govGenesis.DepositParams.MinDeposit = sdk.NewCoins(sdk.NewInt64Coin("uciv", 10_000_000_000))
	govGenesis.DepositParams.MaxDepositPeriod = 14 * 24 * 3600 * 1e9 // 14 days
	// Voting: 7-day voting period
	govGenesis.VotingParams.VotingPeriod = 7 * 24 * 3600 * 1e9
	// Tally: 33.4% quorum, 50% threshold, 33.4% veto
	govGenesis.TallyParams.Quorum = sdk.NewDecWithPrec(334, 3)
	govGenesis.TallyParams.Threshold = sdk.NewDecWithPrec(5, 1)
	govGenesis.TallyParams.VetoThreshold = sdk.NewDecWithPrec(334, 3)
	gs[govtypes.ModuleName] = app.appCodec.MustMarshalJSON(&govGenesis)

	return gs
}
