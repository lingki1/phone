# 测试用户评论后AI自动回复功能
Write-Host "🧪 测试用户评论后AI自动回复功能" -ForegroundColor Cyan

# 启动开发服务器
Write-Host "🚀 启动开发服务器..." -ForegroundColor Green
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Minimized

# 等待服务器启动
Write-Host "⏳ 等待服务器启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 打开浏览器
Write-Host "🌐 打开浏览器..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host "✅ 测试环境已准备就绪！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 测试步骤：" -ForegroundColor Cyan
Write-Host "1. 在浏览器中打开动态页面" -ForegroundColor White
Write-Host "2. 确保已配置API设置（设置 -> API配置）" -ForegroundColor White
Write-Host "3. 确保AI评论功能已启用（设置 -> 动态设置）" -ForegroundColor White
Write-Host "4. 发布一条动态或选择现有动态" -ForegroundColor White
Write-Host "5. 在动态下方添加评论" -ForegroundColor White
Write-Host "6. 观察是否自动生成AI评论" -ForegroundColor White
Write-Host ""
Write-Host "🔍 检查要点：" -ForegroundColor Cyan
Write-Host "- 用户评论后是否自动触发AI评论生成" -ForegroundColor White
Write-Host "- AI评论是否基于用户评论内容生成回应" -ForegroundColor White
Write-Host "- 评论是否包含@提及功能" -ForegroundColor White
Write-Host "- 评论是否符合AI角色人设" -ForegroundColor White
Write-Host ""
Write-Host "📝 控制台日志关键词：" -ForegroundColor Cyan
Write-Host "- '用户评论后触发AI评论生成'" -ForegroundColor White
Write-Host "- 'AI评论生成成功'" -ForegroundColor White
Write-Host "- 'aiCommentsGenerated事件触发'" -ForegroundColor White
Write-Host ""
Write-Host "按任意键停止测试..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 停止开发服务器
Write-Host "🛑 停止开发服务器..." -ForegroundColor Red
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force

Write-Host "✅ 测试完成！" -ForegroundColor Green 