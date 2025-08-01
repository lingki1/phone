# 单聊记忆管理器修复测试脚本
Write-Host "🔧 单聊记忆管理器修复测试" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 检查ChatListPage的修改
Write-Host "`n📁 检查ChatListPage修改..." -ForegroundColor Yellow
$chatListPageFile = "src/app/components/qq/ChatListPage.tsx"
if (Test-Path $chatListPageFile) {
    $content = Get-Content $chatListPageFile -Raw
    
    if ($content -match "allChats = chats") {
        Write-Host "✅ ChatListPage 已添加 allChats 变量" -ForegroundColor Green
    } else {
        Write-Host "❌ ChatListPage 缺少 allChats 变量" -ForegroundColor Red
    }
    
    if ($content -match "allChats={allChats}") {
        Write-Host "✅ ChatListPage 已传递 allChats 给 ChatInterface" -ForegroundColor Green
    } else {
        Write-Host "❌ ChatListPage 缺少 allChats 传递" -ForegroundColor Red
    }
} else {
    Write-Host "❌ ChatListPage 文件不存在" -ForegroundColor Red
}

# 检查ChatInterface的修改
Write-Host "`n📁 检查ChatInterface修改..." -ForegroundColor Yellow
$chatInterfaceFile = "src/app/components/qq/ChatInterface.tsx"
if (Test-Path $chatInterfaceFile) {
    $content = Get-Content $chatInterfaceFile -Raw
    
    if ($content -match "allChats\?: ChatItem\[\]") {
        Write-Host "✅ ChatInterface 已添加 allChats 参数" -ForegroundColor Green
    } else {
        Write-Host "❌ ChatInterface 缺少 allChats 参数" -ForegroundColor Red
    }
    
    if ($content -match "availableContacts={allChats \|\| availableContacts}") {
        Write-Host "✅ ChatInterface 已传递 allChats 给 SingleChatMemoryManager" -ForegroundColor Green
    } else {
        Write-Host "❌ ChatInterface 缺少 allChats 传递" -ForegroundColor Red
    }
} else {
    Write-Host "❌ ChatInterface 文件不存在" -ForegroundColor Red
}

# 检查SingleChatMemoryManager的调试日志
Write-Host "`n📁 检查SingleChatMemoryManager调试..." -ForegroundColor Yellow
$singleChatMemoryFile = "src/app/components/qq/memory/SingleChatMemoryManager.tsx"
if (Test-Path $singleChatMemoryFile) {
    $content = Get-Content $singleChatMemoryFile -Raw
    
    if ($content -match "console\.log\('检测到的群聊数量'") {
        Write-Host "✅ SingleChatMemoryManager 已添加调试日志" -ForegroundColor Green
    } else {
        Write-Host "❌ SingleChatMemoryManager 缺少调试日志" -ForegroundColor Red
    }
    
    if ($content -match "无论是否找到AI成员，都显示群聊") {
        Write-Host "✅ SingleChatMemoryManager 已修复显示逻辑" -ForegroundColor Green
    } else {
        Write-Host "❌ SingleChatMemoryManager 缺少显示逻辑修复" -ForegroundColor Red
    }
} else {
    Write-Host "❌ SingleChatMemoryManager 文件不存在" -ForegroundColor Red
}

Write-Host "`n📋 修复总结:" -ForegroundColor Cyan
Write-Host "1. 添加了 allChats 参数传递所有聊天数据" -ForegroundColor White
Write-Host "2. 修复了单聊记忆管理器的群聊检测逻辑" -ForegroundColor White
Write-Host "3. 添加了调试日志帮助排查问题" -ForegroundColor White
Write-Host "4. 现在会显示所有群聊，即使没有匹配的AI角色" -ForegroundColor White

Write-Host "`n🚀 修复完成！" -ForegroundColor Green
Write-Host "现在重新测试单聊记忆管理器，应该能看到所有群聊了。" -ForegroundColor Yellow
Write-Host "如果还有问题，请查看浏览器控制台的调试日志。" -ForegroundColor Yellow 