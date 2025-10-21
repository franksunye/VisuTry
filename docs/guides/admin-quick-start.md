# Admin Panel Quick Start Guide

## 🚀 快速开始

### 1. 推送到 Vercel

```bash
git push origin main
```

Vercel 会自动：
- 运行 `prisma migrate deploy` (应用数据库迁移)
- 构建并部署应用
- 预计 2-5 分钟完成

### 2. 访问 Admin Panel

```
https://visutry.com/admin
```

使用你的账户登录（franksunye@hotmail.com 已设置为 ADMIN）

### 3. 验证功能

- ✅ Dashboard 显示统计数据
- ✅ 用户管理页面正常
- ✅ 订单管理页面正常

---

## 📚 完整文档

- **用户指南**: [Admin Panel User Guide](./admin-panel-guide.md)
- **部署指南**: [Admin Deployment Guide](./admin-deployment-guide.md)
- **设置总结**: [Admin Setup Summary](./admin-setup-summary.md)

---

## 🔧 常用命令

### 设置新管理员

```bash
ADMIN_EMAIL=user@example.com npx tsx scripts/seed-admin.ts
```

### 检查管理员

```bash
npx tsx scripts/check-admin-user.ts
```

### 验证数据库

```bash
npx tsx scripts/verify-role-column.ts
```

---

## ⚠️ 故障排查

### 无法访问 /admin

1. 确认已登录
2. 检查用户 role 是否为 ADMIN
3. 清除浏览器 cookies 并重新登录

### Dashboard 数据不显示

1. 检查 Vercel 部署日志
2. 确认数据库连接正常
3. 验证 migration 已应用

---

## 📞 获取帮助

查看 [Admin Deployment Guide](./admin-deployment-guide.md) 的故障排查部分

