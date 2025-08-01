Write-Host "🔧 单聊记忆管理器修复验证" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 检查关键修改
$files = @(
    @{File="ChatListPage.tsx"; Pattern="allChats = chats"},
    @{File="ChatInterface.tsx"; Pattern="allChats\?: ChatItem"},
    @{File="SingleChatMemoryManager.tsx"; Pattern="检测到的群聊数量"}
)

foreach ($file in $files) {
    $path = "src/app/components/qq/$($file.File)"
    if ($file.File -eq "SingleChatMemoryManager.tsx") {
        $path = "src/app/components/qq/memory/$($file.File)"
    }
    
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        if ($content -match $file.Pattern) {
            Write-Host "✅ $($file.File) - 修复已应用" -ForegroundColor Green
        } else {
            Write-Host "❌ $($file.File) - 修复未应用" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ $($file.File) - 文件不存在" -ForegroundColor Red
    }
}

Write-Host "`n🚀 修复验证完成！" -ForegroundColor Green
Write-Host "现在重新测试单聊记忆管理器功能。" -ForegroundColor Yellow 