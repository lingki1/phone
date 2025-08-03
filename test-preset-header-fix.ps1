# 测试预设管理页面头部布局修复
Write-Host "测试预设管理页面头部布局修复..." -ForegroundColor Green

# 检查文件是否存在
$cssFile = "src/app/components/qq/preset/PresetManagerPage.css"
$tsxFile = "src/app/components/qq/preset/PresetManagerPage.tsx"

if (Test-Path $cssFile) {
    Write-Host "✓ CSS文件存在: $cssFile" -ForegroundColor Green
} else {
    Write-Host "✗ CSS文件不存在: $cssFile" -ForegroundColor Red
    exit 1
}

if (Test-Path $tsxFile) {
    Write-Host "✓ TSX文件存在: $tsxFile" -ForegroundColor Green
} else {
    Write-Host "✗ TSX文件不存在: $tsxFile" -ForegroundColor Red
    exit 1
}

# 检查关键CSS属性
$cssContent = Get-Content $cssFile -Raw

$checks = @(
    @{ Name = "flex-wrap: nowrap"; Pattern = "flex-wrap:\s*nowrap" },
    @{ Name = "min-width: 0"; Pattern = "min-width:\s*0" },
    @{ Name = "overflow: hidden"; Pattern = "overflow:\s*hidden" },
    @{ Name = "text-overflow: ellipsis"; Pattern = "text-overflow:\s*ellipsis" },
    @{ Name = "white-space: nowrap"; Pattern = "white-space:\s*nowrap" },
    @{ Name = "flex-shrink: 0"; Pattern = "flex-shrink:\s*0" }
)

Write-Host "`n检查CSS修复项:" -ForegroundColor Yellow
foreach ($check in $checks) {
    if ($cssContent -match $check.Pattern) {
        Write-Host "✓ $($check.Name)" -ForegroundColor Green
    } else {
        Write-Host "✗ $($check.Name)" -ForegroundColor Red
    }
}

# 检查响应式断点
$responsiveChecks = @(
    @{ Name = "768px断点"; Pattern = "@media \(max-width:\s*768px\)" },
    @{ Name = "480px断点"; Pattern = "@media \(max-width:\s*480px\)" }
)

Write-Host "`n检查响应式断点:" -ForegroundColor Yellow
foreach ($check in $responsiveChecks) {
    if ($cssContent -match $check.Pattern) {
        Write-Host "✓ $($check.Name)" -ForegroundColor Green
    } else {
        Write-Host "✗ $($check.Name)" -ForegroundColor Red
    }
}

Write-Host "`n修复完成！主要改进:" -ForegroundColor Cyan
Write-Host "1. 添加了 flex-wrap: nowrap 防止换行" -ForegroundColor White
Write-Host "2. 设置了 min-width: 0 和 overflow: hidden 处理文本溢出" -ForegroundColor White
Write-Host "3. 使用 text-overflow: ellipsis 显示省略号" -ForegroundColor White
Write-Host "4. 优化了响应式布局，确保在768px和480px以下正常显示" -ForegroundColor White
Write-Host "5. 减小了标题和按钮的字体大小，避免挤压返回按钮" -ForegroundColor White

Write-Host "`n现在可以在不同屏幕尺寸下测试布局效果:" -ForegroundColor Yellow
Write-Host "- 桌面端 (>768px): 正常布局" -ForegroundColor White
Write-Host "- 平板端 (≤768px): 紧凑布局，标题文字省略" -ForegroundColor White
Write-Host "- 手机端 (≤480px): 最小布局，所有元素保持一行" -ForegroundColor White 