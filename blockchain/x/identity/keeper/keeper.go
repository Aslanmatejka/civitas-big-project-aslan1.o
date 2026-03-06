// Package keeper implements the identity module's state management logic.
package keeper

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"
	paramtypes "github.com/cosmos/cosmos-sdk/x/params/types"

	"civitas-chain/x/identity/types"
)

// Keeper holds all state-access methods for the identity module.
type Keeper struct {
	cdc        codec.BinaryCodec
	storeKey   sdk.StoreKey
	paramSpace paramtypes.Subspace
}

// NewKeeper returns a new identity Keeper.
func NewKeeper(
	cdc codec.BinaryCodec,
	storeKey sdk.StoreKey,
	paramSpace paramtypes.Subspace,
) Keeper {
	return Keeper{
		cdc:        cdc,
		storeKey:   storeKey,
		paramSpace: paramSpace,
	}
}

// ── DID Document CRUD ─────────────────────────────────────────────────────────

// SetDID anchors a DID document on-chain.
func (k Keeper) SetDID(ctx sdk.Context, address string, doc types.DIDDocument) {
	store := ctx.KVStore(k.storeKey)
	bz, err := k.cdc.MarshalJSON(&doc)
	if err != nil {
		panic(fmt.Sprintf("failed to marshal DID document: %s", err))
	}
	store.Set(types.DIDKey(address), bz)
}

// GetDID returns the DID document for the given address, or false if not found.
func (k Keeper) GetDID(ctx sdk.Context, address string) (types.DIDDocument, bool) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(types.DIDKey(address))
	if bz == nil {
		return types.DIDDocument{}, false
	}
	var doc types.DIDDocument
	k.cdc.MustUnmarshalJSON(bz, &doc)
	return doc, true
}

// HasDID returns whether a DID exists for the given address.
func (k Keeper) HasDID(ctx sdk.Context, address string) bool {
	store := ctx.KVStore(k.storeKey)
	return store.Has(types.DIDKey(address))
}

// DeactivateDID marks a DID as deactivated.
func (k Keeper) DeactivateDID(ctx sdk.Context, address string) error {
	doc, found := k.GetDID(ctx, address)
	if !found {
		return fmt.Errorf("DID not found for address: %s", address)
	}
	doc.Deactivated = true
	doc.Updated = time.Now().UTC().Format(time.RFC3339)
	k.SetDID(ctx, address, doc)
	return nil
}

// IterateAllDIDs calls cb for every DID document in state.
func (k Keeper) IterateAllDIDs(ctx sdk.Context, cb func(address string, doc types.DIDDocument) bool) {
	store := ctx.KVStore(k.storeKey)
	iter := sdk.KVStorePrefixIterator(store, types.KeyPrefixDID)
	defer iter.Close()
	for ; iter.Valid(); iter.Next() {
		var doc types.DIDDocument
		k.cdc.MustUnmarshalJSON(iter.Value(), &doc)
		address := string(iter.Key()[len(types.KeyPrefixDID):])
		if cb(address, doc) {
			break
		}
	}
}

// ── Credential Management ─────────────────────────────────────────────────────

// IssueCredential stores a credential on-chain.
func (k Keeper) IssueCredential(ctx sdk.Context, cred types.Credential) error {
	if !k.HasDID(ctx, cred.Subject) {
		return fmt.Errorf("subject DID does not exist: %s", cred.Subject)
	}
	store := ctx.KVStore(k.storeKey)
	key := types.CredentialKey(cred.Subject, fmt.Sprintf("%d", cred.Type))
	bz, err := k.cdc.MarshalJSON(&cred)
	if err != nil {
		return fmt.Errorf("failed to marshal credential: %w", err)
	}
	store.Set(key, bz)
	return nil
}

// GetCredential retrieves a credential by subject and type.
func (k Keeper) GetCredential(ctx sdk.Context, subject string, credType types.CredentialType) (types.Credential, bool) {
	store := ctx.KVStore(k.storeKey)
	key := types.CredentialKey(subject, fmt.Sprintf("%d", credType))
	bz := store.Get(key)
	if bz == nil {
		return types.Credential{}, false
	}
	var cred types.Credential
	k.cdc.MustUnmarshalJSON(bz, &cred)
	return cred, true
}

// HasActiveCredential checks if a subject has an active, non-expired, non-revoked credential.
func (k Keeper) HasActiveCredential(ctx sdk.Context, subject string, credType types.CredentialType) bool {
	cred, found := k.GetCredential(ctx, subject, credType)
	if !found || cred.Revoked {
		return false
	}
	if cred.ExpirationDate != "" {
		exp, err := time.Parse(time.RFC3339, cred.ExpirationDate)
		if err != nil || ctx.BlockTime().After(exp) {
			return false
		}
	}
	return true
}

// RevokeCredential marks a credential as revoked and stores its hash in the revocation registry.
func (k Keeper) RevokeCredential(ctx sdk.Context, subject string, credType types.CredentialType, credID string) error {
	cred, found := k.GetCredential(ctx, subject, credType)
	if !found {
		return fmt.Errorf("credential not found for subject %s type %d", subject, credType)
	}
	cred.Revoked = true
	bz, _ := k.cdc.MarshalJSON(&cred)

	store := ctx.KVStore(k.storeKey)
	store.Set(types.CredentialKey(subject, fmt.Sprintf("%d", credType)), bz)

	// Also record in revocation registry by hash
	h := sha256.Sum256([]byte(credID))
	store.Set(types.RevokedKey(h[:]), []byte{0x01})
	return nil
}

// IsRevoked checks if a credential by its ID hash is in the revocation registry.
func (k Keeper) IsRevoked(ctx sdk.Context, credID string) bool {
	store := ctx.KVStore(k.storeKey)
	h := sha256.Sum256([]byte(credID))
	return store.Has(types.RevokedKey(h[:]))
}

// HashCredential returns a hex-encoded SHA-256 hash of a credential ID (for revocation log).
func HashCredential(credID string) string {
	h := sha256.Sum256([]byte(credID))
	return hex.EncodeToString(h[:])
}
