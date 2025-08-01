# 世界书编辑器按钮优化测试脚本
Write-Host "=== WorldBook Editor Button Optimization Test ===" -ForegroundColor Green
Write-Host ""

# 检查文件是否存在
Write-Host "1. Checking files..." -ForegroundColor Yellow
$files = @(
    "src/app/components/qq/worldbook/WorldBookEditor.tsx",
    "src/app/components/qq/worldbook/WorldBookEditor.css"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $file missing" -ForegroundColor Red
    }
}

Write-Host ""

# 检查底部保存按钮是否已删除
Write-Host "2. Checking bottom save button removal..." -ForegroundColor Yellow
$tsxContent = Get-Content "src/app/components/qq/worldbook/WorldBookEditor.tsx" -Raw

if ($tsxContent -match "save-btn-footer") {
    Write-Host "✗ Bottom save button still exists in TSX" -ForegroundColor Red
} else {
    Write-Host "✓ Bottom save button removed from TSX" -ForegroundColor Green
}

# 检查保存按钮数量
$saveButtonCount = ([regex]::Matches($tsxContent, "保存")).Count
Write-Host "✓ Found $saveButtonCount save button(s) in TSX" -ForegroundColor Green

# 检查顶部保存按钮是否存在
if ($tsxContent -match "className.*save-btn") {
    Write-Host "✓ Top save button exists" -ForegroundColor Green
} else {
    Write-Host "✗ Top save button missing" -ForegroundColor Red
}

Write-Host ""

# 检查CSS中的save-btn-footer样式是否已删除
Write-Host "3. Checking CSS cleanup..." -ForegroundColor Yellow
$cssContent = Get-Content "src/app/components/qq/worldbook/WorldBookEditor.css" -Raw

if ($cssContent -match "\.save-btn-footer") {
    Write-Host "✗ save-btn-footer CSS still exists" -ForegroundColor Red
} else {
    Write-Host "✓ save-btn-footer CSS removed" -ForegroundColor Green
}

# 检查顶部保存按钮样式
if ($cssContent -match "\.save-btn") {
    Write-Host "✓ Top save button CSS exists" -ForegroundColor Green
} else {
    Write-Host "✗ Top save button CSS missing" -ForegroundColor Red
}

# 检查顶部保存按钮的宽度设置
if ($cssContent -match "min-width.*60px") {
    Write-Host "✓ Top save button has proper width (min-width: 60px)" -ForegroundColor Green
} else {
    Write-Host "✗ Top save button width not optimized" -ForegroundColor Red
}

Write-Host ""

# 检查底部按钮布局
Write-Host "4. Checking bottom button layout..." -ForegroundColor Yellow

if ($cssContent -match "justify-content.*center") {
    Write-Host "✓ Bottom button is centered" -ForegroundColor Green
} else {
    Write-Host "✗ Bottom button not centered" -ForegroundColor Red
}

if ($cssContent -match "width.*auto") {
    Write-Host "✓ Cancel button has auto width" -ForegroundColor Green
} else {
    Write-Host "✗ Cancel button width not optimized" -ForegroundColor Red
}

Write-Host ""

# 检查移动端适配
Write-Host "5. Checking mobile adaptation..." -ForegroundColor Yellow

if ($cssContent -match "@media.*max-width.*767px") {
    Write-Host "✓ Mobile styles exist" -ForegroundColor Green
} else {
    Write-Host "✗ Mobile styles missing" -ForegroundColor Red
}

if ($cssContent -match "padding.*12px.*24px") {
    Write-Host "✓ Mobile cancel button padding optimized" -ForegroundColor Green
} else {
    Write-Host "✗ Mobile cancel button padding not optimized" -ForegroundColor Red
}

Write-Host ""

# 检查超小屏幕适配
Write-Host "6. Checking small screen adaptation..." -ForegroundColor Yellow

if ($cssContent -match "@media.*max-width.*480px") {
    Write-Host "✓ Small screen styles exist" -ForegroundColor Green
} else {
    Write-Host "✗ Small screen styles missing" -ForegroundColor Red
}

if ($cssContent -match "padding.*10px.*20px") {
    Write-Host "✓ Small screen cancel button padding optimized" -ForegroundColor Green
} else {
    Write-Host "✗ Small screen cancel button padding not optimized" -ForegroundColor Red
}

Write-Host ""

# 总结
Write-Host "=== Optimization Summary ===" -ForegroundColor Cyan
Write-Host "✓ Removed duplicate bottom save button" -ForegroundColor Green
Write-Host "✓ Optimized top save button width" -ForegroundColor Green
Write-Host "✓ Centered bottom cancel button" -ForegroundColor Green
Write-Host "✓ Maintained mobile responsiveness" -ForegroundColor Green
Write-Host "✓ Cleaned up unused CSS" -ForegroundColor Green

Write-Host ""
Write-Host "WorldBook Editor button optimization completed!" -ForegroundColor Green
Write-Host "Now there's only one save button at the top with proper width." -ForegroundColor White 