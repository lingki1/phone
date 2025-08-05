# 测试单动态生成功能
Write-Host "🚀 启动开发服务器测试单动态生成..." -ForegroundColor Green

# 启动开发服务器
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Minimized

Write-Host "⏳ 等待服务器启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "📋 测试步骤：" -ForegroundColor Cyan
Write-Host "1. 打开浏览器访问 http://localhost:3000" -ForegroundColor White
Write-Host "2. 进入动态页面" -ForegroundColor White
Write-Host "3. 点击刷新按钮" -ForegroundColor White
Write-Host "4. 观察是否只生成一个动态" -ForegroundColor White
Write-Host "5. 检查动态内容是否有争议性" -ForegroundColor White

Write-Host "🔍 预期结果：" -ForegroundColor Cyan
Write-Host "- 每次刷新只生成一个动态" -ForegroundColor Green
Write-Host "- 动态内容有争议性，能引发讨论" -ForegroundColor Green
Write-Host "- 自动选择最合适的角色发布" -ForegroundColor Green
Write-Host "- 避免与历史动态重复" -ForegroundColor Green

Write-Host "📝 优化说明：" -ForegroundColor Yellow
Write-Host "- 简化了API调用流程" -ForegroundColor White
Write-Host "- 减少了JSON解析失败的概率" -ForegroundColor White
Write-Host "- 智能选择最适合的角色" -ForegroundColor White
Write-Host "- 生成更有争议性的内容" -ForegroundColor White

Write-Host "⏹️  测试完成后按任意键停止服务器..." -ForegroundColor Red
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 停止开发服务器
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force
Write-Host "✅ 测试完成，服务器已停止" -ForegroundColor Green 