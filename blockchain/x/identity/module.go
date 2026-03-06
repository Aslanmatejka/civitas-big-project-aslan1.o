// Package identity implements the CIVITAS L1 identity module.
//
// Responsibilities:
//   - On-chain anchoring of W3C DID documents
//   - Credential registry (issue / revoke / verify)
//   - ZK proof result attestation bridge from EVM layer
//
// This module does NOT replicate identity data from the EVM contracts —
// it provides an authoritative L1 record used by permissioned bridges
// and cross-chain credential proofs.
package identity

import (
	"encoding/json"
	"fmt"

	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/module"
	abci "github.com/tendermint/tendermint/abci/types"

	"civitas-chain/x/identity/keeper"
	"civitas-chain/x/identity/types"
)

var (
	_ module.AppModule      = AppModule{}
	_ module.AppModuleBasic = AppModuleBasic{}
)

// AppModuleBasic defines the basic application module used by the identity module.
type AppModuleBasic struct{}

func (AppModuleBasic) Name() string { return types.ModuleName }

func (AppModuleBasic) RegisterCodec(cdc *codec.LegacyAmino) {
	cdc.RegisterConcrete(&types.MsgCreateDID{}, "identity/CreateDID", nil)
	cdc.RegisterConcrete(&types.MsgUpdateDID{}, "identity/UpdateDID", nil)
	cdc.RegisterConcrete(&types.MsgDeactivateDID{}, "identity/DeactivateDID", nil)
	cdc.RegisterConcrete(&types.MsgIssueCredential{}, "identity/IssueCredential", nil)
	cdc.RegisterConcrete(&types.MsgRevokeCredential{}, "identity/RevokeCredential", nil)
}

func (AppModuleBasic) DefaultGenesis(cdc codec.JSONCodec) json.RawMessage {
	return cdc.MustMarshalJSON(&GenesisState{})
}

func (AppModuleBasic) ValidateGenesis(cdc codec.JSONCodec, _ client.TxEncodingConfig, bz json.RawMessage) error {
	var gs GenesisState
	if err := cdc.UnmarshalJSON(bz, &gs); err != nil {
		return fmt.Errorf("failed to unmarshal %s genesis state: %w", types.ModuleName, err)
	}
	return nil
}

func (AppModuleBasic) RegisterRESTRoutes(_ client.Context, _ *mux.Router) {}
func (AppModuleBasic) RegisterGRPCGatewayRoutes(_ client.Context, _ *runtime.ServeMux) {}
func (AppModuleBasic) GetTxCmd() *cobra.Command    { return nil }
func (AppModuleBasic) GetQueryCmd() *cobra.Command { return nil }

// AppModule implements the full AppModule interface.
type AppModule struct {
	AppModuleBasic
	keeper keeper.Keeper
	cdc    codec.Codec
}

// NewAppModule returns a new AppModule for the identity module.
func NewAppModule(cdc codec.Codec, k keeper.Keeper) AppModule {
	return AppModule{cdc: cdc, keeper: k}
}

func (AppModule) Name() string                      { return types.ModuleName }
func (AppModule) RegisterInvariants(_ sdk.InvariantRegistry) {}
func (AppModule) Route() sdk.Route                  { return sdk.Route{} }
func (AppModule) QuerierRoute() string              { return types.QuerierKey }
func (AppModule) LegacyQuerierHandler(_ *codec.LegacyAmino) sdk.Querier { return nil }
func (AppModule) ConsensusVersion() uint64         { return 1 }
func (AppModule) RegisterServices(_ module.Configurator) {}

func (am AppModule) InitGenesis(ctx sdk.Context, cdc codec.JSONCodec, data json.RawMessage) []abci.ValidatorUpdate {
	var gs GenesisState
	cdc.MustUnmarshalJSON(data, &gs)
	InitGenesis(ctx, am.keeper, gs)
	return []abci.ValidatorUpdate{}
}

func (am AppModule) ExportGenesis(ctx sdk.Context, cdc codec.JSONCodec) json.RawMessage {
	gs := ExportGenesis(ctx, am.keeper)
	return cdc.MustMarshalJSON(gs)
}

func (AppModule) BeginBlock(_ sdk.Context, _ abci.RequestBeginBlock) {}
func (AppModule) EndBlock(_ sdk.Context, _ abci.RequestEndBlock) []abci.ValidatorUpdate {
	return []abci.ValidatorUpdate{}
}

// GenesisState holds the genesis state for the identity module.
type GenesisState struct {
	DIDs        []types.DIDDocument `json:"dids"`
	Credentials []types.Credential  `json:"credentials"`
}

// InitGenesis initializes state from genesis.
func InitGenesis(ctx sdk.Context, k keeper.Keeper, gs GenesisState) {
	for _, doc := range gs.DIDs {
		k.SetDID(ctx, doc.ID, doc)
	}
	for _, cred := range gs.Credentials {
		if err := k.IssueCredential(ctx, cred); err != nil {
			panic(fmt.Sprintf("failed to issue genesis credential: %s", err))
		}
	}
}

// ExportGenesis exports current state to genesis format.
func ExportGenesis(ctx sdk.Context, k keeper.Keeper) *GenesisState {
	gs := &GenesisState{}
	k.IterateAllDIDs(ctx, func(_ string, doc types.DIDDocument) bool {
		gs.DIDs = append(gs.DIDs, doc)
		return false
	})
	return gs
}
