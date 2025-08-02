# 页面切换动画测试脚本
Write-Host "🚀 启动页面切换动画测试..." -ForegroundColor Green

# 检查Node.js是否安装
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 错误：未找到Node.js，请先安装Node.js" -ForegroundColor Red
    exit 1
}

# 检查npm是否安装
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 错误：未找到npm，请先安装npm" -ForegroundColor Red
    exit 1
}

# 检查是否在正确的目录
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 错误：请在项目根目录运行此脚本" -ForegroundColor Red
    exit 1
}

Write-Host "📦 安装依赖..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 依赖安装失败" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 启动开发服务器..." -ForegroundColor Yellow
Write-Host "🌐 页面切换动画功能已集成到应用中：" -ForegroundColor Cyan
Write-Host "   • 主页面之间的切换（桌面 ↔ 聊天 ↔ 购物）" -ForegroundColor White
Write-Host "   • 聊天应用内部页面切换（列表 ↔ 聊天 ↔ 我的页面 ↔ 世界书）" -ForegroundColor White
Write-Host "   • 我的页面内部切换（主页 ↔ 配色设置）" -ForegroundColor White
Write-Host ""
Write-Host "🎨 可用的动画效果：" -ForegroundColor Cyan
Write-Host "   • fade - 淡入淡出" -ForegroundColor White
Write-Host "   • slide-fade-left/right - 滑动+淡入（左右）" -ForegroundColor White
Write-Host "   • slide-fade-up/down - 滑动+淡入（上下）" -ForegroundColor White
Write-Host "   • scale - 缩放效果" -ForegroundColor White
Write-Host "   • bounce - 弹性效果" -ForegroundColor White
Write-Host "   • flip - 翻转效果" -ForegroundColor White
Write-Host "   • 3d-left/right - 3D滑动效果" -ForegroundColor White
Write-Host ""
Write-Host "🚀 启动开发服务器..." -ForegroundColor Green
Write-Host "📱 请在浏览器中访问 http://localhost:3000 查看效果" -ForegroundColor Cyan
Write-Host "💡 提示：点击头像可以直接跳转到'我的'页面" -ForegroundColor Yellow
Write-Host "💡 提示：在不同页面间切换时会看到流畅的动画效果" -ForegroundColor Yellow
Write-Host ""
Write-Host "按 Ctrl+C 停止服务器" -ForegroundColor Gray

# 启动开发服务器
npm run dev 