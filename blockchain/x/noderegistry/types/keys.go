package types

const (
	ModuleName = "noderegistry"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

var (
	// KeyPrefixNode: <operatorAddress> → NodeRecord bytes
	KeyPrefixNode = []byte{0x01}
	// KeyPrefixEpoch: <epochNumber 8 bytes big-endian> → EpochSummary bytes
	KeyPrefixEpoch = []byte{0x02}
	// KeyPrefixUptimeReport: <operatorAddress>/<epochNumber> → UptimeReport bytes
	KeyPrefixUptimeReport = []byte{0x03}
)

func NodeKey(operator string) []byte {
	return append(KeyPrefixNode, []byte(operator)...)
}
