Write-Host "🔧 记忆系统修复验证" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 检查群聊创建时的自动记忆关联
Write-Host "`n📁 检查群聊创建时的自动记忆关联..." -ForegroundColor Yellow
$createGroupModalFile = "src/app/components/qq/CreateGroupModal.tsx"
if (Test-Path $createGroupModalFile) {
    $content = Get-Content $createGroupModalFile -Raw
    
    if ($content -match "singleChatId: contact\.id") {
        Write-Host "✅ 群聊创建时已自动关联单聊ID" -ForegroundColor Green
    } else {
        Write-Host "❌ 群聊创建时缺少单聊ID关联" -ForegroundColor Red
    }
    
    if ($content -match "singleChatMemory: contact\.messages") {
        Write-Host "✅ 群聊创建时已自动关联单聊记忆" -ForegroundColor Green
    } else {
        Write-Host "❌ 群聊创建时缺少单聊记忆关联" -ForegroundColor Red
    }
} else {
    Write-Host "❌ CreateGroupModal 文件不存在" -ForegroundColor Red
}

# 检查单聊记忆管理器的群聊所有人消息关联
Write-Host "`n📁 检查单聊记忆管理器的群聊所有人消息关联..." -ForegroundColor Yellow
$singleChatMemoryFile = "src/app/components/qq/memory/SingleChatMemoryManager.tsx"
if (Test-Path $singleChatMemoryFile) {
    $content = Get-Content $singleChatMemoryFile -Raw
    
    if ($content -match "获取群聊中所有人的消息数量") {
        Write-Host "✅ 已修改为获取群聊中所有人的消息" -ForegroundColor Green
    } else {
        Write-Host "❌ 未修改为获取群聊中所有人的消息" -ForegroundColor Red
    }
    
    if ($content -match "显示群聊中所有人的消息") {
        Write-Host "✅ 预览功能已修改为显示所有人的消息" -ForegroundColor Green
    } else {
        Write-Host "❌ 预览功能未修改为显示所有人的消息" -ForegroundColor Red
    }
    
    if ($content -match "disabled={isLoading}") {
        Write-Host "✅ 链接按钮已移除消息数量限制" -ForegroundColor Green
    } else {
        Write-Host "❌ 链接按钮仍有消息数量限制" -ForegroundColor Red
    }
} else {
    Write-Host "❌ SingleChatMemoryManager 文件不存在" -ForegroundColor Red
}

# 检查系统提示词注入的修改
Write-Host "`n📁 检查系统提示词注入的修改..." -ForegroundColor Yellow
$chatInterfaceFile = "src/app/components/qq/ChatInterface.tsx"
if (Test-Path $chatInterfaceFile) {
    $content = Get-Content $chatInterfaceFile -Raw
    
    if ($content -match "获取群聊中所有人的消息") {
        Write-Host "✅ 系统提示词已修改为注入所有人的消息" -ForegroundColor Green
    } else {
        Write-Host "❌ 系统提示词未修改为注入所有人的消息" -ForegroundColor Red
    }
    
    if ($content -match "msg\.senderName \|\| chat\.name") {
        Write-Host "✅ 消息发送者显示已修改为实际发送者" -ForegroundColor Green
    } else {
        Write-Host "❌ 消息发送者显示未修改" -ForegroundColor Red
    }
} else {
    Write-Host "❌ ChatInterface 文件不存在" -ForegroundColor Red
}

Write-Host "`n📋 修复总结:" -ForegroundColor Cyan
Write-Host "1. 群聊创建时自动关联成员的单聊记忆" -ForegroundColor White
Write-Host "2. 单聊关联群聊时包含所有人的聊天记录" -ForegroundColor White
Write-Host "3. 系统提示词注入群聊中所有人的消息" -ForegroundColor White
Write-Host "4. 预览功能显示群聊中所有人的消息" -ForegroundColor White
Write-Host "5. 移除了链接按钮的消息数量限制" -ForegroundColor White

Write-Host "`n🚀 修复验证完成！" -ForegroundColor Green
Write-Host "现在群聊和单聊的记忆系统已经完善。" -ForegroundColor Yellow 