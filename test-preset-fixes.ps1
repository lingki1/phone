# 预设功能修复测试脚本
Write-Host "=== 预设功能修复测试 ===" -ForegroundColor Green

# 启动开发服务器
Write-Host "启动开发服务器..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Minimized

# 等待服务器启动
Write-Host "等待服务器启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 打开浏览器
Write-Host "打开浏览器..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host "`n=== 测试步骤 ===" -ForegroundColor Green
Write-Host "1. 点击右下角的'我'按钮" -ForegroundColor White
Write-Host "2. 点击'AI 预设管理'选项" -ForegroundColor White
Write-Host "3. 验证以下修复：" -ForegroundColor White
Write-Host "   - 右上角的'创建'按钮宽度是否合适（移动端优化）" -ForegroundColor Cyan
Write-Host "   - 点击'创建'按钮，在模板标签页中模板是否可以滑动" -ForegroundColor Cyan
Write-Host "   - 创建几个预设并测试编辑功能" -ForegroundColor Cyan
Write-Host "   - 测试预设应用到聊天功能" -ForegroundColor Cyan

Write-Host "`n=== 修复内容 ===" -ForegroundColor Green
Write-Host "✓ 修复了 TypeScript 类型错误" -ForegroundColor Green
Write-Host "✓ 修复了模板无法滑动的问题" -ForegroundColor Green
Write-Host "✓ 优化了创建按钮的移动端宽度" -ForegroundColor Green
Write-Host "✓ 修复了 npm run build 错误" -ForegroundColor Green

Write-Host "`n测试完成后按任意键关闭服务器..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 关闭开发服务器
Write-Host "关闭开发服务器..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force

Write-Host "测试完成！" -ForegroundColor Green 