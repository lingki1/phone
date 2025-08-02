# 测试底部导航特殊效果
Write-Host "开始测试底部导航特殊效果..." -ForegroundColor Green

# 启动开发服务器
Write-Host "启动开发服务器..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Minimized

# 等待服务器启动
Write-Host "等待服务器启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 打开浏览器
Write-Host "打开浏览器测试..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host "测试步骤：" -ForegroundColor Cyan
Write-Host "1. 点击QQ应用图标进入聊天界面" -ForegroundColor White
Write-Host "2. 观察底部导航的默认状态" -ForegroundColor White
Write-Host "3. 悬停在不同导航项上，观察悬停效果" -ForegroundColor White
Write-Host "4. 点击'我'按钮，观察激活状态的特殊效果：" -ForegroundColor White
Write-Host "   - 图标缩放和旋转动画" -ForegroundColor Gray
Write-Host "   - 文字发光效果" -ForegroundColor Gray
Write-Host "   - 底部指示条" -ForegroundColor Gray
Write-Host "   - 阴影和发光效果" -ForegroundColor Gray
Write-Host "   - 涟漪点击效果" -ForegroundColor Gray
Write-Host "5. 点击其他导航项，观察切换动画" -ForegroundColor White
Write-Host "6. 测试多次点击，确保效果稳定" -ForegroundColor White

Write-Host "`n新增的特殊效果：" -ForegroundColor Cyan
Write-Host "- 悬停时的上移和阴影效果" -ForegroundColor White
Write-Host "- 激活状态的图标脉冲动画" -ForegroundColor White
Write-Host "- 激活状态的图标轻微旋转" -ForegroundColor White
Write-Host "- 文字发光动画效果" -ForegroundColor White
Write-Host "- 底部彩色指示条" -ForegroundColor White
Write-Host "- 点击涟漪效果" -ForegroundColor White
Write-Host "- 渐变背景和发光效果" -ForegroundColor White

Write-Host "`n测试完成后按任意键关闭服务器..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 关闭开发服务器
Write-Host "关闭开发服务器..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force

Write-Host "测试完成！" -ForegroundColor Green 