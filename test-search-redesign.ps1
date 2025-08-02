# 测试搜索框重新设计
Write-Host "开始测试搜索框重新设计..." -ForegroundColor Green

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
Write-Host "2. 观察新的搜索框设计：" -ForegroundColor White
Write-Host "   - 圆角设计，更现代的外观" -ForegroundColor Gray
Write-Host "   - 搜索图标在左侧" -ForegroundColor Gray
Write-Host "   - 简洁的占位符文字" -ForegroundColor Gray
Write-Host "   - 紧贴header和用户列表" -ForegroundColor Gray
Write-Host "3. 测试搜索功能：" -ForegroundColor White
Write-Host "   - 输入文字，观察清除按钮" -ForegroundColor Gray
Write-Host "   - 点击清除按钮，验证功能" -ForegroundColor Gray
Write-Host "   - 测试搜索结果的显示" -ForegroundColor Gray
Write-Host "4. 测试响应式设计：" -ForegroundColor White
Write-Host "   - 调整浏览器窗口大小" -ForegroundColor Gray
Write-Host "   - 观察移动端显示效果" -ForegroundColor Gray

Write-Host "`n重新设计特点：" -ForegroundColor Cyan
Write-Host "- 更简洁的圆角设计" -ForegroundColor White
Write-Host "- 添加搜索图标" -ForegroundColor White
Write-Host "- 减少内边距，紧贴布局" -ForegroundColor White
Write-Host "- 优化移动端显示" -ForegroundColor White
Write-Host "- 保持主题兼容性" -ForegroundColor White

Write-Host "`n测试完成后按任意键关闭服务器..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# 关闭开发服务器
Write-Host "关闭开发服务器..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force

Write-Host "测试完成！" -ForegroundColor Green 