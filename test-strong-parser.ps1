# Test Strong JSON Parser Feature
# This script tests the robust JSON parsing functionality

Write-Host "=== Testing Strong JSON Parser Feature ===" -ForegroundColor Green

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
Write-Host "Server will be available at: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "=== Test Instructions ===" -ForegroundColor Green
Write-Host "1. Open http://localhost:3001 in your browser" -ForegroundColor White
Write-Host "2. Navigate to the Discover page" -ForegroundColor White
Write-Host "3. Click the refresh button in the top right" -ForegroundColor White
Write-Host "4. Check the browser console for parsing logs:" -ForegroundColor White
Write-Host "   - Look for '🔧 开始强力JSON解析' messages" -ForegroundColor White
Write-Host "   - Check for '✅ 直接解析成功' or other success messages" -ForegroundColor White
Write-Host "   - Verify that content is generated even with truncated responses" -ForegroundColor White
Write-Host ""
Write-Host "=== Expected Console Output ===" -ForegroundColor Green
Write-Host "🔧 开始强力JSON解析，原始内容长度: XXX" -ForegroundColor White
Write-Host "📦 从代码块中提取内容 (if wrapped in code blocks)" -ForegroundColor White
Write-Host "✅ 直接解析成功 (or other success method)" -ForegroundColor White
Write-Host "✅ 解析后的响应: {...}" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

# Start the development server
npm run dev 