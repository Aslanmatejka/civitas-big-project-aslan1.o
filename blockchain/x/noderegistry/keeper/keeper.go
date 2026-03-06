package keeper

import (
	"encoding/binary"
	"fmt"
	"time"

	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	bankkeeper "github.com/cosmos/cosmos-sdk/x/bank/keeper"
	paramtypes "github.com/cosmos/cosmos-sdk/x/params/types"

	"civitas-chain/x/noderegistry/types"
)

const (
	// MinNodeStakeCIV — minimum stake in uciv (5,000 CIV = 5_000_000_000 uciv)
	MinNodeStakeCIV = int64(5_000_000_000)

	// EpochDuration — how often epoch rewards are calculated (24 hours)
	EpochDuration = 24 * time.Hour

	// SlashFractionBps — 10% slash for misbehaving nodes
	SlashFractionBps = 1000

	// UnstakeCooldown — 7-day unbonding period
	UnstakeCooldown = 7 * 24 * time.Hour
)

// NodeTier describes the stake tier of a node.
type NodeTier uint8

const (
	TierBronze   NodeTier = 0 // 5,000 – 49,999 CIV
	TierSilver   NodeTier = 1 // 50,000 – 199,999 CIV
	TierGold     NodeTier = 2 // 200,000 – 499,999 CIV
	TierPlatinum NodeTier = 3 // 500,000+ CIV
)

// NodeRecord holds the on-chain state of a registered node.
type NodeRecord struct {
	Operator      string    `json:"operator"`
	Moniker       string    `json:"moniker"`
	Endpoint      string    `json:"endpoint"`    // REST/gRPC endpoint
	P2PAddress    string    `json:"p2p_address"` // libp2p multiaddr
	StakedAmt     sdk.Coin  `json:"staked"`
	Tier          NodeTier  `json:"tier"`
	UptimeScore   int64     `json:"uptime_score"` // 0-10000 bps
	StorageGB     int64     `json:"storage_gb"`
	RegisteredAt  time.Time `json:"registered_at"`
	LastUptimeAt  time.Time `json:"last_uptime_at"`
	TotalRewards  sdk.Coin  `json:"total_rewards"`
	Active        bool      `json:"active"`
}

// Keeper holds all state-access methods for the noderegistry module.
type Keeper struct {
	cdc        codec.BinaryCodec
	storeKey   sdk.StoreKey
	paramSpace paramtypes.Subspace
	bankKeeper bankkeeper.Keeper
}

// NewKeeper returns a new noderegistry Keeper.
func NewKeeper(
	cdc codec.BinaryCodec,
	storeKey sdk.StoreKey,
	paramSpace paramtypes.Subspace,
	bk bankkeeper.Keeper,
) Keeper {
	return Keeper{cdc: cdc, storeKey: storeKey, paramSpace: paramSpace, bankKeeper: bk}
}

// ── Node Registration ─────────────────────────────────────────────────────────

// RegisterNode registers a new node and locks stake.
func (k Keeper) RegisterNode(ctx sdk.Context, operator sdk.AccAddress, moniker, endpoint, p2p string, storageGB int64, stakeAmt sdk.Coin) error {
	if stakeAmt.Amount.Int64() < MinNodeStakeCIV {
		return fmt.Errorf("minimum stake is %d uciv", MinNodeStakeCIV)
	}

	// Send stake to module account
	modAddr := sdk.AccAddress([]byte("noderegistry"))
	if err := k.bankKeeper.SendCoins(ctx, operator, modAddr, sdk.NewCoins(stakeAmt)); err != nil {
		return fmt.Errorf("failed to transfer stake: %w", err)
	}

	record := NodeRecord{
		Operator:     operator.String(),
		Moniker:      moniker,
		Endpoint:     endpoint,
		P2PAddress:   p2p,
		StakedAmt:    stakeAmt,
		Tier:         tierFromStake(stakeAmt.Amount.Int64()),
		StorageGB:    storageGB,
		RegisteredAt: ctx.BlockTime(),
		Active:       true,
	}

	k.setNode(ctx, operator.String(), record)
	return nil
}

// DeactivateNode removes a node from the active set.
func (k Keeper) DeactivateNode(ctx sdk.Context, operator string) error {
	node, found := k.GetNode(ctx, operator)
	if !found {
		return fmt.Errorf("node not found: %s", operator)
	}
	node.Active = false
	k.setNode(ctx, operator, node)
	return nil
}

// SlashNode slashes SlashFractionBps of the node's stake for misbehaviour.
func (k Keeper) SlashNode(ctx sdk.Context, operator string) (sdk.Coin, error) {
	node, found := k.GetNode(ctx, operator)
	if !found {
		return sdk.Coin{}, fmt.Errorf("node not found: %s", operator)
	}
	slashAmt := node.StakedAmt.Amount.Int64() * SlashFractionBps / 10000
	node.StakedAmt.Amount = node.StakedAmt.Amount.SubRaw(slashAmt)
	node.Tier = tierFromStake(node.StakedAmt.Amount.Int64())
	k.setNode(ctx, operator, node)
	slashed := sdk.NewInt64Coin(node.StakedAmt.Denom, slashAmt)
	return slashed, nil
}

// ReportUptime records the uptime score from the oracle for a node.
func (k Keeper) ReportUptime(ctx sdk.Context, operator string, uptimeBps int64) error {
	node, found := k.GetNode(ctx, operator)
	if !found {
		return fmt.Errorf("node not found: %s", operator)
	}
	if uptimeBps < 0 || uptimeBps > 10000 {
		return fmt.Errorf("uptime must be 0-10000 bps, got %d", uptimeBps)
	}
	// Exponential moving average: new = 0.8*old + 0.2*new
	node.UptimeScore = (node.UptimeScore*8 + uptimeBps*2) / 10
	node.LastUptimeAt = ctx.BlockTime()
	k.setNode(ctx, operator, node)
	return nil
}

// CalculateEpochReward computes the reward for a node in the current epoch.
// Formula: baseReward * (uptime/10000) * (storageGB/1000) * stakeFactor
// stakeFactor is scaled by tier.
func (k Keeper) CalculateEpochReward(node NodeRecord) int64 {
	if !node.Active {
		return 0
	}
	baseReward := int64(1_000_000) // 1 CIV in uciv per epoch base
	uptimeFactor := float64(node.UptimeScore) / 10000.0
	storageFactor := float64(node.StorageGB)/1000.0 + 1.0
	stakeFactor := float64(tierMultiplier(node.Tier))
	return int64(float64(baseReward) * uptimeFactor * storageFactor * stakeFactor)
}

// IterateActiveNodes calls cb for every active NodeRecord.
func (k Keeper) IterateActiveNodes(ctx sdk.Context, cb func(NodeRecord) bool) {
	store := ctx.KVStore(k.storeKey)
	iter := sdk.KVStorePrefixIterator(store, types.KeyPrefixNode)
	defer iter.Close()
	for ; iter.Valid(); iter.Next() {
		var rec NodeRecord
		if err := k.cdc.UnmarshalJSON(iter.Value(), &rec); err == nil && rec.Active {
			if cb(rec) {
				break
			}
		}
	}
}

// GetNode retrieves a NodeRecord by operator address.
func (k Keeper) GetNode(ctx sdk.Context, operator string) (NodeRecord, bool) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(types.NodeKey(operator))
	if bz == nil {
		return NodeRecord{}, false
	}
	var rec NodeRecord
	k.cdc.MustUnmarshalJSON(bz, &rec)
	return rec, true
}

func (k Keeper) setNode(ctx sdk.Context, operator string, rec NodeRecord) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := k.cdc.MarshalJSON(&rec)
	store.Set(types.NodeKey(operator), bz)
}

// currentEpoch encodes block height / blocks-per-day into 8-byte big-endian epoch key.
func currentEpoch(ctx sdk.Context) []byte {
	epoch := uint64(ctx.BlockHeight() / 17280) // ~17280 blocks per day at 5s blocks
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, epoch)
	return b
}

func tierFromStake(uciv int64) NodeTier {
	civ := uciv / 1_000_000
	switch {
	case civ >= 500_000:
		return TierPlatinum
	case civ >= 200_000:
		return TierGold
	case civ >= 50_000:
		return TierSilver
	default:
		return TierBronze
	}
}

func tierMultiplier(t NodeTier) int {
	switch t {
	case TierPlatinum:
		return 4
	case TierGold:
		return 3
	case TierSilver:
		return 2
	default:
		return 1
	}
}
