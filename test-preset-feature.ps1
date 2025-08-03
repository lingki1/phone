# 测试预设功能
Write-Host "🧪 开始测试预设功能..." -ForegroundColor Green

# 启动开发服务器
Write-Host "🚀 启动开发服务器..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow

# 等待服务器启动
Write-Host "⏳ 等待服务器启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 打开浏览器
Write-Host "🌐 打开浏览器..." -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host "✅ 预设功能测试环境已启动！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 测试步骤：" -ForegroundColor Cyan
Write-Host "1. 点击底部导航栏的'我'按钮" -ForegroundColor White
Write-Host "2. 在个人页面中找到'AI 预设管理'选项" -ForegroundColor White
Write-Host "3. 点击进入预设管理页面" -ForegroundColor White
Write-Host "4. 测试以下功能：" -ForegroundColor White
Write-Host "   - 查看默认预设列表" -ForegroundColor White
Write-Host "   - 创建新预设（从模板或自定义）" -ForegroundColor White
Write-Host "   - 编辑预设参数" -ForegroundColor White
Write-Host "   - 设置当前预设" -ForegroundColor White
Write-Host "   - 删除预设" -ForegroundColor White
Write-Host "5. 进入聊天界面，测试预设参数是否生效" -ForegroundColor White
Write-Host ""
Write-Host "🔧 预设参数包括：" -ForegroundColor Cyan
Write-Host "   - 温度 (Temperature): 0-2" -ForegroundColor White
Write-Host "   - 最大令牌数 (Max Tokens): 1-4000" -ForegroundColor White
Write-Host "   - Top P: 0-1" -ForegroundColor White
Write-Host "   - Top K: 可选" -ForegroundColor White
Write-Host "   - 频率惩罚 (Frequency Penalty): -2.0 到 2.0" -ForegroundColor White
Write-Host "   - 存在惩罚 (Presence Penalty): -2.0 到 2.0" -ForegroundColor White
Write-Host "   - 响应格式: 文本或JSON" -ForegroundColor White
Write-Host "   - 随机种子: 可选" -ForegroundColor White
Write-Host ""
Write-Host "🎨 主题系统已集成，支持深色主题适配" -ForegroundColor Cyan
Write-Host "📱 响应式设计，支持移动端" -ForegroundColor Cyan
Write-Host "♿ 无障碍设计，支持高对比度模式" -ForegroundColor Cyan
Write-Host ""
Write-Host "按 Ctrl+C 停止测试" -ForegroundColor Red 