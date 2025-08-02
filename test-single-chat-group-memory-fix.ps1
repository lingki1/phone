# 测试单聊群聊记忆修复
Write-Host "=== 测试单聊群聊记忆修复 ===" -ForegroundColor Green

# 启动开发服务器
Write-Host "启动开发服务器..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Minimized

# 等待服务器启动
Write-Host "等待服务器启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 打开浏览器
Write-Host "打开浏览器..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host "`n=== 测试步骤 ===" -ForegroundColor Cyan
Write-Host "1. 创建一个群聊" -ForegroundColor White
Write-Host "2. 在群聊中发送一些消息" -ForegroundColor White
Write-Host "3. 创建一个单聊角色" -ForegroundColor White
Write-Host "4. 在单聊设置中关联群聊记忆" -ForegroundColor White
Write-Host "5. 在单聊中发送消息，检查AI是否知道群聊内容" -ForegroundColor White
Write-Host "6. 查看浏览器控制台的调试信息" -ForegroundColor White

Write-Host "`n=== 预期结果 ===" -ForegroundColor Cyan
Write-Host "✓ AI应该能够引用群聊中的对话内容" -ForegroundColor Green
Write-Host "✓ 控制台应该显示群聊记忆构建的调试信息" -ForegroundColor Green
Write-Host "✓ AI的回复应该体现群聊中的关系和互动" -ForegroundColor Green

Write-Host "`n测试完成后按任意键关闭服务器..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 关闭开发服务器
Write-Host "关闭开发服务器..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

Write-Host "测试完成！" -ForegroundColor Green 