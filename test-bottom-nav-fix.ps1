# 测试底部导航切换修复
Write-Host "开始测试底部导航切换修复..." -ForegroundColor Green

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
Write-Host "2. 点击底部导航的'我'按钮" -ForegroundColor White
Write-Host "3. 在'我'页面中点击任意设置项" -ForegroundColor White
Write-Host "4. 返回主界面" -ForegroundColor White
Write-Host "5. 再次点击'我'按钮 - 应该能正常切换" -ForegroundColor White
Write-Host "6. 重复测试多次，确保没有卡住" -ForegroundColor White

Write-Host "`n修复内容：" -ForegroundColor Cyan
Write-Host "- 在 handleViewChange 中添加重复点击检查" -ForegroundColor White
Write-Host "- 优化 PageTransitionManager 的状态管理" -ForegroundColor White
Write-Host "- 改进 PageTransition 的动画时机" -ForegroundColor White

Write-Host "`n测试完成后按任意键关闭服务器..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 关闭开发服务器
Write-Host "关闭开发服务器..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force

Write-Host "测试完成！" -ForegroundColor Green 