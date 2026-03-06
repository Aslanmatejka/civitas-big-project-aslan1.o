package types

import "time"

const (
	ModuleName = "escrow"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

var (
	KeyPrefixEscrow   = []byte{0x01}
	KeyPrefixAudit    = []byte{0x02}
)

func EscrowKey(id string) []byte { return append(KeyPrefixEscrow, []byte(id)...) }

// EscrowState mirrors the EVM-side state for L1 audit purposes.
type EscrowState uint8

const (
	EscrowPending   EscrowState = 0
	EscrowActive    EscrowState = 1
	EscrowDelivered EscrowState = 2
	EscrowDisputed  EscrowState = 3
	EscrowReleased  EscrowState = 4
	EscrowRefunded  EscrowState = 5
	EscrowCancelled EscrowState = 6
)

// EscrowRecord is the L1 shadow of an EVM escrow.
type EscrowRecord struct {
	ID            string      `json:"id"`
	Buyer         string      `json:"buyer"`
	Seller        string      `json:"seller"`
	AmountUCIV    int64       `json:"amount_uciv"`
	State         EscrowState `json:"state"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`
	EVMTxHash     string      `json:"evm_tx_hash"`
	L1BlockHeight int64       `json:"l1_block_height"`
}

// AuditEntry records a state transition for the escrow audit log.
type AuditEntry struct {
	EscrowID  string      `json:"escrow_id"`
	PrevState EscrowState `json:"prev_state"`
	NewState  EscrowState `json:"new_state"`
	Actor     string      `json:"actor"`
	Timestamp time.Time   `json:"timestamp"`
	TxHash    string      `json:"tx_hash"`
}
