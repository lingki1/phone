# 电池功能测试脚本
Write-Host "🔋 开始测试电池功能..." -ForegroundColor Green

# 检查当前目录
Write-Host "当前工作目录: $(Get-Location)" -ForegroundColor Yellow

# 检查package.json是否存在
if (Test-Path "package.json") {
    Write-Host "✅ 找到 package.json" -ForegroundColor Green
    
    # 读取package.json
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "项目名称: $($packageJson.name)" -ForegroundColor Cyan
    Write-Host "版本: $($packageJson.version)" -ForegroundColor Cyan
} else {
    Write-Host "❌ 未找到 package.json" -ForegroundColor Red
    exit 1
}

# 检查DesktopPage.tsx文件
if (Test-Path "src/app/components/DesktopPage.tsx") {
    Write-Host "✅ 找到 DesktopPage.tsx" -ForegroundColor Green
    
    # 检查电池相关代码
    $desktopPageContent = Get-Content "src/app/components/DesktopPage.tsx" -Raw
    
    # 检查关键功能
    $checks = @{
        "电池API接口定义" = $desktopPageContent -match "interface BatteryManager"
        "getBattery方法" = $desktopPageContent -match "getBattery"
        "电池状态监听" = $desktopPageContent -match "levelchange|chargingchange"
        "移动设备检测" = $desktopPageContent -match "isMobileDevice"
        "页面可见性监听" = $desktopPageContent -match "visibilitychange"
        "电池图标函数" = $desktopPageContent -match "getBatteryIcon"
    }
    
    Write-Host "`n🔍 电池功能检查结果:" -ForegroundColor Yellow
    foreach ($check in $checks.GetEnumerator()) {
        if ($check.Value) {
            Write-Host "✅ $($check.Key)" -ForegroundColor Green
        } else {
            Write-Host "❌ $($check.Key)" -ForegroundColor Red
        }
    }
    
} else {
    Write-Host "❌ 未找到 DesktopPage.tsx" -ForegroundColor Red
    exit 1
}

# 启动开发服务器
Write-Host "`n🚀 启动开发服务器..." -ForegroundColor Green
Write-Host "请在浏览器中打开 http://localhost:3000 测试电池功能" -ForegroundColor Cyan
Write-Host "在移动设备上测试时，请确保:" -ForegroundColor Yellow
Write-Host "1. 设备支持电池API" -ForegroundColor White
Write-Host "2. 浏览器允许访问电池信息" -ForegroundColor White
Write-Host "3. 查看控制台日志了解电池状态更新" -ForegroundColor White

# 启动开发服务器
try {
    npm run dev
} catch {
    Write-Host "❌ 启动开发服务器失败: $_" -ForegroundColor Red
    Write-Host "请确保已安装依赖: npm install" -ForegroundColor Yellow
} 