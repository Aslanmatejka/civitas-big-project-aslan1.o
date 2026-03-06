// civitasd is the CIVITAS Layer-1 blockchain daemon.
//
// Architecture: Cosmos SDK v0.47 + Tendermint BFT consensus
//
// Commands:
//
//	civitasd init <moniker>   — initialise node home directory and genesis
//	civitasd start            — run the node (P2P + consensus + RPC)
//	civitasd keys add <name>  — manage keyring
//	civitasd tx               — build and broadcast transactions
//	civitasd query            — query chain state
//	civitasd version          — print version info
//	civitasd export           — export application state to genesis JSON
//
// Environment variables:
//
//	CIVITASD_HOME  — override node home directory (default ~/.civitasd)
//	CIVITASD_LOG   — log level: debug | info | warn | error (default info)
package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/cosmos/cosmos-sdk/baseapp"
	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/client/config"
	"github.com/cosmos/cosmos-sdk/client/debug"
	"github.com/cosmos/cosmos-sdk/client/flags"
	"github.com/cosmos/cosmos-sdk/client/keys"
	"github.com/cosmos/cosmos-sdk/client/rpc"
	"github.com/cosmos/cosmos-sdk/codec"
	"github.com/cosmos/cosmos-sdk/server"
	servertypes "github.com/cosmos/cosmos-sdk/server/types"
	"github.com/cosmos/cosmos-sdk/snapshots"
	snapshottypes "github.com/cosmos/cosmos-sdk/snapshots/types"
	"github.com/cosmos/cosmos-sdk/store"
	sdk "github.com/cosmos/cosmos-sdk/types"
	authcmd "github.com/cosmos/cosmos-sdk/x/auth/client/cli"
	"github.com/cosmos/cosmos-sdk/x/auth/types"
	banktypes "github.com/cosmos/cosmos-sdk/x/bank/types"
	genutilcli "github.com/cosmos/cosmos-sdk/x/genutil/client/cli"
	"github.com/spf13/cast"
	"github.com/spf13/cobra"
	tmcfg "github.com/tendermint/tendermint/config"
	"github.com/tendermint/tendermint/libs/log"
	dbm "github.com/tendermint/tm-db"

	civapp "civitas-chain/app"
	civconfig "civitas-chain/config"
)

const (
	appName      = "civitasd"
	version      = "0.2.0"
	EnvVarHome   = "CIVITASD_HOME"
	EnvVarLog    = "CIVITASD_LOG"
	FlagLogLevel = "log-level"
	FlagHome     = flags.FlagHome
)

func main() {
	// Configure Bech32 prefix for the civitas address space.
	cfg := sdk.GetConfig()
	cfg.SetBech32PrefixForAccount("civitas", "civitaspub")
	cfg.SetBech32PrefixForValidator("civitasvaloper", "civitasvaloperpub")
	cfg.SetBech32PrefixForConsensusNode("civitasvalcons", "civitasvalconspub")
	cfg.Seal()

	rootCmd, _ := NewRootCmd()
	if err := server.InterceptConfigsPreRunHandler(rootCmd, "", nil, tmcfg.DefaultConfig()); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

// NewRootCmd creates the root command for civitasd.
func NewRootCmd() (*cobra.Command, codec.Codec) {
	appCodec, _ := civapp.MakeCodecs()

	initClientCtx := client.Context{}.
		WithCodec(appCodec).
		WithHomeDir(defaultHome()).
		WithViper("")

	rootCmd := &cobra.Command{
		Use:   appName,
		Short: "CIVITAS Blockchain Node",
		Long: `civitasd is the command-line interface and daemon for the CIVITAS
decentralized personal ecosystem Layer-1 blockchain.

Built on Cosmos SDK v0.47 with Tendermint BFT consensus.
Chain ID: ` + civconfig.Mainnet().ChainID + `
Native denom: ` + civconfig.Mainnet().NativeDenom,
		PersistentPreRunE: func(cmd *cobra.Command, _ []string) error {
			// Bind client context
			if err := client.SetCmdClientContextHandler(initClientCtx, cmd); err != nil {
				return err
			}
			// Set log level from flag
			logLevel, _ := cmd.Flags().GetString(FlagLogLevel)
			_ = logLevel
			return nil
		},
	}

	// Global flags
	rootCmd.PersistentFlags().String(FlagHome, defaultHome(), "Directory for config and data")
	rootCmd.PersistentFlags().String(FlagLogLevel, "info", "Log level (debug|info|warn|error)")

	// ── Sub-commands ───────────────────────────────────────────────────────────
	rootCmd.AddCommand(
		// Node lifecycle
		genutilcli.InitCmd(civapp.ModuleBasics, defaultHome()),
		genutilcli.CollectGenTxsCmd(banktypes.GenesisBalancesIterator{}, defaultHome()),
		genutilcli.MigrateGenesisCmd(),
		genutilcli.GenTxCmd(civapp.ModuleBasics, codec.NewProtoCodec(nil), banktypes.GenesisBalancesIterator{}, defaultHome()),
		genutilcli.ValidateGenesisCmd(civapp.ModuleBasics),
		genutilcli.AddGenesisAccountCmd(defaultHome()),
		server.NewStartCmd(newApp, appCodec),
		server.NewExportCmd(exportAppState, appCodec),

		// Key management
		keys.Commands(defaultHome()),

		// Status + network info
		rpc.StatusCommand(),

		// Auth / tx tools
		authcmd.GetBroadcastCommand(),
		authcmd.GetEncodeCommand(),
		authcmd.GetDecodeCommand(),
		authcmd.QueryTxsByEventsCmd(),
		authcmd.QueryTxCmd(),

		// Debug helpers
		debug.Cmd(),

		// CLI config
		config.Cmd(),

		// Version
		versionCmd(),
	)

	return rootCmd, appCodec
}

// newApp constructs a CIVITASApp from the server context.
// This is the factory passed to server.NewStartCmd.
func newApp(
	logger log.Logger,
	db dbm.DB,
	traceStore io.Writer,
	appOpts servertypes.AppOptions,
) servertypes.Application {
	var cache sdk.MultiStorePersistentCache
	if cast.ToBool(appOpts.Get(server.FlagInterBlockCache)) {
		cache = store.NewCommitKVStoreCacheManager()
	}

	skipUpgradeHeights := make(map[int64]bool)

	pruningOpts, err := server.GetPruningOptionsFromFlags(appOpts)
	if err != nil {
		panic(fmt.Sprintf("failed to get pruning options: %s", err))
	}

	homeDir := cast.ToString(appOpts.Get(flags.FlagHome))

	// Snapshot store setup for state sync
	var snapshotStore *snapshots.Store
	snapshotDir := filepath.Join(homeDir, "data", "snapshots")
	if err := os.MkdirAll(snapshotDir, 0755); err == nil {
		snapshotDB, err := dbm.NewDB("metadata", dbm.GoLevelDBBackend, snapshotDir)
		if err == nil {
			snapshotStore, _ = snapshots.NewStore(snapshotDB, snapshots.NewChunkFetcher())
		}
	}
	_ = snapshotStore

	return civapp.NewCIVITASApp(
		logger,
		db,
		traceStore,
		homeDir,
		baseapp.SetPruning(pruningOpts),
		baseapp.SetMinGasPrices(cast.ToString(appOpts.Get(server.FlagMinGasPrices))),
		baseapp.SetHaltHeight(cast.ToUint64(appOpts.Get(server.FlagHaltHeight))),
		baseapp.SetHaltTime(cast.ToUint64(appOpts.Get(server.FlagHaltTime))),
		baseapp.SetInterBlockCache(cache),
		baseapp.SetTrace(cast.ToBool(appOpts.Get(server.FlagTrace))),
		baseapp.SetIndexEvents(cast.ToStringSlice(appOpts.Get(server.FlagIndexEvents))),
		baseapp.SetSkipUpgradeHeights(skipUpgradeHeights),
	)
}

// exportAppState exports the application state as JSON for genesis migration or hard forks.
func exportAppState(
	logger log.Logger,
	db dbm.DB,
	traceStore io.Writer,
	height int64,
	forZeroHeight bool,
	jailAllowedAddrs []string,
	appOpts servertypes.AppOptions,
	modulesToExport []string,
) (servertypes.ExportedApp, error) {
	homeDir := cast.ToString(appOpts.Get(flags.FlagHome))
	app := civapp.NewCIVITASApp(logger, db, traceStore, homeDir)

	if height != -1 {
		if err := app.LoadHeight(height); err != nil {
			return servertypes.ExportedApp{}, fmt.Errorf("error on loading height %d: %w", height, err)
		}
	}

	exported, err := app.ExportAppStateAndValidators(forZeroHeight, jailAllowedAddrs)
	if err != nil {
		return servertypes.ExportedApp{}, fmt.Errorf("error exporting state: %w", err)
	}

	return servertypes.ExportedApp{
		AppState:        exported.AppState,
		Validators:      exported.Validators,
		Height:          exported.Height,
		ConsensusParams: exported.ConsensusParams,
	}, nil
}

// versionCmd prints version and chain info.
func versionCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Print civitasd version and chain metadata",
		Run: func(cmd *cobra.Command, _ []string) {
			info := map[string]interface{}{
				"name":        appName,
				"version":     version,
				"chain_id":    civconfig.Mainnet().ChainID,
				"denom":       civconfig.Mainnet().NativeDenom,
				"block_time":  civconfig.Mainnet().BlockTime.String(),
				"validators":  civconfig.Mainnet().MaxValidators,
				"evm_bridge":  civconfig.Mainnet().EnableEVMBridge,
				"evm_chain":   civconfig.Mainnet().EVMChainID,
			}
			enc, _ := json.MarshalIndent(info, "", "  ")
			fmt.Println(string(enc))
		},
	}
}

// defaultHome returns the default home directory for this node.
func defaultHome() string {
	if h := os.Getenv(EnvVarHome); h != "" {
		return h
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".civitasd")
}

// ModuleBasics is a package-level alias used by genutil commands.
// It is set in app.go but needs to be exported from the app package.
// For genutil usage here we reference it via the app package.
var _ = types.NewModuleAddress // ensure SDK is imported

