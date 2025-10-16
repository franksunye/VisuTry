# Vercel 环境变量配置清单

## 📋 新增的定价配置环境变量

在完成定价配置重构后，你需要在 Vercel 上添加以下环境变量。

### 1. 访问 Vercel 环境变量设置

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目 `VisuTry`
3. 进入 **Settings** → **Environment Variables**

### 2. 添加以下环境变量

#### 免费试用配置
```
FREE_TRIAL_LIMIT=3
```

#### 订阅额度配置
```
MONTHLY_QUOTA=30
YEARLY_QUOTA=420
```

#### 充值包配置
```
CREDITS_PACK_AMOUNT=10
```

#### 价格配置（单位：美分）
```
MONTHLY_PRICE=899
YEARLY_PRICE=8999
CREDITS_PACK_PRICE=299
```

### 3. 环境选择

对于每个环境变量，选择应用的环境：
- ✅ **Production** - 生产环境
- ✅ **Preview** - 预览环境（可选）
- ✅ **Development** - 开发环境（可选）

**建议**：至少为 Production 环境添加这些变量。

### 4. 验证配置

添加完成后：
1. 触发一次新的部署（可以通过 Git push 或手动触发）
2. 部署完成后，访问 `/pricing` 页面
3. 检查价格和额度显示是否正确

### 5. 配置说明

| 环境变量 | 说明 | 默认值 | 示例 |
|---------|------|--------|------|
| `FREE_TRIAL_LIMIT` | 免费试用次数 | 3 | 3 |
| `MONTHLY_QUOTA` | 月度订阅额度 | 30 | 30 |
| `YEARLY_QUOTA` | 年度订阅额度 | 420 | 420 |
| `CREDITS_PACK_AMOUNT` | 充值包额度 | 10 | 10 |
| `MONTHLY_PRICE` | 月度订阅价格（美分） | 899 | 899 ($8.99) |
| `YEARLY_PRICE` | 年度订阅价格（美分） | 8999 | 8999 ($89.99) |
| `CREDITS_PACK_PRICE` | 充值包价格（美分） | 299 | 299 ($2.99) |

### 6. 注意事项

⚠️ **重要**：
- 价格单位是**美分**（cents），不是美元
- 例如：$8.99 = 899 美分
- 修改环境变量后需要重新部署才能生效
- 建议先在 Preview 环境测试，确认无误后再应用到 Production

### 7. 快速复制（用于 Vercel）

如果 Vercel 支持批量导入，可以使用以下格式：

```env
FREE_TRIAL_LIMIT=3
MONTHLY_QUOTA=30
YEARLY_QUOTA=420
CREDITS_PACK_AMOUNT=10
MONTHLY_PRICE=899
YEARLY_PRICE=8999
CREDITS_PACK_PRICE=299
```

### 8. 本地开发

如果你在本地开发，也需要在 `.env.local` 文件中添加这些变量：

```bash
# 复制 .env.example 到 .env.local
cp .env.example .env.local

# 然后编辑 .env.local，确保包含所有定价配置
```

### 9. 故障排查

如果部署后价格显示不正确：

1. **检查环境变量是否正确设置**
   - 在 Vercel Dashboard 中确认所有变量都已添加
   - 确认变量名拼写正确（区分大小写）

2. **检查部署日志**
   - 查看 Vercel 部署日志，确认没有错误
   - 搜索 "pricing" 或 "config" 相关的错误信息

3. **验证默认值**
   - 即使没有设置环境变量，应用也会使用默认值
   - 默认值在 `src/config/pricing.ts` 中定义

4. **清除缓存**
   - 在浏览器中清除缓存
   - 或使用无痕模式访问

### 10. 完成确认

配置完成后，请确认：
- [ ] 所有 7 个环境变量都已添加到 Vercel
- [ ] 选择了正确的环境（至少 Production）
- [ ] 触发了新的部署
- [ ] 访问 `/pricing` 页面，价格显示正确
- [ ] 访问 `/payments` 页面，额度显示正确
- [ ] 测试购买流程（可选）

---

## 🎉 完成！

配置完成后，你的定价系统将使用集中化的配置，未来修改价格或额度只需要：
1. 在 Vercel 中修改环境变量
2. 重新部署应用

无需修改代码！

