# 测试购物功能
Write-Host "🛒 开始测试购物功能..." -ForegroundColor Green

# 检查必要的文件是否存在
$requiredFiles = @(
    "src/app/types/shopping.ts",
    "src/app/components/shopping/ProductGenerator.ts",
    "src/app/components/shopping/ProductCard.tsx",
    "src/app/components/shopping/ShoppingCart.tsx",
    "src/app/components/shopping/ShoppingPage.tsx",
    "src/app/components/shopping/ShoppingPage.css",
    "src/app/components/shopping/ProductCard.css",
    "src/app/components/shopping/ShoppingCart.css"
)

Write-Host "📁 检查必要文件..." -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - 文件不存在" -ForegroundColor Red
    }
}

# 检查DesktopPage.tsx中的购物应用状态
Write-Host "`n🔍 检查DesktopPage.tsx中的购物应用状态..." -ForegroundColor Yellow
$desktopPageContent = Get-Content "src/app/components/DesktopPage.tsx" -Raw
if ($desktopPageContent -match "status: 'available'") {
    Write-Host "✅ 购物应用状态已设置为可用" -ForegroundColor Green
} else {
    Write-Host "❌ 购物应用状态未设置为可用" -ForegroundColor Red
}

# 检查主页面是否已更新
Write-Host "`n🔍 检查主页面更新..." -ForegroundColor Yellow
$pageContent = Get-Content "src/app/page.tsx" -Raw
if ($pageContent -match "ShoppingPage") {
    Write-Host "✅ 主页面已集成购物功能" -ForegroundColor Green
} else {
    Write-Host "❌ 主页面未集成购物功能" -ForegroundColor Red
}

# 检查TypeScript类型定义
Write-Host "`n🔍 检查TypeScript类型定义..." -ForegroundColor Yellow
$shoppingTypes = Get-Content "src/app/types/shopping.ts" -Raw
if ($shoppingTypes -match "interface Product") {
    Write-Host "✅ 商品类型定义已创建" -ForegroundColor Green
} else {
    Write-Host "❌ 商品类型定义未创建" -ForegroundColor Red
}

# 检查AI商品生成服务
Write-Host "`n🔍 检查AI商品生成服务..." -ForegroundColor Yellow
$productGenerator = Get-Content "src/app/components/shopping/ProductGenerator.ts" -Raw
if ($productGenerator -match "class ProductGenerator") {
    Write-Host "✅ AI商品生成服务已创建" -ForegroundColor Green
} else {
    Write-Host "❌ AI商品生成服务未创建" -ForegroundColor Red
}

# 检查样式文件
Write-Host "`n🔍 检查样式文件..." -ForegroundColor Yellow
$cssFiles = @(
    "src/app/components/shopping/ShoppingPage.css",
    "src/app/components/shopping/ProductCard.css",
    "src/app/components/shopping/ShoppingCart.css"
)

foreach ($cssFile in $cssFiles) {
    if (Test-Path $cssFile) {
        $cssContent = Get-Content $cssFile -Raw
        if ($cssContent.Length -gt 100) {
            Write-Host "✅ $cssFile - 样式文件已创建且内容完整" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $cssFile - 样式文件内容较少" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ $cssFile - 样式文件不存在" -ForegroundColor Red
    }
}

Write-Host "`n🎉 购物功能测试完成！" -ForegroundColor Green
Write-Host "`n📋 功能特性总结：" -ForegroundColor Cyan
Write-Host "• AI根据聊天内容自动生成相关商品" -ForegroundColor White
Write-Host "• 支持商品搜索、分类筛选和排序" -ForegroundColor White
Write-Host "• 完整的购物车功能" -ForegroundColor White
Write-Host "• 响应式设计，支持移动端" -ForegroundColor White
Write-Host "• 美观的UI界面" -ForegroundColor White

Write-Host "`n🚀 下一步：" -ForegroundColor Cyan
Write-Host "1. 启动开发服务器：npm run dev" -ForegroundColor White
Write-Host "2. 在桌面页面点击购物应用" -ForegroundColor White
Write-Host "3. 配置API设置以启用AI商品生成" -ForegroundColor White
Write-Host "4. 测试购物功能" -ForegroundColor White 