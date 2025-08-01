# 输入框自动高度调整功能测试脚本
Write-Host "📝 开始测试输入框自动高度调整功能..." -ForegroundColor Green

# 检查当前目录
Write-Host "当前工作目录: $(Get-Location)" -ForegroundColor Yellow

# 检查ChatInterface.tsx文件
if (Test-Path "src/app/components/qq/ChatInterface.tsx") {
    Write-Host "✅ 找到 ChatInterface.tsx" -ForegroundColor Green
    
    # 检查输入框相关代码
    $chatInterfaceContent = Get-Content "src/app/components/qq/ChatInterface.tsx" -Raw
    
    # 检查关键功能
    $checks = @{
        "自动高度调整函数" = $chatInterfaceContent -match "adjustTextareaHeight"
        "输入变化时调用高度调整" = $chatInterfaceContent -match "adjustTextareaHeight\\(\\)"
        "textarea样式设置" = $chatInterfaceContent -match "resize.*none"
        "最小最大高度限制" = $chatInterfaceContent -match "minHeight.*maxHeight"
        "初始化高度调整" = $chatInterfaceContent -match "useEffect.*adjustTextareaHeight"
    }
    
    Write-Host "`n🔍 输入框自动高度调整功能检查结果:" -ForegroundColor Yellow
    foreach ($check in $checks.GetEnumerator()) {
        if ($check.Value) {
            Write-Host "✅ $($check.Key)" -ForegroundColor Green
        } else {
            Write-Host "❌ $($check.Key)" -ForegroundColor Red
        }
    }
    
    # 检查具体的实现细节
    Write-Host "`n📋 实现细节检查:" -ForegroundColor Cyan
    
    if ($chatInterfaceContent -match "const adjustTextareaHeight = \\(\\) =>") {
        Write-Host "✅ 找到 adjustTextareaHeight 函数定义" -ForegroundColor Green
    } else {
        Write-Host "❌ 未找到 adjustTextareaHeight 函数定义" -ForegroundColor Red
    }
    
    if ($chatInterfaceContent -match "textarea\.style\.height = 'auto'") {
        Write-Host "✅ 找到高度重置逻辑" -ForegroundColor Green
    } else {
        Write-Host "❌ 未找到高度重置逻辑" -ForegroundColor Red
    }
    
    if ($chatInterfaceContent -match "Math\.min.*Math\.max.*scrollHeight") {
        Write-Host "✅ 找到高度计算逻辑" -ForegroundColor Green
    } else {
        Write-Host "❌ 未找到高度计算逻辑" -ForegroundColor Red
    }
    
} else {
    Write-Host "❌ 未找到 ChatInterface.tsx" -ForegroundColor Red
    exit 1
}

# 启动开发服务器
Write-Host "`n🚀 启动开发服务器..." -ForegroundColor Green
Write-Host "请在浏览器中打开 http://localhost:3000 测试输入框自动高度调整功能" -ForegroundColor Cyan
Write-Host "测试步骤:" -ForegroundColor Yellow
Write-Host "1. 打开任意聊天界面" -ForegroundColor White
Write-Host "2. 在输入框中输入单行文本，观察高度" -ForegroundColor White
Write-Host "3. 按 Shift+Enter 换行，观察输入框是否自动增高" -ForegroundColor White
Write-Host "4. 继续输入多行文本，观察最大高度限制" -ForegroundColor White
Write-Host "5. 发送消息后，观察输入框是否重置到初始高度" -ForegroundColor White
Write-Host "6. 测试@提及功能后输入框高度是否正确调整" -ForegroundColor White

# 启动开发服务器
try {
    npm run dev
} catch {
    Write-Host "❌ 启动开发服务器失败: $_" -ForegroundColor Red
    Write-Host "请确保已安装依赖: npm install" -ForegroundColor Yellow
} 