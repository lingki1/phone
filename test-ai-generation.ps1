# AI Generation Test Script
Write-Host "AI Dynamic Generation Test" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found, please install Node.js first" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm not found, please install npm first" -ForegroundColor Red
    exit 1
}

# Check project dependencies
if (Test-Path "package.json") {
    Write-Host "Found package.json" -ForegroundColor Green
    
    if (Test-Path "node_modules") {
        Write-Host "node_modules exists" -ForegroundColor Green
    } else {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
    }
} else {
    Write-Host "package.json not found, please ensure you are in the correct project directory" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting development server..." -ForegroundColor Yellow
Write-Host "Test steps:" -ForegroundColor Cyan
Write-Host "1. Open browser and visit http://localhost:3000" -ForegroundColor White
Write-Host "2. Go to discover page" -ForegroundColor White
Write-Host "3. Click refresh button in top right" -ForegroundColor White
Write-Host "4. Check console output for AI generation process" -ForegroundColor White
Write-Host "5. Verify generated posts and comments" -ForegroundColor White
Write-Host ""
Write-Host "Note: Make sure API settings are configured correctly" -ForegroundColor Yellow
Write-Host ""

# Start development server
npm run dev 