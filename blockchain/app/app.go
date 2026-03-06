// Package app implements the CIVITAS blockchain application.
//
// Architecture Layer 1 — Base Ledger
//
// CIVITAS uses Cosmos SDK v0.47 with Tendermint BFT consensus.
// The application manages state for all CIVITAS-specific modules:
//   - x/identity   — W3C DID on-chain anchoring
//   - x/escrow     — L1 escrow state hooks  
//   - x/noderegist — Node operator registry + uptime proofs
//   - x/reputation — Cross-chain reputation aggregation
package app

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/cosmos/cosmos-sdk/baseapp"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/module"
	"github.com/cosmos/cosmos-sdk/x/auth"
	authkeeper "github.com/cosmos/cosmos-sdk/x/auth/keeper"
	authtypes "github.com/cosmos/cosmos-sdk/x/auth/types"
	"github.com/cosmos/cosmos-sdk/x/bank"
	bankkeeper "github.com/cosmos/cosmos-sdk/x/bank/keeper"
	banktypes "github.com/cosmos/cosmos-sdk/x/bank/types"
	"github.com/cosmos/cosmos-sdk/x/gov"
	govkeeper "github.com/cosmos/cosmos-sdk/x/gov/keeper"
	govtypes "github.com/cosmos/cosmos-sdk/x/gov/types"
	"github.com/cosmos/cosmos-sdk/x/params"
	paramskeeper "github.com/cosmos/cosmos-sdk/x/params/keeper"
	paramstypes "github.com/cosmos/cosmos-sdk/x/params/types"
	"github.com/cosmos/cosmos-sdk/x/staking"
	stakingkeeper "github.com/cosmos/cosmos-sdk/x/staking/keeper"
	stakingtypes "github.com/cosmos/cosmos-sdk/x/staking/types"
	abci "github.com/tendermint/tendermint/abci/types"
	tmjson "github.com/tendermint/tendermint/libs/json"
	"github.com/tendermint/tendermint/libs/log"
	tmproto "github.com/tendermint/tendermint/proto/tendermint/types"
	dbm "github.com/tendermint/tm-db"

	cividentity  "civitas-chain/x/identity"
	idkeeper     "civitas-chain/x/identity/keeper"
	idtypes      "civitas-chain/x/identity/types"
	civescrow    "civitas-chain/x/escrow"
	escrowkeeper "civitas-chain/x/escrow/keeper"
	esctypes     "civitas-chain/x/escrow/types"
	civnode      "civitas-chain/x/noderegistry"
	nodekeeper   "civitas-chain/x/noderegistry/keeper"
	nodetypes    "civitas-chain/x/noderegistry/types"
	civrep       "civitas-chain/x/reputation"
	repkeeper    "civitas-chain/x/reputation/keeper"
	reptypes     "civitas-chain/x/reputation/types"
)

const (
	AppName      = "civitas"
	DefaultChainID = "civitas-1"
)

// Ensure CIVITASApp implements abci.Application
var _ abci.Application = (*CIVITASApp)(nil)

// CIVITASApp is the primary application type.
type CIVITASApp struct {
	*baseapp.BaseApp

	cdc     *codec.LegacyAmino
	appCodec codec.Codec

	// Keys to access the substores
	keys  map[string]*sdk.KVStoreKey
	tkeys map[string]*sdk.TransientStoreKey

	// Cosmos SDK keepers
	ParamsKeeper  paramskeeper.Keeper
	AccountKeeper authkeeper.AccountKeeper
	BankKeeper    bankkeeper.Keeper
	StakingKeeper stakingkeeper.Keeper
	GovKeeper     govkeeper.Keeper

	// CIVITAS-specific keepers
	IdentityKeeper  idkeeper.Keeper
	EscrowKeeper    escrowkeeper.Keeper
	NodeKeeper      nodekeeper.Keeper
	ReputationKeeper repkeeper.Keeper

	// Module manager handles BeginBlock / EndBlock / InitChainer ordering
	mm *module.Manager

	// Genesis export
	configurator module.Configurator
}

// NewCIVITASApp constructs and returns a new CIVITASApp instance.
func NewCIVITASApp(
	logger log.Logger,
	db dbm.DB,
	traceStore io.Writer,
	homePath string,
	baseAppOptions ...func(*baseapp.BaseApp),
) *CIVITASApp {

	appCodec, cdc := MakeCodecs()
	bApp := baseapp.NewBaseApp(AppName, logger, db, baseAppOptions...)
	bApp.SetCommitMultiStoreTracer(traceStore)

	// Store keys
	keys := sdk.NewKVStoreKeys(
		// SDK modules
		authtypes.StoreKey,
		banktypes.StoreKey,
		stakingtypes.StoreKey,
		govtypes.StoreKey,
		paramstypes.StoreKey,
		// CIVITAS modules
		idtypes.StoreKey,
		esctypes.StoreKey,
		nodetypes.StoreKey,
		reptypes.StoreKey,
	)
	tkeys := sdk.NewTransientStoreKeys(paramstypes.TStoreKey)

	app := &CIVITASApp{
		BaseApp:  bApp,
		cdc:      cdc,
		appCodec: appCodec,
		keys:     keys,
		tkeys:    tkeys,
	}

	// ── Params ─────────────────────────────────────────────────────────────────
	app.ParamsKeeper = paramskeeper.NewKeeper(
		appCodec, cdc, keys[paramstypes.StoreKey], tkeys[paramstypes.TStoreKey],
	)

	// ── Auth ───────────────────────────────────────────────────────────────────
	app.AccountKeeper = authkeeper.NewAccountKeeper(
		appCodec, keys[authtypes.StoreKey],
		app.ParamsKeeper.Subspace(authtypes.ModuleName),
		authtypes.ProtoBaseAccount,
		maccPerms(),
	)

	// ── Bank ───────────────────────────────────────────────────────────────────
	app.BankKeeper = bankkeeper.NewBaseKeeper(
		appCodec, keys[banktypes.StoreKey],
		app.AccountKeeper,
		app.ParamsKeeper.Subspace(banktypes.ModuleName),
		blockedAddrs(),
	)

	// ── Staking ────────────────────────────────────────────────────────────────
	stakingKeeper := stakingkeeper.NewKeeper(
		appCodec, keys[stakingtypes.StoreKey],
		app.AccountKeeper, app.BankKeeper,
		app.ParamsKeeper.Subspace(stakingtypes.ModuleName),
	)
	app.StakingKeeper = *stakingKeeper

	// ── Governance ─────────────────────────────────────────────────────────────
	app.GovKeeper = govkeeper.NewKeeper(
		appCodec, keys[govtypes.StoreKey],
		app.ParamsKeeper.Subspace(govtypes.ModuleName),
		app.AccountKeeper, app.BankKeeper,
		&app.StakingKeeper,
		govtypes.DefaultConfig(),
		govtypes.NewMsgServerImpl(govkeeper.NewKeeper(appCodec, keys[govtypes.StoreKey], app.ParamsKeeper.Subspace(govtypes.ModuleName), app.AccountKeeper, app.BankKeeper, &app.StakingKeeper, govtypes.DefaultConfig(), govtypes.NewMsgServerImpl)),
	)

	// ── CIVITAS: Identity ──────────────────────────────────────────────────────
	app.IdentityKeeper = idkeeper.NewKeeper(
		appCodec,
		keys[idtypes.StoreKey],
		app.ParamsKeeper.Subspace(idtypes.ModuleName),
	)

	// ── CIVITAS: Escrow ────────────────────────────────────────────────────────
	app.EscrowKeeper = escrowkeeper.NewKeeper(
		appCodec,
		keys[esctypes.StoreKey],
		app.ParamsKeeper.Subspace(esctypes.ModuleName),
		app.BankKeeper,
	)

	// ── CIVITAS: NodeRegistry ─────────────────────────────────────────────────
	app.NodeKeeper = nodekeeper.NewKeeper(
		appCodec,
		keys[nodetypes.StoreKey],
		app.ParamsKeeper.Subspace(nodetypes.ModuleName),
		app.BankKeeper,
	)

	// ── CIVITAS: Reputation ───────────────────────────────────────────────────
	app.ReputationKeeper = repkeeper.NewKeeper(
		appCodec,
		keys[reptypes.StoreKey],
		app.ParamsKeeper.Subspace(reptypes.ModuleName),
		app.IdentityKeeper,
	)

	// ── Module Manager ────────────────────────────────────────────────────────
	app.mm = module.NewManager(
		auth.NewAppModule(appCodec, app.AccountKeeper, nil),
		bank.NewAppModule(appCodec, app.BankKeeper, app.AccountKeeper),
		staking.NewAppModule(appCodec, app.StakingKeeper, app.AccountKeeper, app.BankKeeper),
		gov.NewAppModule(appCodec, app.GovKeeper, app.AccountKeeper, app.BankKeeper),
		params.NewAppModule(app.ParamsKeeper),
		// CIVITAS modules
		cividentity.NewAppModule(appCodec, app.IdentityKeeper),
		civescrow.NewAppModule(appCodec, app.EscrowKeeper),
		civnode.NewAppModule(appCodec, app.NodeKeeper),
		civrep.NewAppModule(appCodec, app.ReputationKeeper),
	)

	// Set order for Begin/EndBlock
	app.mm.SetOrderBeginBlockers(
		stakingtypes.ModuleName,
		nodetypes.ModuleName, // epoch uptime processing
		reptypes.ModuleName,  // sync reputation scores
	)
	app.mm.SetOrderEndBlockers(
		govtypes.ModuleName,
		stakingtypes.ModuleName,
		esctypes.ModuleName,  // auto-release expired escrows
		nodetypes.ModuleName,
	)
	app.mm.SetOrderInitGenesis(
		authtypes.ModuleName,
		banktypes.ModuleName,
		stakingtypes.ModuleName,
		govtypes.ModuleName,
		paramstypes.ModuleName,
		idtypes.ModuleName,
		esctypes.ModuleName,
		nodetypes.ModuleName,
		reptypes.ModuleName,
	)

	app.configurator = module.NewConfigurator(appCodec, app.MsgServiceRouter(), app.GRPCQueryRouter())
	app.mm.RegisterServices(app.configurator)

	// Mount stores and set handlers
	app.MountKVStores(keys)
	app.MountTransientStores(tkeys)
	app.SetInitChainer(app.InitChainer)
	app.SetBeginBlocker(app.mm.BeginBlock)
	app.SetEndBlocker(app.mm.EndBlock)

	if err := app.LoadLatestVersion(); err != nil {
		logger.Error("failed to load latest version", "err", err)
		os.Exit(1)
	}

	return app
}

// InitChainer loads the genesis state.
func (app *CIVITASApp) InitChainer(ctx sdk.Context, req abci.RequestInitChain) abci.ResponseInitChain {
	var genesisState GenesisState
	if err := tmjson.Unmarshal(req.AppStateBytes, &genesisState); err != nil {
		panic(fmt.Sprintf("failed to unmarshal genesis state: %s", err))
	}
	return app.mm.InitGenesis(ctx, app.appCodec, genesisState)
}

// ExportAppStateAndValidators exports the app state for a genesis export.
func (app *CIVITASApp) ExportAppStateAndValidators(
	forZeroHeight bool,
	jailAllowedAddrs []string,
) (sdk.ExportedApp, error) {
	ctx := app.NewContext(true, tmproto.Header{Height: app.LastBlockHeight()})
	genesis := app.mm.ExportGenesis(ctx, app.appCodec)
	appState, err := json.MarshalIndent(genesis, "", "  ")
	if err != nil {
		return sdk.ExportedApp{}, err
	}
	validators, err := staking.WriteValidators(ctx, app.StakingKeeper)
	return sdk.ExportedApp{
		AppState:        appState,
		Validators:      validators,
		Height:          app.LastBlockHeight(),
		ConsensusParams: app.BaseApp.GetConsensusParams(ctx),
	}, err
}

// GenesisState is the root genesis type.
type GenesisState map[string]json.RawMessage

// DefaultGenesis returns the default genesis state for all modules.
func (app *CIVITASApp) DefaultGenesis() GenesisState {
	return app.mm.DefaultGenesis(app.appCodec)
}

// HomePath returns the configured home directory.
func HomePath() string {
	if h := os.Getenv("CIVITASD_HOME"); h != "" {
		return h
	}
	homeDir, _ := os.UserHomeDir()
	return filepath.Join(homeDir, ".civitasd")
}

// maccPerms returns the module account permissions.
func maccPerms() map[string][]string {
	return map[string][]string{
		authtypes.FeeCollectorName:     nil,
		stakingtypes.BondedPoolName:    {authtypes.Burner, authtypes.Staking},
		stakingtypes.NotBondedPoolName: {authtypes.Burner, authtypes.Staking},
		govtypes.ModuleName:            {authtypes.Burner},
		nodetypes.ModuleName:           {authtypes.Minter},
		esctypes.ModuleName:            {authtypes.Burner},
	}
}

// blockedAddrs returns addresses that are never allowed to receive funds.
func blockedAddrs() map[string]bool {
	modAccAddrs := make(map[string]bool)
	for acc := range maccPerms() {
		modAccAddrs[authtypes.NewModuleAddress(acc).String()] = true
	}
	return modAccAddrs
}

// MakeCodecs creates the codec pair used by CIVITAS.
func MakeCodecs() (codec.Codec, *codec.LegacyAmino) {
	amino := codec.NewLegacyAmino()
	interfaceRegistry := codectypes.NewInterfaceRegistry()
	appCodec := codec.NewProtoCodec(interfaceRegistry)
	return appCodec, amino
}
