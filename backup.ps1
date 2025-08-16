# PowerShell 数据备份脚本
# 用于备份聊天室JSON数据和其他重要文件

param(
    [string]$BackupPath = "backup"
)

# 创建带时间戳的备份目录
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = Join-Path $BackupPath $timestamp

Write-Host "开始备份数据..." -ForegroundColor Green
Write-Host "备份目录: $backupDir" -ForegroundColor Yellow

try {
    # 创建备份目录
    if (!(Test-Path $BackupPath)) {
        New-Item -ItemType Directory -Path $BackupPath -Force
        Write-Host "创建备份根目录: $BackupPath" -ForegroundColor Blue
    }
    
    New-Item -ItemType Directory -Path $backupDir -Force
    
    # 备份data目录（包含聊天室JSON文件）
    if (Test-Path "data") {
        Copy-Item -Path "data" -Destination $backupDir -Recurse -Force
        Write-Host "✅ 数据目录备份完成" -ForegroundColor Green
        
        # 显示备份的文件
        $dataFiles = Get-ChildItem -Path "$backupDir/data" -File
        Write-Host "备份的数据文件:" -ForegroundColor Cyan
        foreach ($file in $dataFiles) {
            Write-Host "  - $($file.Name) ($([math]::Round($file.Length/1KB, 2)) KB)" -ForegroundColor White
        }
    } else {
        Write-Host "⚠️  data目录不存在" -ForegroundColor Yellow
    }
    
    # 备份logs目录（如果存在）
    if (Test-Path "logs") {
        Copy-Item -Path "logs" -Destination $backupDir -Recurse -Force
        Write-Host "✅ 日志目录备份完成" -ForegroundColor Green
    }
    
    # 备份配置文件
    $configFiles = @("docker-compose.simple.yml", "package.json", ".env")
    foreach ($configFile in $configFiles) {
        if (Test-Path $configFile) {
            Copy-Item -Path $configFile -Destination $backupDir -Force
            Write-Host "✅ 配置文件 $configFile 备份完成" -ForegroundColor Green
        }
    }
    
    Write-Host "`n🎉 备份完成！" -ForegroundColor Green
    Write-Host "备份位置: $backupDir" -ForegroundColor Yellow
    
    # 清理7天前的备份
    Write-Host "`n清理旧备份..." -ForegroundColor Blue
    $cutoffDate = (Get-Date).AddDays(-7)
    $oldBackups = Get-ChildItem -Path $BackupPath -Directory | Where-Object { $_.CreationTime -lt $cutoffDate }
    
    if ($oldBackups.Count -gt 0) {
        foreach ($oldBackup in $oldBackups) {
            Remove-Item -Path $oldBackup.FullName -Recurse -Force
            Write-Host "🗑️  删除旧备份: $($oldBackup.Name)" -ForegroundColor Gray
        }
        Write-Host "清理完成，删除了 $($oldBackups.Count) 个旧备份" -ForegroundColor Blue
    } else {
        Write-Host "没有需要清理的旧备份" -ForegroundColor Blue
    }
    
} catch {
    Write-Host "❌ 备份失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 备份摘要:" -ForegroundColor Cyan
Write-Host "  备份时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "  备份路径: $backupDir" -ForegroundColor White

if (Test-Path "$backupDir/data") {
    $backupSize = (Get-ChildItem -Path "$backupDir/data" -Recurse -File | Measure-Object -Property Length -Sum).Sum
    Write-Host "  数据大小: $([math]::Round($backupSize/1KB, 2)) KB" -ForegroundColor White
}

Write-Host "`n💡 提示:" -ForegroundColor Yellow
Write-Host "  - 运行 './restore.ps1 $timestamp' 可以恢复此备份" -ForegroundColor White
Write-Host "  - 备份文件会自动保留7天" -ForegroundColor White
