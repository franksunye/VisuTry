# Stripe CLI 自动安装脚本
# 使用方法: 在 PowerShell 中运行此脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Stripe CLI 自动安装脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 配置
$StripeVersion = "1.19.5"
$DownloadUrl = "https://github.com/stripe/stripe-cli/releases/download/v$StripeVersion/stripe_${StripeVersion}_windows_x86_64.zip"
$DownloadPath = "$env:TEMP\stripe.zip"
$InstallPath = "$env:LOCALAPPDATA\stripe"

try {
    # 步骤 1: 创建安装目录
    Write-Host "[1/5] 创建安装目录..." -ForegroundColor Green
    if (Test-Path $InstallPath) {
        Write-Host "      目录已存在，将覆盖安装" -ForegroundColor Yellow
    }
    New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null
    Write-Host "      ✓ 完成" -ForegroundColor Green
    Write-Host ""

    # 步骤 2: 下载 Stripe CLI
    Write-Host "[2/5] 下载 Stripe CLI v$StripeVersion..." -ForegroundColor Green
    Write-Host "      URL: $DownloadUrl" -ForegroundColor Gray
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $DownloadPath -UseBasicParsing
    Write-Host "      ✓ 下载完成" -ForegroundColor Green
    Write-Host ""

    # 步骤 3: 解压文件
    Write-Host "[3/5] 解压文件..." -ForegroundColor Green
    Expand-Archive -Path $DownloadPath -DestinationPath $InstallPath -Force
    Write-Host "      ✓ 解压完成" -ForegroundColor Green
    Write-Host ""

    # 步骤 4: 添加到 PATH
    Write-Host "[4/5] 添加到系统 PATH..." -ForegroundColor Green
    $CurrentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($CurrentPath -notlike "*$InstallPath*") {
        [Environment]::SetEnvironmentVariable("Path", "$CurrentPath;$InstallPath", "User")
        Write-Host "      ✓ 已添加到 PATH" -ForegroundColor Green
    } else {
        Write-Host "      ✓ PATH 中已存在" -ForegroundColor Yellow
    }
    Write-Host ""

    # 步骤 5: 清理临时文件
    Write-Host "[5/5] 清理临时文件..." -ForegroundColor Green
    Remove-Item $DownloadPath -Force
    Write-Host "      ✓ 清理完成" -ForegroundColor Green
    Write-Host ""

    # 完成
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  ✅ Stripe CLI 安装成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "安装位置: $InstallPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  重要提示:" -ForegroundColor Yellow
    Write-Host "   1. 请关闭当前终端并重新打开" -ForegroundColor Yellow
    Write-Host "   2. 运行 'stripe --version' 验证安装" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "下一步操作:" -ForegroundColor Cyan
    Write-Host "   1. stripe login" -ForegroundColor White
    Write-Host "   2. stripe listen --forward-to localhost:3000/api/payment/webhook" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "❌ 安装失败！" -ForegroundColor Red
    Write-Host "错误信息: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "请尝试手动安装:" -ForegroundColor Yellow
    Write-Host "1. 访问: https://github.com/stripe/stripe-cli/releases/latest" -ForegroundColor White
    Write-Host "2. 下载: stripe_X.X.X_windows_x86_64.zip" -ForegroundColor White
    Write-Host "3. 解压到任意目录" -ForegroundColor White
    Write-Host "4. 将该目录添加到系统 PATH" -ForegroundColor White
    Write-Host ""
    exit 1
}

