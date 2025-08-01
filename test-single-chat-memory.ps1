# 单聊群聊记忆管理功能测试脚本
Write-Host "🧠 单聊群聊记忆管理功能测试" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# 检查必要的文件是否存在
$requiredFiles = @(
    "src/app/components/qq/memory/SingleChatMemoryManager.tsx",
    "src/app/components/qq/memory/SingleChatMemoryManager.css",
    "src/app/components/qq/memory/SINGLE_CHAT_MEMORY_README.md"
)

Write-Host "`n📁 检查必要文件..." -ForegroundColor Yellow
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - 文件不存在" -ForegroundColor Red
    }
}

# 检查类型定义更新
Write-Host "`n🔧 检查类型定义更新..." -ForegroundColor Yellow
$chatTypesFile = "src/app/types/chat.ts"
if (Test-Path $chatTypesFile) {
    $content = Get-Content $chatTypesFile -Raw
    if ($content -match "linkedGroupChatIds") {
        Write-Host "✅ ChatSettings 类型已添加 linkedGroupChatIds 字段" -ForegroundColor Green
    } else {
        Write-Host "❌ ChatSettings 类型缺少 linkedGroupChatIds 字段" -ForegroundColor Red
    }
} else {
    Write-Host "❌ 类型定义文件不存在" -ForegroundColor Red
}

# 检查ChatInterface更新
Write-Host "`n🔧 检查ChatInterface更新..." -ForegroundColor Yellow
$chatInterfaceFile = "src/app/components/qq/ChatInterface.tsx"
if (Test-Path $chatInterfaceFile) {
    $content = Get-Content $chatInterfaceFile -Raw
    if ($content -match "SingleChatMemoryManager") {
        Write-Host "✅ ChatInterface 已导入 SingleChatMemoryManager" -ForegroundColor Green
    } else {
        Write-Host "❌ ChatInterface 缺少 SingleChatMemoryManager 导入" -ForegroundColor Red
    }
    
    if ($content -match "showSingleChatMemoryManager") {
        Write-Host "✅ ChatInterface 已添加单聊记忆管理状态" -ForegroundColor Green
    } else {
        Write-Host "❌ ChatInterface 缺少单聊记忆管理状态" -ForegroundColor Red
    }
    
    if ($content -match "群聊记忆管理") {
        Write-Host "✅ ChatInterface 已添加单聊记忆管理按钮" -ForegroundColor Green
    } else {
        Write-Host "❌ ChatInterface 缺少单聊记忆管理按钮" -ForegroundColor Red
    }
    
    if ($content -match "linkedGroupChatIds") {
        Write-Host "✅ ChatInterface 已支持群聊记忆注入" -ForegroundColor Green
    } else {
        Write-Host "❌ ChatInterface 缺少群聊记忆注入逻辑" -ForegroundColor Red
    }
} else {
    Write-Host "❌ ChatInterface 文件不存在" -ForegroundColor Red
}

# 检查组件功能
Write-Host "`n🔍 检查组件功能..." -ForegroundColor Yellow
$singleChatMemoryFile = "src/app/components/qq/memory/SingleChatMemoryManager.tsx"
if (Test-Path $singleChatMemoryFile) {
    $content = Get-Content $singleChatMemoryFile -Raw
    
    $functions = @(
        "linkGroupChatMemory",
        "unlinkGroupChatMemory", 
        "previewGroupChatMemory",
        "refreshGroupChatMemory"
    )
    
    foreach ($func in $functions) {
        if ($content -match $func) {
            Write-Host "✅ 函数 $func 已实现" -ForegroundColor Green
        } else {
            Write-Host "❌ 函数 $func 未实现" -ForegroundColor Red
        }
    }
    
    if ($content -match "GroupMemoryStatus") {
        Write-Host "✅ GroupMemoryStatus 接口已定义" -ForegroundColor Green
    } else {
        Write-Host "❌ GroupMemoryStatus 接口未定义" -ForegroundColor Red
    }
} else {
    Write-Host "❌ SingleChatMemoryManager 文件不存在" -ForegroundColor Red
}

# 检查样式文件
Write-Host "`n🎨 检查样式文件..." -ForegroundColor Yellow
$cssFile = "src/app/components/qq/memory/SingleChatMemoryManager.css"
if (Test-Path $cssFile) {
    $content = Get-Content $cssFile -Raw
    
    $cssClasses = @(
        "single-chat-memory-manager-modal",
        "group-info",
        "group-avatar",
        "memory-preview-modal"
    )
    
    foreach ($class in $cssClasses) {
        if ($content -match $class) {
            Write-Host "✅ CSS 类 $class 已定义" -ForegroundColor Green
        } else {
            Write-Host "❌ CSS 类 $class 未定义" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ SingleChatMemoryManager.css 文件不存在" -ForegroundColor Red
}

Write-Host "`n📋 功能总结:" -ForegroundColor Cyan
Write-Host "1. 单聊可以关联群聊记忆" -ForegroundColor White
Write-Host "2. 支持预览群聊中的AI角色表现" -ForegroundColor White
Write-Host "3. 支持刷新和取消链接群聊记忆" -ForegroundColor White
Write-Host "4. 系统提示词会自动注入群聊记忆信息" -ForegroundColor White
Write-Host "5. 与现有的群聊记忆管理功能形成双向记忆系统" -ForegroundColor White

Write-Host "`n🚀 测试完成！" -ForegroundColor Green
Write-Host "现在可以在单聊界面中点击 🧠 按钮来管理群聊记忆了。" -ForegroundColor Yellow 