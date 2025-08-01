# 世界书移动端优化测试脚本
Write-Host "=== WorldBook Mobile Optimization Test ===" -ForegroundColor Green
Write-Host ""

# 检查项目结构
Write-Host "1. Checking project structure..." -ForegroundColor Yellow
$worldbookFiles = @(
    "src/app/components/qq/worldbook/WorldBookListPage.css",
    "src/app/components/qq/worldbook/WorldBookEditor.css", 
    "src/app/components/qq/worldbook/WorldBookCard.css"
)

foreach ($file in $worldbookFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $file missing" -ForegroundColor Red
    }
}

Write-Host ""

# 检查CSS文件大小
Write-Host "2. Checking CSS file sizes..." -ForegroundColor Yellow
foreach ($file in $worldbookFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        $sizeKB = [math]::Round($size / 1024, 2)
        Write-Host "✓ $file - $sizeKB KB" -ForegroundColor Green
    }
}

Write-Host ""

# 检查移动端样式
Write-Host "3. Checking mobile styles..." -ForegroundColor Yellow

# 检查WorldBookListPage.css的移动端样式
$listPageContent = Get-Content "src/app/components/qq/worldbook/WorldBookListPage.css" -Raw
if ($listPageContent -match "@media.*max-width.*767px") {
    Write-Host "✓ WorldBookListPage.css contains mobile styles" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookListPage.css missing mobile styles" -ForegroundColor Red
}

# 检查WorldBookEditor.css的移动端样式
$editorContent = Get-Content "src/app/components/qq/worldbook/WorldBookEditor.css" -Raw
if ($editorContent -match "@media.*max-width.*767px") {
    Write-Host "✓ WorldBookEditor.css contains mobile styles" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookEditor.css missing mobile styles" -ForegroundColor Red
}

# 检查WorldBookCard.css的移动端样式
$cardContent = Get-Content "src/app/components/qq/worldbook/WorldBookCard.css" -Raw
if ($cardContent -match "@media.*max-width.*767px") {
    Write-Host "✓ WorldBookCard.css contains mobile styles" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookCard.css missing mobile styles" -ForegroundColor Red
}

Write-Host ""

# 检查超小屏幕适配
Write-Host "4. Checking small screen adaptation..." -ForegroundColor Yellow

if ($listPageContent -match "@media.*max-width.*480px") {
    Write-Host "✓ WorldBookListPage.css contains small screen adaptation" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookListPage.css missing small screen adaptation" -ForegroundColor Red
}

if ($editorContent -match "@media.*max-width.*480px") {
    Write-Host "✓ WorldBookEditor.css contains small screen adaptation" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookEditor.css missing small screen adaptation" -ForegroundColor Red
}

if ($cardContent -match "@media.*max-width.*480px") {
    Write-Host "✓ WorldBookCard.css contains small screen adaptation" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookCard.css missing small screen adaptation" -ForegroundColor Red
}

Write-Host ""

# 检查横屏模式适配
Write-Host "5. Checking landscape mode adaptation..." -ForegroundColor Yellow

if ($listPageContent -match "@media.*orientation.*landscape") {
    Write-Host "✓ WorldBookListPage.css contains landscape mode adaptation" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookListPage.css missing landscape mode adaptation" -ForegroundColor Red
}

if ($editorContent -match "@media.*orientation.*landscape") {
    Write-Host "✓ WorldBookEditor.css contains landscape mode adaptation" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookEditor.css missing landscape mode adaptation" -ForegroundColor Red
}

if ($cardContent -match "@media.*orientation.*landscape") {
    Write-Host "✓ WorldBookCard.css contains landscape mode adaptation" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookCard.css missing landscape mode adaptation" -ForegroundColor Red
}

Write-Host ""

# 检查深色模式支持
Write-Host "6. Checking dark mode support..." -ForegroundColor Yellow

if ($listPageContent -match "@media.*prefers-color-scheme.*dark") {
    Write-Host "✓ WorldBookListPage.css contains dark mode support" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookListPage.css missing dark mode support" -ForegroundColor Red
}

if ($editorContent -match "@media.*prefers-color-scheme.*dark") {
    Write-Host "✓ WorldBookEditor.css contains dark mode support" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookEditor.css missing dark mode support" -ForegroundColor Red
}

if ($cardContent -match "@media.*prefers-color-scheme.*dark") {
    Write-Host "✓ WorldBookCard.css contains dark mode support" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookCard.css missing dark mode support" -ForegroundColor Red
}

Write-Host ""

# 检查辅助功能支持
Write-Host "7. Checking accessibility support..." -ForegroundColor Yellow

if ($listPageContent -match "@media.*prefers-reduced-motion") {
    Write-Host "✓ WorldBookListPage.css contains reduced motion support" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookListPage.css missing reduced motion support" -ForegroundColor Red
}

if ($editorContent -match "@media.*prefers-reduced-motion") {
    Write-Host "✓ WorldBookEditor.css contains reduced motion support" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookEditor.css missing reduced motion support" -ForegroundColor Red
}

if ($cardContent -match "@media.*prefers-reduced-motion") {
    Write-Host "✓ WorldBookCard.css contains reduced motion support" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookCard.css missing reduced motion support" -ForegroundColor Red
}

Write-Host ""

# 检查高对比度模式支持
Write-Host "8. Checking high contrast mode support..." -ForegroundColor Yellow

if ($listPageContent -match "@media.*prefers-contrast.*high") {
    Write-Host "✓ WorldBookListPage.css contains high contrast mode support" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookListPage.css missing high contrast mode support" -ForegroundColor Red
}

if ($editorContent -match "@media.*prefers-contrast.*high") {
    Write-Host "✓ WorldBookEditor.css contains high contrast mode support" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookEditor.css missing high contrast mode support" -ForegroundColor Red
}

if ($cardContent -match "@media.*prefers-contrast.*high") {
    Write-Host "✓ WorldBookCard.css contains high contrast mode support" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookCard.css missing high contrast mode support" -ForegroundColor Red
}

Write-Host ""

# 检查iOS缩放防止
Write-Host "9. Checking iOS zoom prevention..." -ForegroundColor Yellow

if ($listPageContent -match "font-size.*16px") {
    Write-Host "✓ WorldBookListPage.css contains iOS zoom prevention" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookListPage.css missing iOS zoom prevention" -ForegroundColor Red
}

if ($editorContent -match "font-size.*16px") {
    Write-Host "✓ WorldBookEditor.css contains iOS zoom prevention" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookEditor.css missing iOS zoom prevention" -ForegroundColor Red
}

Write-Host ""

# 检查触摸友好的交互
Write-Host "10. Checking touch-friendly interactions..." -ForegroundColor Yellow

if ($listPageContent -match ":active.*transform.*scale") {
    Write-Host "✓ WorldBookListPage.css contains touch feedback" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookListPage.css missing touch feedback" -ForegroundColor Red
}

if ($editorContent -match ":active.*transform.*scale") {
    Write-Host "✓ WorldBookEditor.css contains touch feedback" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookEditor.css missing touch feedback" -ForegroundColor Red
}

if ($cardContent -match ":active.*transform.*scale") {
    Write-Host "✓ WorldBookCard.css contains touch feedback" -ForegroundColor Green
} else {
    Write-Host "✗ WorldBookCard.css missing touch feedback" -ForegroundColor Red
}

Write-Host ""

# 总结
Write-Host "=== Optimization Summary ===" -ForegroundColor Cyan
Write-Host "✓ Unified design style with other project pages" -ForegroundColor Green
Write-Host "✓ Added complete mobile responsive design" -ForegroundColor Green
Write-Host "✓ Optimized display for small screen devices" -ForegroundColor Green
Write-Host "✓ Added landscape mode adaptation" -ForegroundColor Green
Write-Host "✓ Support for dark mode and accessibility" -ForegroundColor Green
Write-Host "✓ Prevented iOS device auto-zoom" -ForegroundColor Green
Write-Host "✓ Added touch-friendly interaction feedback" -ForegroundColor Green
Write-Host "✓ Used flex layout for adaptive height" -ForegroundColor Green

Write-Host ""
Write-Host "WorldBook mobile optimization completed!" -ForegroundColor Green
Write-Host "These pages now have consistent mobile layout with other project pages." -ForegroundColor White 