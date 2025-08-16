# PowerShell 数据恢复脚本
# 用于恢复聊天室JSON数据和其他重要文件

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupTimestamp,
    [string]$BackupPath = "backup"
)

$backupDir = Join-Path $BackupPath $BackupTimestamp

Write-Host "开始恢复数据..." -ForegroundColor Green
Write-Host "恢复源: $backupDir" -ForegroundColor Yellow

# 检查备份目录是否存在
if (!(Test-Path $backupDir)) {
    Write-Host "❌ 备份目录不存在: $backupDir" -ForegroundColor Red
    Write-Host "`n可用的备份:" -ForegroundColor Cyan
    
    if (Test-Path $BackupPath) {
        $availableBackups = Get-ChildItem -Path $BackupPath -Directory | Sort-Object Name -Descending
        if ($availableBackups.Count -gt 0) {
            foreach ($backup in $availableBackups) {
                $backupTime = $backup.Name
                if ($backupTime -match "(\d{8})_(\d{6})") {
                    $formattedTime = "$($matches[1].Substring(0,4))-$($matches[1].Substring(4,2))-$($matches[1].Substring(6,2)) $($matches[2].Substring(0,2)):$($matches[2].Substring(2,2)):$($matches[2].Substring(4,2))"
                    Write-Host "  - $backupTime ($formattedTime)" -ForegroundColor White
                } else {
                    Write-Host "  - $backupTime" -ForegroundColor White
                }
            }
        } else {
            Write-Host "  没有可用的备份" -ForegroundColor Gray
        }
    } else {
        Write-Host "  备份目录不存在" -ForegroundColor Gray
    }
    
    exit 1
}

try {
    # 停止Docker容器
    Write-Host "`n停止Docker容器..." -ForegroundColor Blue
    $stopResult = docker-compose -f docker-compose.simple.yml down 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 容器已停止" -ForegroundColor Green
    } else {
        Write-Host "⚠️  停止容器时出现警告，继续恢复..." -ForegroundColor Yellow
    }
    
    # 备份当前数据（以防恢复失败）
    $currentBackupDir = "backup/before_restore_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    if (Test-Path "data") {
        Write-Host "`n创建当前数据的安全备份..." -ForegroundColor Blue
        New-Item -ItemType Directory -Path $currentBackupDir -Force | Out-Null
        Copy-Item -Path "data" -Destination $currentBackupDir -Recurse -Force
        Write-Host "✅ 当前数据已备份到: $currentBackupDir" -ForegroundColor Green
    }
    
    # 恢复data目录
    if (Test-Path "$backupDir/data") {
        Write-Host "`n恢复数据目录..." -ForegroundColor Blue
        
        # 如果目标目录存在，先删除
        if (Test-Path "data") {
            Remove-Item -Path "data" -Recurse -Force
        }
        
        # 复制备份数据
        Copy-Item -Path "$backupDir/data" -Destination "." -Recurse -Force
        Write-Host "✅ 数据目录恢复完成" -ForegroundColor Green
        
        # 显示恢复的文件
        $restoredFiles = Get-ChildItem -Path "data" -File
        Write-Host "恢复的数据文件:" -ForegroundColor Cyan
        foreach ($file in $restoredFiles) {
            Write-Host "  - $($file.Name) ($([math]::Round($file.Length/1KB, 2)) KB)" -ForegroundColor White
        }
    } else {
        Write-Host "⚠️  备份中没有data目录" -ForegroundColor Yellow
    }
    
    # 恢复logs目录（如果备份中有）
    if (Test-Path "$backupDir/logs") {
        Write-Host "`n恢复日志目录..." -ForegroundColor Blue
        if (Test-Path "logs") {
            Remove-Item -Path "logs" -Recurse -Force
        }
        Copy-Item -Path "$backupDir/logs" -Destination "." -Recurse -Force
        Write-Host "✅ 日志目录恢复完成" -ForegroundColor Green
    }
    
    # 确保目录权限正确
    Write-Host "`n设置目录权限..." -ForegroundColor Blue
    if (Test-Path "data") {
        # Windows下设置目录可读写
        $acl = Get-Acl "data"
        $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Everyone", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
        $acl.SetAccessRule($accessRule)
        Set-Acl "data" $acl
        Write-Host "✅ 数据目录权限设置完成" -ForegroundColor Green
    }
    
    # 重新启动Docker容器
    Write-Host "`n重新启动Docker容器..." -ForegroundColor Blue
    $startResult = docker-compose -f docker-compose.simple.yml up -d 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 容器已启动" -ForegroundColor Green
    } else {
        Write-Host "❌ 启动容器失败" -ForegroundColor Red
        Write-Host "错误信息: $startResult" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "`n🎉 数据恢复完成！" -ForegroundColor Green
    
} catch {
    Write-Host "❌ 恢复失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 恢复摘要:" -ForegroundColor Cyan
Write-Host "  恢复时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host "  备份源: $backupDir" -ForegroundColor White

if (Test-Path "data") {
    $dataSize = (Get-ChildItem -Path "data" -Recurse -File | Measure-Object -Property Length -Sum).Sum
    Write-Host "  恢复数据大小: $([math]::Round($dataSize/1KB, 2)) KB" -ForegroundColor White
}

Write-Host "`n💡 提示:" -ForegroundColor Yellow
Write-Host "  - 应用现在应该可以正常访问了" -ForegroundColor White
Write-Host "  - 当前数据的安全备份保存在: $currentBackupDir" -ForegroundColor White
Write-Host "  - 运行 'docker-compose -f docker-compose.simple.yml logs -f' 查看容器日志" -ForegroundColor White
