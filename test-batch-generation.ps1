# Test Batch Generation Feature
# This script tests the optimized batch generation functionality

Write-Host "=== Testing Batch Generation Feature ===" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm is not available. Please install npm first." -ForegroundColor Red
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install dependencies." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Starting development server..." -ForegroundColor Yellow
Write-Host "The server will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "=== Test Steps ===" -ForegroundColor Green
Write-Host "1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "2. Navigate to the Discover page" -ForegroundColor White
Write-Host "3. Click the refresh button in the top right corner" -ForegroundColor White
Write-Host "4. Check the browser console for batch generation logs" -ForegroundColor White
Write-Host "5. Verify that multiple posts and comments are generated in one API call" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "=== Expected Behavior ===" -ForegroundColor Green
Write-Host "- Only ONE API call should be made for all content generation" -ForegroundColor White
Write-Host "- Multiple posts and comments should be created from the single response" -ForegroundColor White
Write-Host "- Chat history should be included in the API request" -ForegroundColor White
Write-Host "- Content should be more contextual and personalized" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

# Start the development server
npm run dev 