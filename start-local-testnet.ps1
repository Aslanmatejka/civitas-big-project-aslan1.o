# CIVITAS Local Development Environment Setup (Windows PowerShell)
# This script starts a Hardhat local node and deploys all contracts

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "CIVITAS Local Development Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to smart-contracts directory
Set-Location smart-contracts

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
  Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
  npm install
  Write-Host ""
}

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
npx hardhat clean
Write-Host ""

# Compile contracts
Write-Host "🔨 Compiling contracts..." -ForegroundColor Yellow
npx hardhat compile
Write-Host ""

# Kill any existing Hardhat node
Get-Process | Where-Object { $_.ProcessName -like "*node*" -and $_.CommandLine -like "*hardhat node*" } | Stop-Process -Force

# Start Hardhat node in background
Write-Host "🚀 Starting Hardhat local node..." -ForegroundColor Green
Write-Host "   RPC: http://127.0.0.1:8545" -ForegroundColor Gray
Write-Host "   Chain ID: 31337" -ForegroundColor Gray
Write-Host ""

# Start node in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npx hardhat node" -WindowStyle Normal

Write-Host "⏳ Waiting for node to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Deploy contracts
Write-Host ""
Write-Host "📝 Deploying contracts to local network..." -ForegroundColor Yellow
npx hardhat run scripts/deploy.js --network localhost

# Check if deployment was successful
if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "✅ Deployment successful!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Contract addresses saved to: smart-contracts/deployments.json" -ForegroundColor Cyan
    
  # Auto-update mobile app configuration
  Write-Host ""
  Write-Host "🔧 Updating mobile app configuration..." -ForegroundColor Yellow
  Set-Location ..
  node scripts/update-addresses.js
    
  if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 Setup complete! Mobile app configured." -ForegroundColor Green
  }
  else {
    Write-Host ""
    Write-Host "⚠️  Auto-configuration failed, but contracts are deployed" -ForegroundColor Yellow
    Write-Host "   You can manually copy addresses from smart-contracts/deployments.json" -ForegroundColor Gray
  }
    
  Write-Host ""
  Write-Host "📋 Next steps:" -ForegroundColor Yellow
  Write-Host "   1. Keep the Hardhat node window open" -ForegroundColor Gray
  Write-Host "   2. cd mobile-app; npm install (if not done yet)" -ForegroundColor Gray
  Write-Host "   3. npm start" -ForegroundColor Gray
  Write-Host ""
  Write-Host "🌐 Local testnet:" -ForegroundColor Cyan
  Write-Host "   RPC: http://127.0.0.1:8545" -ForegroundColor Gray
  Write-Host "   Chain ID: 31337" -ForegroundColor Gray
  Write-Host ""
  Write-Host "🔗 Hardhat node is running in separate window" -ForegroundColor Green
  Write-Host "   To stop: Close the Hardhat node window" -ForegroundColor Gray
}
else {
  Write-Host ""
  Write-Host "❌ Deployment failed!" -ForegroundColor Red
  Write-Host "   Check console for details" -ForegroundColor Gray
  Set-Location ..
  exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan

# Return to root directory
Set-Location ..
