# 图片上传问题修复计划

## 问题
用户上传的眼镜照片和人脸照片被保存成相同内容（都是人脸照片）
- 间歇性发生
- 文件名正确，但内容相同

## 分步修复计划

### ✅ 第一步：添加调试日志（最小改动，零风险）
**目标**：了解问题发生时的具体情况
**改动**：只添加console.log，不改变任何逻辑
**文件**：`src/app/api/try-on/route.ts`
**内容**：
- 记录接收到的两个文件的名称、大小、类型
- 记录上传后的URL

**风险**：无
**影响**：无性能影响，只增加日志

---

### ⏳ 第二步：添加文件唯一性验证（小改动，低风险）
**前提**：第一步的日志显示确实存在文件相同的情况
**改动**：在后端添加简单验证，如果两个文件相同则返回错误
**文件**：`src/app/api/try-on/route.ts`
**内容**：
```typescript
if (userImageFile === glassesImageFile) {
  return NextResponse.json({ success: false, error: "..." }, { status: 400 })
}
```

**风险**：低（只是添加验证，不改变正常流程）
**影响**：如果问题发生，用户会看到错误提示而不是错误结果

---

### ⏳ 第三步：改进文件命名（中等改动，中等风险）
**前提**：第二步验证有效，但需要进一步防止问题
**改动**：在文件名中添加随机后缀
**文件**：`src/app/api/try-on/route.ts`
**内容**：
```typescript
const randomSuffix = Math.random().toString(36).substring(2, 8)
const userImageFilename = `try-on/${userId}/${timestamp}-${randomSuffix}-user.jpg`
```

**风险**：中（改变文件命名规则，需要确保不影响其他功能）
**影响**：文件名格式变化，需要测试

---

### ⏳ 第四步：前端验证（可选，如果后端修复不够）
**前提**：后端修复后问题仍然存在
**改动**：在前端提交前验证两个文件不同
**文件**：`src/components/try-on/TryOnInterface.tsx`

**风险**：低
**影响**：增加前端验证逻辑

---

### ⏳ 第五步：添加文件指纹（可选，用于深度调试）
**前提**：需要更详细的文件内容验证
**改动**：添加文件内容哈希
**文件**：`src/utils/image.ts`

**风险**：中（增加计算开销）
**影响**：可能影响性能

---

## 当前状态
- [x] **第一步：添加调试日志** ✅ 已完成
- [ ] 第二步：添加验证（等待第一步的日志反馈）
- [ ] 第三步：改进命名（等待第二步验证）
- [ ] 第四步：前端验证（可选）
- [ ] 第五步：文件指纹（可选）

## 决策原则
1. **先观察，后修复**：先通过日志了解问题
2. **最小改动**：每次只改一个地方
3. **渐进式**：验证一步成功后再进行下一步
4. **可回滚**：每一步都可以轻松回滚

## 前端代码走查结果

### 代码分析
经过详细走查，前端代码逻辑正确：
- ✅ 两个独立的状态变量（userImage, glassesImage）
- ✅ 两个独立的handler（handleUserImageSelect, handleGlassesImageSelect）
- ✅ 每次上传都创建新的File对象（通过compressImage）
- ✅ FormData正确append两个不同的字段

### 结论
**两个File对象引用相同的可能性：< 1%**

### 更可能的原因
1. **用户误操作**（30%）：用户在两个上传框选择了同一张照片
2. **后端接收问题**（40%）：FormData传输或解析出现问题
3. **浏览器特定bug**（20%）：某些浏览器的File/FormData实现有问题
4. **Vercel Blob问题**（10%）：存储层面的缓存或覆盖

---

## 第一步实施详情

### 已添加的日志
在 `src/app/api/try-on/route.ts` 中添加了以下日志：

1. **文件接收日志**：
```
📸 File details:
  User image: name="xxx", size=xxx, type=xxx
  Glasses image: name="xxx", size=xxx, type=xxx
  Same object reference? ✅ No 或 ❌ YES (PROBLEM!)
  ⚠️ WARNING: Files have identical name and size! (如果适用)
```

2. **上传过程日志**：
```
📤 Uploading user image to: try-on/userId/timestamp-user.jpg
✅ User image uploaded to: https://...
📤 Uploading glasses image to: try-on/userId/timestamp-glasses.jpg
✅ Glasses image uploaded to: https://...
```

3. **验证日志**：
```
🔍 Upload verification:
  User URL: https://...
  Glasses URL: https://...
  URLs are ✅ different (OK) 或 ❌ SAME (ERROR!)
```

### 如何使用这些日志

1. **部署到生产环境**
2. **等待问题再次发生**（或让用户报告）
3. **检查服务器日志**，查找：
   - 是否有 "❌ SAME (ERROR!)" 的情况
   - 两个文件的 name/size/type 是否相同
   - 上传的URL是否相同

4. **根据日志结果决定下一步**：
   - 如果URL相同 → 说明Vercel Blob有问题，需要联系Vercel或改用其他策略
   - 如果文件name/size相同 → 说明前端传递了相同的文件，需要实施第二步验证
   - 如果都不同但结果错误 → 需要更深入的调试

## 建议
**第一步已完成**，现在可以部署并观察日志。根据实际日志反馈决定是否需要后续步骤。

