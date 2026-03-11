# VisuTry 代理分销技术路线图 (Reseller Technical Roadmap)

本文件详细记录了 VisuTry 实现“全在线、高扩展”代理分销体系的技术方案。这是经过 2026 年 3 月商机评估后达成的技术共识。

## 🛠️ 核心架构设计

### 1. 自动化在线白标 (Auto Online White-label)
*   **原则**：不进行手动服务器部署，不提供独立租户环境。
*   **对外口径**：在真正上线前，对外统一表述为**分阶段 rollout 的 co-branding 能力**，不直接承诺完整 white-label 已普遍可用。
*   **实现机制**：
    *   **数据库存储**：在 `User` 模型中增加 `branding (JSON)` 字段，存储 Logo URL、标题、主题色等。
    *   **动态渲染**：系统通过访问 URL 的 `rid` (Reseller ID) 参数识别代理商。
    *   **上下文切换**：前端使用 `BrandingContext`。一旦识别 `rid`，系统将静态资源（如 Logo）动态替换为代理商定义的资源。
    *   **持久化**：用户首次访问后，`rid` 将持久化于 LocalStorage，确保用户后续路径保持代理商一致性。

### 2. 纯在线点数分销 (Online Credits Distribution)
*   **对外口径**：在 `RESELLER` 角色、转账 API、审计日志真正落地前，统一表述为**selected partners can be onboarded manually in staged rollout**。
*   **首选方案：点数即时划拨 (Instant Transfer)**：
    *   赋予 `RESELLER` 角色用户“转账”权限。
    *   代理商可在后台搜索终端用户邮箱，直接扣除名下点数并充值给目标用户。
*   **次选方案：批量兑换码 (Batch Vouchers)**：
    *   支持代理商生成、导出、及作废批量的单次使用的兑换码。

### 3. 数据隔离与隐私守卫 (Privacy Guardrails)
*   **权限限制**：代理商账户**仅能**查看其关联用户的点数余额、消耗报表。
*   **隐私屏蔽**：代理商**严禁**访问子用户的 `TryOnTask` 内容（包括上传的照片和试戴结果），以保护终端用户隐私。

## 💾 数据库模型规划 (Prisma)

```prisma
model User {
  // ... 现有字段
  role         UserRole @default(USER) // 增加 RESELLER 角色
  branding     Json?    // 存储 { logoUrl, title, primaryColor }
  resellerId   String?  // 关联的代理商 ID
  
  // 关联关系
  subUsers     User[]   @relation("ResellerSubUsers")
  reseller     User?    @relation("ResellerSubUsers", fields: [resellerId], references: [id])
}
```

## 🚀 实施阶段建议
1.  **Phase 1**: 实现 `branding` JSON 的数据库存储与前端基础 Logo 动态替换。
2.  **Phase 2**: 实现 `POST /api/reseller/transfer` 核心分销逻辑。
3.  **Phase 3**: 完善代理商控制面板，提供点数消耗统计。
