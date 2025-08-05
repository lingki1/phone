# 测试重复调用修复
Write-Host "🚀 启动开发服务器测试重复调用修复..." -ForegroundColor Green

# 启动开发服务器
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Minimized

Write-Host "⏳ 等待服务器启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "📋 测试步骤：" -ForegroundColor Cyan
Write-Host "1. 打开浏览器访问 http://localhost:3000" -ForegroundColor White
Write-Host "2. 进入动态页面" -ForegroundColor White
Write-Host "3. 快速连续点击刷新按钮3-5次" -ForegroundColor White
Write-Host "4. 观察控制台日志，应该只看到一次API调用" -ForegroundColor White
Write-Host "5. 检查是否还有'已有生成任务在进行中'的警告" -ForegroundColor White

Write-Host "🔍 预期结果：" -ForegroundColor Cyan
Write-Host "- 只应该看到一次'🔍 AI动态生成器 - 开始API调用'" -ForegroundColor Green
Write-Host "- 其他点击应该显示'⚠️ 已有生成任务在进行中，跳过本次调用'" -ForegroundColor Green
Write-Host "- 不应该看到多次API请求" -ForegroundColor Green

Write-Host "📝 注意事项：" -ForegroundColor Yellow
Write-Host "- 确保API配置正确" -ForegroundColor White
Write-Host "- 观察API响应内容是否为空" -ForegroundColor White
Write-Host "- 如果API响应为空，检查模型配置" -ForegroundColor White

Write-Host "⏹️  测试完成后按任意键停止服务器..." -ForegroundColor Red
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 停止开发服务器
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force
Write-Host "✅ 测试完成，服务器已停止" -ForegroundColor Green 