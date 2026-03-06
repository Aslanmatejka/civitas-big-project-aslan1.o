// Package reputation implements the CIVITAS cross-chain reputation aggregation module.
//
// Reputation is derived from:
//   - On-chain staking (L1 + EVM StakingPool)
//   - Governance participation (votes + proposals)
//   - Escrow completion rate (as buyer and seller)
//   - Node uptime (for operator nodes)
//   - DID credential issuance
//   - Community endorsements
//
// Each category contributes a weighted score that is stored on-chain
// and queryable by name. The EVM layer's DIDRegistry references this
// score for reputation-gated features.
package reputation

import (
	"encoding/json"
	"fmt"

	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/module"
	paramtypes "github.com/cosmos/cosmos-sdk/x/params/types"
	abci "github.com/tendermint/tendermint/abci/types"

	idkeeper "civitas-chain/x/identity/keeper"
)

const (
	ModuleName = "reputation"
	StoreKey   = "reputation"
	RouterKey  = "reputation"
)

var (
	KeyPrefixScore    = []byte{0x01}
	KeyPrefixActivity = []byte{0x02}
)

func ScoreKey(address string) []byte { return append(KeyPrefixScore, []byte(address)...) }

// ── Reputation model ──────────────────────────────────────────────────────────

// ReputationScore is the aggregated on-chain reputation for an identity.
type ReputationScore struct {
	Address  string `json:"address"`
	Total    int64  `json:"total"`    // aggregated score 0 – 10000

	// Component scores (0-1000 each, weighted)
	Staking      int64 `json:"staking"`      // CIV staked on L1+EVM
	Governance   int64 `json:"governance"`   // participation rate
	EscrowBuyer  int64 `json:"escrow_buyer"` // successful purchases / total
	EscrowSeller int64 `json:"escrow_seller"`// successful sales / total
	NodeUptime   int64 `json:"node_uptime"`  // 0 if not a node operator
	Credentials  int64 `json:"credentials"`  // number of verified credentials * 100
	Endorsements int64 `json:"endorsements"` // community endorsements weighted by endorser rep

	// Meta
	LastUpdatedBlock int64 `json:"last_updated_block"`
}

// Component weights (must sum to 10000)
const (
	WeightStaking      = 2500
	WeightGovernance   = 2000
	WeightEscrowBuyer  = 1500
	WeightEscrowSeller = 1500
	WeightNodeUptime   = 1000
	WeightCredentials  = 800
	WeightEndorsements = 700
)

// ComputeTotal recalculates the total weighted score from components.
func (r *ReputationScore) ComputeTotal() {
	r.Total = (r.Staking*WeightStaking +
		r.Governance*WeightGovernance +
		r.EscrowBuyer*WeightEscrowBuyer +
		r.EscrowSeller*WeightEscrowSeller +
		r.NodeUptime*WeightNodeUptime +
		r.Credentials*WeightCredentials +
		r.Endorsements*WeightEndorsements) / 10000
}

// ── Keeper ────────────────────────────────────────────────────────────────────

// Keeper manages reputation state.
type Keeper struct {
	cdc              codec.BinaryCodec
	storeKey         sdk.StoreKey
	paramSpace       paramtypes.Subspace
	identityKeeper   idkeeper.Keeper
}

// NewKeeper returns a new reputation Keeper.
func NewKeeper(
	cdc codec.BinaryCodec,
	storeKey sdk.StoreKey,
	paramSpace paramtypes.Subspace,
	ik idkeeper.Keeper,
) Keeper {
	return Keeper{cdc: cdc, storeKey: storeKey, paramSpace: paramSpace, identityKeeper: ik}
}

// GetScore retrieves the reputation score for an address.
func (k Keeper) GetScore(ctx sdk.Context, address string) (ReputationScore, bool) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(ScoreKey(address))
	if bz == nil {
		return ReputationScore{Address: address}, false
	}
	var score ReputationScore
	k.cdc.MustUnmarshalJSON(bz, &score)
	return score, true
}

// SetScore writes a reputation score for an address.
func (k Keeper) SetScore(ctx sdk.Context, score ReputationScore) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := k.cdc.MarshalJSON(&score)
	store.Set(ScoreKey(score.Address), bz)
}

// UpdateStakingScore updates the staking component of a user's reputation.
func (k Keeper) UpdateStakingScore(ctx sdk.Context, address string, stakedUCIV int64) {
	score, _ := k.GetScore(ctx, address)
	score.Address = address
	// Normalize: 100,000 CIV = max staking score (1000)
	normalised := stakedUCIV / (100_000 * 1_000_000) // uciv → CIV → normalised
	if normalised > 1000 {
		normalised = 1000
	}
	score.Staking = normalised
	score.ComputeTotal()
	score.LastUpdatedBlock = ctx.BlockHeight()
	k.SetScore(ctx, score)
}

// UpdateGovernanceScore updates the governance participation score.
// participationBps is votes_cast / total_proposals (0-10000 bps).
func (k Keeper) UpdateGovernanceScore(ctx sdk.Context, address string, participationBps int64) {
	score, _ := k.GetScore(ctx, address)
	score.Address = address
	score.Governance = participationBps / 10 // convert bps→0-1000
	if score.Governance > 1000 {
		score.Governance = 1000
	}
	score.ComputeTotal()
	score.LastUpdatedBlock = ctx.BlockHeight()
	k.SetScore(ctx, score)
}

// UpdateCredentialScore refreshes a user's credential component based on DID state.
func (k Keeper) UpdateCredentialScore(ctx sdk.Context, address string) {
	score, _ := k.GetScore(ctx, address)
	score.Address = address

	// Count active credentials and derive score
	credCount := int64(0)
	credTypes := []idkeeper.CredentialType{0, 1, 2, 3, 4, 5}
	for _, ct := range credTypes {
		if k.identityKeeper.HasActiveCredential(ctx, address, ct) {
			credCount++
		}
	}
	score.Credentials = credCount * 100 // each credential worth 100 points max
	if score.Credentials > 1000 {
		score.Credentials = 1000
	}
	score.ComputeTotal()
	score.LastUpdatedBlock = ctx.BlockHeight()
	k.SetScore(ctx, score)
}

// IterateAllScores calls cb for every stored reputation score.
func (k Keeper) IterateAllScores(ctx sdk.Context, cb func(ReputationScore) bool) {
	store := ctx.KVStore(k.storeKey)
	iter := sdk.KVStorePrefixIterator(store, KeyPrefixScore)
	defer iter.Close()
	for ; iter.Valid(); iter.Next() {
		var s ReputationScore
		if err := k.cdc.UnmarshalJSON(iter.Value(), &s); err == nil {
			if cb(s) {
				break
			}
		}
	}
}

// ── Module interface ──────────────────────────────────────────────────────────

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
	keeper Keeper
	cdc    codec.Codec
}

func NewAppModule(cdc codec.Codec, k Keeper) AppModule { return AppModule{cdc: cdc, keeper: k} }

func (AppModule) Name() string { return ModuleName }
func (AppModule) RegisterInvariants(_ sdk.InvariantRegistry) {}
func (AppModule) Route() sdk.Route { return sdk.Route{} }
func (AppModule) QuerierRoute() string { return RouterKey }
func (AppModule) LegacyQuerierHandler(_ *codec.LegacyAmino) sdk.Querier { return nil }
func (AppModule) ConsensusVersion() uint64 { return 1 }
func (AppModule) RegisterServices(_ module.Configurator) {}

func (AppModule) InitGenesis(_ sdk.Context, _ codec.JSONCodec, _ json.RawMessage) []abci.ValidatorUpdate {
	return []abci.ValidatorUpdate{}
}
func (AppModule) ExportGenesis(_ sdk.Context, _ codec.JSONCodec) json.RawMessage {
	return json.RawMessage(`{}`)
}
func (AppModule) BeginBlock(_ sdk.Context, _ abci.RequestBeginBlock) {}

// EndBlock syncs reputation data from cross-chain oracle feeds.
// In production, bridge relayers submit signed MsgUpdateReputation transactions;
// this hook triggers re-scoring for any pending updates.
func (am AppModule) EndBlock(ctx sdk.Context, _ abci.RequestEndBlock) []abci.ValidatorUpdate {
	// Refresh credential scores for all identities every 1000 blocks
	if ctx.BlockHeight()%1000 == 0 {
		am.keeper.IterateAllScores(ctx, func(s ReputationScore) bool {
			am.keeper.UpdateCredentialScore(ctx, s.Address)
			return false
		})
	}
	return []abci.ValidatorUpdate{}
}

func init() { _ = fmt.Sprintf }
