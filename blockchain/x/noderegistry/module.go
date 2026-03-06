// Package noderegistry implements the CIVITAS node operator registry module.
//
// Responsibilities:
//   - Track registered storage/compute nodes
//   - Record uptime oracle reports
//   - Calculate and distribute epoch rewards to nodes
//   - Slash misbehaving or offline nodes
package noderegistry

import (
	"encoding/json"
	"fmt"

	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/module"
	abci "github.com/tendermint/tendermint/abci/types"

	"civitas-chain/x/noderegistry/keeper"
	"civitas-chain/x/noderegistry/types"
)

var (
	_ module.AppModule      = AppModule{}
	_ module.AppModuleBasic = AppModuleBasic{}
)

// AppModuleBasic is the module's basic type.
type AppModuleBasic struct{}

func (AppModuleBasic) Name() string { return types.ModuleName }
func (AppModuleBasic) DefaultGenesis(cdc codec.JSONCodec) json.RawMessage {
	return json.RawMessage(`{}`)
}
func (AppModuleBasic) ValidateGenesis(_ codec.JSONCodec, _ client.TxEncodingConfig, _ json.RawMessage) error {
	return nil
}
func (AppModuleBasic) RegisterCodec(_ *codec.LegacyAmino)                 {}
func (AppModuleBasic) RegisterRESTRoutes(_ client.Context, _ *mux.Router) {}
func (AppModuleBasic) RegisterGRPCGatewayRoutes(_ client.Context, _ *runtime.ServeMux) {}
func (AppModuleBasic) GetTxCmd() *cobra.Command    { return nil }
func (AppModuleBasic) GetQueryCmd() *cobra.Command { return nil }

// AppModule implements module.AppModule.
type AppModule struct {
	AppModuleBasic
	keeper keeper.Keeper
	cdc    codec.Codec
}

// NewAppModule returns a new noderegistry AppModule.
func NewAppModule(cdc codec.Codec, k keeper.Keeper) AppModule {
	return AppModule{cdc: cdc, keeper: k}
}

func (AppModule) Name() string                    { return types.ModuleName }
func (AppModule) RegisterInvariants(_ sdk.InvariantRegistry) {}
func (AppModule) Route() sdk.Route                { return sdk.Route{} }
func (AppModule) QuerierRoute() string            { return types.RouterKey }
func (AppModule) LegacyQuerierHandler(_ *codec.LegacyAmino) sdk.Querier { return nil }
func (AppModule) ConsensusVersion() uint64       { return 1 }
func (AppModule) RegisterServices(_ module.Configurator) {}

func (AppModule) InitGenesis(_ sdk.Context, _ codec.JSONCodec, _ json.RawMessage) []abci.ValidatorUpdate {
	return []abci.ValidatorUpdate{}
}
func (AppModule) ExportGenesis(_ sdk.Context, cdc codec.JSONCodec) json.RawMessage {
	return json.RawMessage(`{}`)
}

// BeginBlock runs epoch uptime processing.
func (am AppModule) BeginBlock(ctx sdk.Context, _ abci.RequestBeginBlock) {
	// Every block, iterate active nodes and check if we need epoch processing
	blockHeight := ctx.BlockHeight()
	blocksPerEpoch := int64(17280) // ~24h at 5s block time

	if blockHeight%blocksPerEpoch != 0 || blockHeight == 0 {
		return
	}

	// Distribute epoch rewards to all active nodes
	am.keeper.IterateActiveNodes(ctx, func(node keeper.NodeRecord) bool {
		reward := am.keeper.CalculateEpochReward(node)
		if reward <= 0 {
			return false
		}
		operatorAddr, err := sdk.AccAddressFromBech32(node.Operator)
		if err != nil {
			return false
		}
		rewardCoin := sdk.NewInt64Coin("uciv", reward)
		modAddr := sdk.AccAddress([]byte("noderegistry"))
		// Transfer from module account to operator
		if err := am.keeper.BankKeeper().SendCoins(ctx, modAddr, operatorAddr, sdk.NewCoins(rewardCoin)); err != nil {
			// Log but don't halt — module may be underfunded
			ctx.Logger().Error("failed to send node reward", "node", node.Operator, "err", err)
		}
		return false
	})
}

func (AppModule) EndBlock(_ sdk.Context, _ abci.RequestEndBlock) []abci.ValidatorUpdate {
	return []abci.ValidatorUpdate{}
}

// BankKeeper exposes keeper.BankKeeper for module-level use.
func (k keeper.Keeper) BankKeeper() bankkeeper.Keeper {
	return k.bankKeeper
}

func init() {
	_ = fmt.Sprintf // prevent unused import
}
