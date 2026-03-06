// Package types defines the store keys and constants for the identity module.
package types

const (
	ModuleName = "identity"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
	QuerierKey = ModuleName
)

// KV Store key prefixes
var (
	// KeyPrefixDID: did:civitas:<address> → DIDDocument bytes
	KeyPrefixDID = []byte{0x01}
	// KeyPrefixCredential: <address>/<credType> → Credential bytes
	KeyPrefixCredential = []byte{0x02}
	// KeyPrefixController: <controllerAddress> → list of DIDs controlled
	KeyPrefixController = []byte{0x03}
	// KeyPrefixRevoked: <credHash> → bool
	KeyPrefixRevoked = []byte{0x04}
)

// DIDKey returns the KV key for a given DID subject address.
func DIDKey(address string) []byte {
	return append(KeyPrefixDID, []byte(address)...)
}

// CredentialKey returns the KV key for a credential.
func CredentialKey(address, credType string) []byte {
	key := append(KeyPrefixCredential, []byte(address)...)
	key = append(key, []byte("/")...)
	return append(key, []byte(credType)...)
}

// RevokedKey returns the KV key for a revoked credential hash.
func RevokedKey(credHash []byte) []byte {
	return append(KeyPrefixRevoked, credHash...)
}
