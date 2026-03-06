#!/bin/bash

# CIVITAS Local Development Environment Setup
# This script starts a Hardhat local node and deploys all contracts

echo "======================================"
echo "CIVITAS Local Development Setup"
echo "======================================"
echo ""

# Navigate to smart-contracts directory
cd smart-contracts

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
npm run clean
echo ""

# Compile contracts
echo "🔨 Compiling contracts..."
npm run compile
echo ""

# Start Hardhat node in background
echo "🚀 Starting Hardhat local node..."
echo "   RPC: http://127.0.0.1:8545"
echo "   Chain ID: 31337"
echo ""

# Kill any existing Hardhat node
pkill -f "hardhat node" || true

# Start node in background
npm run node > hardhat-node.log 2>&1 &
HARDHAT_PID=$!

echo "⏳ Waiting for node to start..."
sleep 5

# Deploy contracts
echo ""
echo "📝 Deploying contracts to local network..."
npm run deploy:local

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "Contract addresses saved to: smart-contracts/deployments.json"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Copy contract addresses to mobile-app/src/services/contractService.js"
    echo "   2. Update RPC URL to: http://127.0.0.1:8545"
    echo "   3. Run: cd mobile-app && npm start"
    echo ""
    echo "🔗 Hardhat node is running (PID: $HARDHAT_PID)"
    echo "   To stop: kill $HARDHAT_PID"
    echo "   Logs: smart-contracts/hardhat-node.log"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "   Check logs for details"
    kill $HARDHAT_PID
    exit 1
fi

echo ""
echo "======================================"
