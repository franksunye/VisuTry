# Stripe CLI 安装指南

## 🎯 快速安装（推荐）

### 方法 1: 使用 PowerShell 一键安装

打开 **PowerShell**（不是 Cygwin bash），运行以下命令：

```powershell
# 下载 Stripe CLI
$StripeVersion = "1.19.5"
$DownloadUrl = "https://github.com/stripe/stripe-cli/releases/download/v$StripeVersion/stripe_${StripeVersion}_windows_x86_64.zip"
$DownloadPath = "$env:TEMP\stripe.zip"
$InstallPath = "$env:LOCALAPPDATA\stripe"

# 创建安装目录
New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null

# 下载
Write-Host "正在下载 Stripe CLI..." -ForegroundColor Green
Invoke-WebRequest -Uri $DownloadUrl -OutFile $DownloadPath

# 解压
Write-Host "正在解压..." -ForegroundColor Green
Expand-Archive -Path $DownloadPath -DestinationPath $InstallPath -Force

# 添加到 PATH
$CurrentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($CurrentPath -notlike "*$InstallPath*") {
    [Environment]::SetEnvironmentVariable("Path", "$CurrentPath;$InstallPath", "User")
    Write-Host "已添加到 PATH" -ForegroundColor Green
}

# 清理
Remove-Item $DownloadPath

Write-Host "`n✅ Stripe CLI 安装完成！" -ForegroundColor Green
Write-Host "请重新打开终端，然后运行: stripe --version" -ForegroundColor Yellow
```

### 方法 2: 手动下载安装

1. **下载 Stripe CLI**
   
   访问: https://github.com/stripe/stripe-cli/releases/latest
   
   下载: `stripe_X.X.X_windows_x86_64.zip`

2. **解压文件**
   
   解压到一个目录，例如: `C:\stripe`

3. **添加到 PATH**
   
   - 右键点击 "此电脑" → "属性"
   - 点击 "高级系统设置"
   - 点击 "环境变量"
   - 在 "用户变量" 中找到 "Path"
   - 点击 "编辑" → "新建"
   - 添加: `C:\stripe`
   - 点击 "确定" 保存

4. **验证安装**
   
   重新打开终端，运行:
   ```bash
   stripe --version
   ```

---

## 🚀 安装后的下一步

安装完成后，继续执行测试：

```bash
# 1. 登录 Stripe
stripe login

# 2. 启动 Webhook 转发
stripe listen --forward-to localhost:3000/api/payment/webhook

# 3. 复制输出的 whsec_xxx 到 .env.local

# 4. 重启开发服务器
npm run dev

# 5. 在新终端触发测试
stripe trigger checkout.session.completed

# 6. 验证数据库
node scripts/check-payments.js
```

