package keeper

import (
	"fmt"
	"time"

	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	bankkeeper "github.com/cosmos/cosmos-sdk/x/bank/keeper"
	paramtypes "github.com/cosmos/cosmos-sdk/x/params/types"

	"civitas-chain/x/escrow/types"
)

// Keeper holds escrow state and provides methods for recording and
// querying L1 escrow mirrors and audit logs.
type Keeper struct {
	cdc        codec.BinaryCodec
	storeKey   sdk.StoreKey
	paramSpace paramtypes.Subspace
	bankKeeper bankkeeper.Keeper
}

// NewKeeper returns a new escrow Keeper.
func NewKeeper(
	cdc codec.BinaryCodec,
	storeKey sdk.StoreKey,
	paramSpace paramtypes.Subspace,
	bk bankkeeper.Keeper,
) Keeper {
	return Keeper{cdc: cdc, storeKey: storeKey, paramSpace: paramSpace, bankKeeper: bk}
}

// RecordEscrow stores or updates an escrow record from a bridge relay.
func (k Keeper) RecordEscrow(ctx sdk.Context, rec types.EscrowRecord) {
	store := ctx.KVStore(k.storeKey)
	bz, _ := k.cdc.MarshalJSON(&rec)
	store.Set(types.EscrowKey(rec.ID), bz)
}

// GetEscrow retrieves an escrow record by ID.
func (k Keeper) GetEscrow(ctx sdk.Context, id string) (types.EscrowRecord, bool) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(types.EscrowKey(id))
	if bz == nil {
		return types.EscrowRecord{}, false
	}
	var rec types.EscrowRecord
	k.cdc.MustUnmarshalJSON(bz, &rec)
	return rec, true
}

// AppendAuditLog appends an audit entry for an escrow state transition.
func (k Keeper) AppendAuditLog(ctx sdk.Context, entry types.AuditEntry) {
	store := ctx.KVStore(k.storeKey)
	key := append(types.KeyPrefixAudit, []byte(entry.EscrowID)...)
	key = append(key, []byte(fmt.Sprintf("/%d", entry.Timestamp.UnixNano()))...)
	bz, _ := k.cdc.MarshalJSON(&entry)
	store.Set(key, bz)
}

// Ensure time import is used (audit log timestamps).
var _ = time.Now
