package types

import (
	"time"

	sdk "github.com/cosmos/cosmos-sdk/types"
)

// ──────────────────────────────────────────────────────────────────────────────
// Core on-chain DID types (W3C DID Core 1.0 compatible)
// ──────────────────────────────────────────────────────────────────────────────

// DIDDocument represents a W3C DID Document anchored on the CIVITAS L1.
type DIDDocument struct {
	// DID identifier — format: did:civitas:<address>
	ID string `json:"id"`

	// Context — always includes W3C DID context
	Context []string `json:"@context"`

	// Controller — address(es) that can update this DID document
	Controller []string `json:"controller,omitempty"`

	// VerificationMethods — public keys
	VerificationMethod []VerificationMethod `json:"verificationMethod,omitempty"`

	// Authentication — verification relationships
	Authentication []string `json:"authentication,omitempty"`

	// Service endpoints
	Service []ServiceEndpoint `json:"service,omitempty"`

	// Created / Updated timestamps (RFC3339)
	Created string `json:"created"`
	Updated string `json:"updated"`

	// Deactivated — a deactivated DID still exists in state but is not usable
	Deactivated bool `json:"deactivated,omitempty"`
}

// VerificationMethod represents a public key in a DID document.
type VerificationMethod struct {
	ID                 string `json:"id"`
	Type               string `json:"type"` // e.g. "EcdsaSecp256k1VerificationKey2019"
	Controller         string `json:"controller"`
	PublicKeyMultibase string `json:"publicKeyMultibase,omitempty"`
	PublicKeyHex       string `json:"publicKeyHex,omitempty"`
}

// ServiceEndpoint represents a DID service endpoint.
type ServiceEndpoint struct {
	ID              string `json:"id"`
	Type            string `json:"type"` // e.g. "CIVITASMessaging", "CredentialRegistry"
	ServiceEndpoint string `json:"serviceEndpoint"`
}

// Credential is an on-chain verifiable credential (claim) issued to a DID subject.
type Credential struct {
	// CredentialID — unique identifier for this credential (hash or UUID)
	ID string `json:"id"`

	// Type — one of the CIVITAS credential types
	Type CredentialType `json:"type"`

	// Subject — the DID this credential is issued to
	Subject string `json:"subject"`

	// Issuer — the DID or address that issued this credential
	Issuer string `json:"issuer"`

	// IssuanceDate — RFC3339
	IssuanceDate string `json:"issuanceDate"`

	// ExpirationDate — RFC3339, empty = non-expiring
	ExpirationDate string `json:"expirationDate,omitempty"`

	// ZKProofHash — optional: hash of the ZK proof for privacy-preserving creds
	ZKProofHash string `json:"zkProofHash,omitempty"`

	// Revoked — marks credential as revoked
	Revoked bool `json:"revoked"`
}

// CredentialType enumerates the credential categories CIVITAS recognises.
type CredentialType uint8

const (
	CredTypeKYC              CredentialType = 0
	CredTypeAgeOver18        CredentialType = 1
	CredTypeAccreditedInvestor CredentialType = 2
	CredTypeCitizenship      CredentialType = 3
	CredTypeIncomeThreshold  CredentialType = 4
	CredTypeIdentityHash     CredentialType = 5
)

// ──────────────────────────────────────────────────────────────────────────────
// Message types
// ──────────────────────────────────────────────────────────────────────────────

// MsgCreateDID anchors a new DID document on-chain.
type MsgCreateDID struct {
	// Creator — the tx signer; becomes the initial controller
	Creator sdk.AccAddress `json:"creator"`
	// Document — the DID document to anchor
	Document DIDDocument `json:"document"`
}

func (m MsgCreateDID) Route() string           { return RouterKey }
func (m MsgCreateDID) Type() string            { return "create_did" }
func (m MsgCreateDID) ValidateBasic() error {
	if m.Creator.Empty() {
		return fmt.Errorf("creator address is required")
	}
	if m.Document.ID == "" {
		return fmt.Errorf("DID document ID is required")
	}
	return nil
}
func (m MsgCreateDID) GetSignBytes() []byte {
	b, _ := json.Marshal(m)
	return sdk.MustSortJSON(b)
}
func (m MsgCreateDID) GetSigners() []sdk.AccAddress { return []sdk.AccAddress{m.Creator} }

// MsgUpdateDID updates an existing DID document on-chain.
type MsgUpdateDID struct {
	Controller sdk.AccAddress `json:"controller"`
	Document   DIDDocument    `json:"document"`
}

func (m MsgUpdateDID) Route() string           { return RouterKey }
func (m MsgUpdateDID) Type() string            { return "update_did" }
func (m MsgUpdateDID) ValidateBasic() error {
	if m.Controller.Empty() {
		return fmt.Errorf("controller address is required")
	}
	return nil
}
func (m MsgUpdateDID) GetSignBytes() []byte {
	b, _ := json.Marshal(m)
	return sdk.MustSortJSON(b)
}
func (m MsgUpdateDID) GetSigners() []sdk.AccAddress { return []sdk.AccAddress{m.Controller} }

// MsgDeactivateDID deactivates a DID, making it unusable.
type MsgDeactivateDID struct {
	Controller sdk.AccAddress `json:"controller"`
	DID        string         `json:"did"`
}

func (m MsgDeactivateDID) Route() string           { return RouterKey }
func (m MsgDeactivateDID) Type() string            { return "deactivate_did" }
func (m MsgDeactivateDID) ValidateBasic() error    { return nil }
func (m MsgDeactivateDID) GetSignBytes() []byte {
	b, _ := json.Marshal(m)
	return sdk.MustSortJSON(b)
}
func (m MsgDeactivateDID) GetSigners() []sdk.AccAddress { return []sdk.AccAddress{m.Controller} }

// MsgIssueCredential issues an on-chain credential to a DID subject.
type MsgIssueCredential struct {
	Issuer     sdk.AccAddress `json:"issuer"`
	Credential Credential     `json:"credential"`
}

func (m MsgIssueCredential) Route() string           { return RouterKey }
func (m MsgIssueCredential) Type() string            { return "issue_credential" }
func (m MsgIssueCredential) ValidateBasic() error    { return nil }
func (m MsgIssueCredential) GetSignBytes() []byte {
	b, _ := json.Marshal(m)
	return sdk.MustSortJSON(b)
}
func (m MsgIssueCredential) GetSigners() []sdk.AccAddress { return []sdk.AccAddress{m.Issuer} }

// MsgRevokeCredential revokes a previously issued credential.
type MsgRevokeCredential struct {
	Revoker         sdk.AccAddress `json:"revoker"`
	CredentialID    string         `json:"credential_id"`
}

func (m MsgRevokeCredential) Route() string           { return RouterKey }
func (m MsgRevokeCredential) Type() string            { return "revoke_credential" }
func (m MsgRevokeCredential) ValidateBasic() error    { return nil }
func (m MsgRevokeCredential) GetSignBytes() []byte {
	b, _ := json.Marshal(m)
	return sdk.MustSortJSON(b)
}
func (m MsgRevokeCredential) GetSigners() []sdk.AccAddress { return []sdk.AccAddress{m.Revoker} }

// now uses time package
var _ = time.Now
