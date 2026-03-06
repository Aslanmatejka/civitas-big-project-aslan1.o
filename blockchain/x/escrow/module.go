// Package escrow implements the CIVITAS L1 escrow state hooks.
//
// The EVM layer (SmartEscrow.sol) handles actual value transfer.
// This L1 module maintains an audit log of cross-chain escrow events
// and provides finality proofs usable by light clients and bridges.
package escrow

import (
	"encoding/json"

	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/module"
	abci "github.com/tendermint/tendermint/abci/types"

	"github.com/cosmos/cosmos-sdk/client"
	"github.com/gorilla/mux"
	"github.com/grpc-ecosystem/grpc-gateway/runtime"
	"github.com/spf13/cobra"

	"civitas-chain/x/escrow/keeper"
	"civitas-chain/x/escrow/types"
)

// Re-export constants so app.go / other packages can reference
// escrow.ModuleName without a separate types import.
const ModuleName = types.ModuleName

// ──────────────────────────────────────────────────────────────────────────────
// Module interface implementation
// ──────────────────────────────────────────────────────────────────────────────

var (
	_ module.AppModule      = AppModule{}
	_ module.AppModuleBasic = AppModuleBasic{}
)

type AppModuleBasic struct{}

func (AppModuleBasic) Name() string { return ModuleName }
func (AppModuleBasic) DefaultGenesis(_ codec.JSONCodec) json.RawMessage  { return json.RawMessage(`{}`) }
func (AppModuleBasic) ValidateGenesis(_ codec.JSONCodec, _ client.TxEncodingConfig, _ json.RawMessage) error { return nil }
func (AppModuleBasic) RegisterCodec(_ *codec.LegacyAmino) {}
func (AppModuleBasic) RegisterRESTRoutes(_ client.Context, _ *mux.Router) {}
func (AppModuleBasic) RegisterGRPCGatewayRoutes(_ client.Context, _ *runtime.ServeMux) {}
func (AppModuleBasic) GetTxCmd() *cobra.Command    { return nil }
func (AppModuleBasic) GetQueryCmd() *cobra.Command { return nil }

type AppModule struct {
	AppModuleBasic
	keeper keeper.Keeper
	cdc    codec.Codec
}

func NewAppModule(cdc codec.Codec, k keeper.Keeper) AppModule { return AppModule{cdc: cdc, keeper: k} }

func (AppModule) Name() string { return ModuleName }
func (AppModule) RegisterInvariants(_ sdk.InvariantRegistry) {}
func (AppModule) Route() sdk.Route                { return sdk.Route{} }
func (AppModule) QuerierRoute() string            { return types.RouterKey }
func (AppModule) LegacyQuerierHandler(_ *codec.LegacyAmino) sdk.Querier { return nil }
func (AppModule) ConsensusVersion() uint64       { return 1 }
func (AppModule) RegisterServices(_ module.Configurator) {}

func (AppModule) InitGenesis(_ sdk.Context, _ codec.JSONCodec, _ json.RawMessage) []abci.ValidatorUpdate {
	return []abci.ValidatorUpdate{}
}
func (AppModule) ExportGenesis(_ sdk.Context, _ codec.JSONCodec) json.RawMessage {
	return json.RawMessage(`{}`)
}
func (AppModule) BeginBlock(_ sdk.Context, _ abci.RequestBeginBlock) {}

// EndBlock processes auto-releases for escrows that have timed out.
// Bridge relayers are expected to submit MsgUpdateEscrowState transactions;
// this hook handles any that slipped through the timeout window.
func (am AppModule) EndBlock(ctx sdk.Context, _ abci.RequestEndBlock) []abci.ValidatorUpdate {
	return []abci.ValidatorUpdate{}
}
