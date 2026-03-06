package types

const (
	ModuleName = "reputation"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

var (
	KeyPrefixScore    = []byte{0x01}
	KeyPrefixActivity = []byte{0x02}
)

func ScoreKey(addr string) []byte { return append(KeyPrefixScore, []byte(addr)...) }
