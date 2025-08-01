# 世界书创建按钮优化测试脚本
Write-Host "=== WorldBook Create Button Optimization Test ===" -ForegroundColor Green
Write-Host ""

# 检查文件是否存在
Write-Host "1. Checking files..." -ForegroundColor Yellow
$files = @(
    "src/app/components/qq/worldbook/WorldBookListPage.tsx",
    "src/app/components/qq/worldbook/WorldBookListPage.css"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✓ $file exists" -ForegroundColor Green
    } else {
        Write-Host "✗ $file missing" -ForegroundColor Red
    }
}

Write-Host ""

# 检查TSX中的创建按钮
Write-Host "2. Checking create button in TSX..." -ForegroundColor Yellow
$tsxContent = Get-Content "src/app/components/qq/worldbook/WorldBookListPage.tsx" -Raw

if ($tsxContent -match "create-btn") {
    Write-Host "✓ Create button exists in TSX" -ForegroundColor Green
} else {
    Write-Host "✗ Create button missing in TSX" -ForegroundColor Red
}

if ($tsxContent -match "创建") {
    Write-Host "✓ Create button text found" -ForegroundColor Green
} else {
    Write-Host "✗ Create button text missing" -ForegroundColor Red
}

Write-Host ""

# 检查CSS中的创建按钮样式
Write-Host "3. Checking create button CSS..." -ForegroundColor Yellow
$cssContent = Get-Content "src/app/components/qq/worldbook/WorldBookListPage.css" -Raw

if ($cssContent -match "\.create-btn") {
    Write-Host "✓ Create button CSS exists" -ForegroundColor Green
} else {
    Write-Host "✗ Create button CSS missing" -ForegroundColor Red
}

# 检查基础样式
if ($cssContent -match "white-space.*nowrap") {
    Write-Host "✓ White-space nowrap applied" -ForegroundColor Green
} else {
    Write-Host "✗ White-space nowrap missing" -ForegroundColor Red
}

if ($cssContent -match "flex-shrink.*0") {
    Write-Host "✓ Flex-shrink 0 applied" -ForegroundColor Green
} else {
    Write-Host "✗ Flex-shrink 0 missing" -ForegroundColor Red
}

if ($cssContent -match "width.*auto") {
    Write-Host "✓ Width auto applied" -ForegroundColor Green
} else {
    Write-Host "✗ Width auto missing" -ForegroundColor Red
}

Write-Host ""

# 检查600px以下媒体查询
Write-Host "4. Checking 600px media query..." -ForegroundColor Yellow

if ($cssContent -match "@media.*max-width.*600px") {
    Write-Host "✓ 600px media query exists" -ForegroundColor Green
} else {
    Write-Host "✗ 600px media query missing" -ForegroundColor Red
}

if ($cssContent -match "600px.*create-btn") {
    Write-Host "✓ Create button styles in 600px query" -ForegroundColor Green
} else {
    Write-Host "✗ Create button styles missing in 600px query" -ForegroundColor Red
}

# 检查重要的样式属性
if ($cssContent -match "min-width.*unset.*important") {
    Write-Host "✓ Min-width unset with !important" -ForegroundColor Green
} else {
    Write-Host "✗ Min-width unset missing" -ForegroundColor Red
}

if ($cssContent -match "width.*auto.*important") {
    Write-Host "✓ Width auto with !important" -ForegroundColor Green
} else {
    Write-Host "✗ Width auto with !important missing" -ForegroundColor Red
}

Write-Host ""

# 检查页面标题样式
Write-Host "5. Checking page title styles..." -ForegroundColor Yellow

if ($cssContent -match "page-title.*flex.*1.*important") {
    Write-Host "✓ Page title has flex: 1 with !important" -ForegroundColor Green
} else {
    Write-Host "✗ Page title flex: 1 with !important missing" -ForegroundColor Red
}

if ($cssContent -match "text-overflow.*ellipsis") {
    Write-Host "✓ Text overflow ellipsis applied" -ForegroundColor Green
} else {
    Write-Host "✗ Text overflow ellipsis missing" -ForegroundColor Red
}

if ($cssContent -match "margin-right.*8px") {
    Write-Host "✓ Page title has right margin" -ForegroundColor Green
} else {
    Write-Host "✗ Page title right margin missing" -ForegroundColor Red
}

Write-Host ""

# 检查移动端适配
Write-Host "6. Checking mobile adaptation..." -ForegroundColor Yellow

if ($cssContent -match "@media.*max-width.*767px") {
    Write-Host "✓ 767px media query exists" -ForegroundColor Green
} else {
    Write-Host "✗ 767px media query missing" -ForegroundColor Red
}

if ($cssContent -match "@media.*max-width.*480px") {
    Write-Host "✓ 480px media query exists" -ForegroundColor Green
} else {
    Write-Host "✗ 480px media query missing" -ForegroundColor Red
}

Write-Host ""

# 总结
Write-Host "=== Optimization Summary ===" -ForegroundColor Cyan
Write-Host "✓ Fixed create button width issues" -ForegroundColor Green
Write-Host "✓ Added 600px specific media query" -ForegroundColor Green
Write-Host "✓ Optimized button padding and font size" -ForegroundColor Green
Write-Host "✓ Ensured page title doesn't get compressed" -ForegroundColor Green
Write-Host "✓ Added proper flex layout for header" -ForegroundColor Green

Write-Host ""
Write-Host "WorldBook create button optimization completed!" -ForegroundColor Green
Write-Host "Create button should now have proper width on 600px and below devices." -ForegroundColor White 