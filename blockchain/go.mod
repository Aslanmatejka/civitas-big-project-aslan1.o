// CIVITAS Layer-1 blockchain node
// Built on Cosmos SDK v0.47 + Tendermint BFT v0.37
// Custom modules: x/identity, x/escrow, x/noderegistry, x/reputation
module civitas-chain

go 1.21

require (
	github.com/cosmos/cosmos-sdk v0.47.5
	github.com/tendermint/tendermint v0.37.4
	github.com/spf13/cast v1.5.1
	github.com/spf13/cobra v1.7.0
	github.com/spf13/viper v1.16.0
	github.com/cosmos/ibc-go/v7 v7.3.1
	github.com/tendermint/tm-db v0.6.7
)

require (
	// Indirect dependencies pulled in by Cosmos SDK
	github.com/cosmos/cosmos-proto v1.0.0-beta.3 // indirect
	github.com/cosmos/gogoproto v1.4.10 // indirect
	github.com/gogo/protobuf v1.3.2 // indirect
	github.com/golang/protobuf v1.5.3 // indirect
	github.com/gorilla/mux v1.8.0 // indirect
	github.com/grpc-ecosystem/grpc-gateway v1.16.0 // indirect
	google.golang.org/grpc v1.57.0 // indirect
	google.golang.org/protobuf v1.31.0 // indirect
)

// Replace directives for known Tendermint/Cosmos SDK compatibility
replace (
	// Use CometBFT fork maintained by the Cosmos team for SDK 0.47
	github.com/tendermint/tendermint => github.com/cometbft/cometbft v0.37.4
	github.com/tendermint/tm-db => github.com/cometbft/cometbft-db v0.8.0
)
