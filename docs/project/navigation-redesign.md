# 导航结构重设计方案

## 📋 文档信息
- **创建日期**: 2025-10-31
- **最后更新**: 2025-10-31
- **状态**: Phase 1 & 2 已完成，Phase 3 待未来迭代
- **优先级**: 高
- **开发分支**: `feature/global-navigation`
- **Commit**: `f4c5e23`
- **相关改动**: 登录后着陆页改为 Try-On（已完成）

---

## 🎯 背景与目标

### 当前问题
1. **缺少统一的全局导航栏** - 不同页面导航方式不一致
2. **"返回"逻辑混乱** - Try-On 页面有 "Back to Dashboard"，但用户可能从未见过 Dashboard
3. **缺少核心导航入口** - 用户在页面间跳转困难
4. **Footer 导航不够强大** - 位置太底部，不能替代顶部导航
5. **缺少明显的 CTA** - 未登录用户没有突出的行动号召

### 目标
- 提供一致的全局导航体验
- 简化页面间跳转路径（遵循 KISS 原则）
- 适配登录后直接到 Try-On 的新流程
- 保持简洁，避免臃肿
- 提高转化率（通过明显的 CTA 按钮）
- 确保无障碍访问（A11y）

---

## 📊 现状分析

### 当前导航实现

| 页面 | 导航元素 | 问题 |
|------|---------|------|
| 首页 | Logo + LoginButton | 无导航菜单 |
| Dashboard | 页面标题 + "Start Try-On" 按钮 | 无全局导航 |
| Try-On | 页面标题 + "Back to Dashboard" | 返回逻辑不合理 |
| Pricing | 页面标题 + 条件性返回链接 | 逻辑复杂 |
| Blog | 无导航，底部 "Back to Home" | 完全孤立 |

### 导航流程图

```
首页 → 登录 → Try-On → Back to Dashboard → Dashboard → Start Try-On → Try-On
                ↓
              Pricing (无直接入口)
                ↓
              Blog (无直接入口)
```

**问题**：
- 用户登录后直接到 Try-On，但页面显示 "Back to Dashboard"（用户从未见过）
- 从 Try-On 无法直接访问 Pricing 或 Blog
- 缺少快速回到首页的方式

---

## 💡 解决方案

### 方案：统一的顶部导航栏

创建一个简洁、一致的全局导航栏，适用于所有页面。

#### 设计原则
1. **简洁优先** - 只放核心功能，避免臃肿
2. **响应式** - 移动端折叠为汉堡菜单
3. **状态感知** - 根据登录状态显示不同内容
4. **一致性** - 所有页面使用相同的导航栏

#### 导航结构

**桌面端布局：**
```
┌────────────────────────────────────────────────────────────────────┐
│  [Logo] VisuTry    Try-On  Blog  Pricing    [CTA] [User/Login]    │
└────────────────────────────────────────────────────────────────────┘
```

**未登录状态：**
- Logo（点击回首页）
- Try-On（核心功能）
- Blog（内容营销）
- Pricing（转化入口）
- **[Start Free Trial]** 按钮（CTA，蓝色突出）
- Login Button（次要，outline 样式）

**已登录状态：**
- Logo（点击回首页）
- Try-On（核心功能）
- Blog（内容营销）
- Pricing（升级入口）
- **[Start Try-On]** 按钮（CTA，蓝色突出）
- User Avatar + Dropdown
  - 用户信息（姓名、邮箱）
  - Dashboard
  - History
  - Divider
  - Sign Out

**设计原则**：
- ✅ 主导航保持一致（3个核心链接，无论登录状态）
- ✅ Dashboard 收纳在用户菜单中（符合 KISS 原则）
- ✅ CTA 按钮突出显示（提高转化率）
- ✅ 视觉层级清晰（导航链接 < CTA 按钮 < 用户头像）

**移动端布局：**
```
┌─────────────────────────┐
│ [Logo]          [☰] [👤]│
└─────────────────────────┘

点击 [☰] 展开（带动画）：
┌─────────────────────────┐
│ Try-On                  │
│ Blog                    │
│ Pricing                 │
│ ─────────────────────   │
│ [Start Try-On] (if auth)│
│ [Login] (if not auth)   │
└─────────────────────────┘
```

**移动端特点**：
- CTA 按钮在桌面端显示，移动端收纳在汉堡菜单中
- 用户头像始终可见（已登录时）
- 菜单展开/收起有流畅的动画效果

---

## 🔧 技术实现

### 1. 创建 Header 组件

**文件位置**: `src/components/layout/Header.tsx`

```tsx
'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Glasses, Menu, X, Sparkles } from 'lucide-react'
import { LoginButton } from '@/components/auth/LoginButton'
import { UserMenu } from '@/components/auth/UserMenu'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import { useTestSession } from '@/hooks/useTestSession'

export function Header({ transparent = false }: { transparent?: boolean }) {
  const { data: session } = useSession()
  const { testSession } = useTestSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAuthenticated = !!(session || testSession)
  const isHomePage = pathname === '/'

  // 主导航链接（保持简洁，只有3个核心功能）
  const navLinks = [
    { href: '/try-on', label: 'Try-On' },
    { href: '/blog', label: 'Blog' },
    { href: '/pricing', label: 'Pricing' },
  ]

  return (
    <header className={cn(
      "border-b border-gray-200 sticky top-0 z-50 transition-all",
      isHomePage && transparent
        ? "bg-transparent"
        : "bg-white/80 backdrop-blur-sm"
    )}>
      <nav className="container mx-auto px-4 py-3" aria-label="Main navigation">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            aria-label="VisuTry Home"
          >
            <Glasses className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">VisuTry</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-blue-600',
                  pathname === link.href
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-1'
                    : 'text-gray-700'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA + Auth Section */}
          <div className="flex items-center space-x-3">
            {/* CTA Button - Desktop only */}
            {!isAuthenticated ? (
              <Link
                href="/try-on"
                className="hidden sm:flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                Start Free Trial
              </Link>
            ) : (
              <Link
                href="/try-on"
                className="hidden sm:flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Try-On
              </Link>
            )}

            {/* User Menu or Login Button */}
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <LoginButton variant="outline" />
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation with Animation */}
        <div
          id="mobile-menu"
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
          role="menu"
        >
          <div className="border-t border-gray-200 pt-4 pb-4">
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                  role="menuitem"
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile CTA */}
              <div className="border-t border-gray-200 pt-3 mt-3">
                {isAuthenticated ? (
                  <Link
                    href="/try-on"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Try-On
                  </Link>
                ) : (
                  <Link
                    href="/try-on"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  >
                    Start Free Trial
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
```

### 2. 创建 UserMenu 组件

**文件位置**: `src/components/auth/UserMenu.tsx`

```tsx
'use client'

import { signOut, useSession } from 'next-auth/react'
import { User, LogOut, LayoutDashboard, ChevronDown, History } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTestSession } from '@/hooks/useTestSession'

export function UserMenu() {
  const { data: session } = useSession()
  const { testSession, clearTestSession } = useTestSession()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const user = session?.user || testSession?.user
  const isTestMode = !!testSession

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menu on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {user?.image ? (
          <Image
            src={user.image}
            alt={user.name || 'User'}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-500" />
          </div>
        )}
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-700">
            {user?.name || 'User'}
          </div>
          {isTestMode && (
            <div className="text-xs text-orange-600">Test Mode</div>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
          role="menu"
        >
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-900">{user?.name || 'User'}</div>
            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            {isTestMode && (
              <div className="text-xs text-orange-600 mt-1">🧪 Test Mode Active</div>
            )}
          </div>

          {/* Menu Items */}
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            role="menuitem"
          >
            <LayoutDashboard className="w-4 h-4 mr-3 text-gray-500" />
            Dashboard
          </Link>

          <Link
            href="/dashboard/history"
            onClick={() => setIsOpen(false)}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            role="menuitem"
          >
            <History className="w-4 h-4 mr-3 text-gray-500" />
            History
          </Link>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1"></div>

          {/* Sign Out */}
          <button
            onClick={() => isTestMode ? clearTestSession() : signOut()}
            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            role="menuitem"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
```

### 3. 修改 MainLayout

**文件位置**: `src/app/(main)/layout.tsx`

```tsx
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { HomeStructuredData } from './home-structured-data'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <HomeStructuredData />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <Header />  {/* 新增全局导航栏 */}
        <div className="flex-grow">
          {children}
        </div>
        <Footer />
      </div>
    </>
  )
}
```

### 4. 清理页面内的重复导航

#### Try-On 页面
**移除**: "Back to Dashboard" 链接（第93-99行）
**保留**: Breadcrumbs 组件（SEO 和深层导航）

#### Pricing 页面
**移除**: 条件性返回链接（第121-137行）
**保留**: Breadcrumbs 组件

#### Blog 页面
**移除**: "Back to Home" 按钮（第191-197行）

#### Dashboard 页面
**保留**: "Start Try-On" 按钮（作为主要 CTA）

#### 首页
**调整**: 移除页面内的 Logo + LoginButton header
**原因**: 全局 Header 已提供这些功能

---

## 🎨 视觉设计规范

### 导航栏样式
- **背景**: `bg-white/80 backdrop-blur-sm`（半透明毛玻璃效果）
- **边框**: `border-b border-gray-200`
- **定位**: `sticky top-0 z-50`（滚动时固定在顶部）
- **高度**: 64px（桌面端）/ 56px（移动端）
- **内边距**: `px-4 py-3`

### 活动状态指示
- **当前页面**: 蓝色文字 + 底部边框 `text-blue-600 border-b-2 border-blue-600`
- **悬停状态**: `hover:text-blue-600`
- **移动端当前页**: 蓝色背景 `bg-blue-50 text-blue-600`

### 响应式断点
- **桌面端**: `md:` (≥768px) - 显示完整导航
- **移动端**: `<768px` - 汉堡菜单

---

## 📈 实施计划

### ✅ Phase 1: 核心导航（已完成）
**实际工作量**: 2 小时

- ✅ 创建 `Header` 组件
  - 统一的全局导航栏（Try-On, Blog, Pricing）
  - CTA 按钮（Start Free Trial / Start Try-On）
  - 移动端汉堡菜单（带动画效果）
  - 首页透明背景支持
  - 基础 A11y 支持（ARIA 标签）
- ✅ 创建 `UserMenu` 组件
  - 用户信息显示（姓名、邮箱）
  - Dashboard 和 History 链接
  - testSession 支持
  - 点击外部关闭 + Escape 键关闭
  - 使用 Next.js Image 组件
- ✅ 在 `MainLayout` 中引入 `Header`

### ✅ Phase 2: 清理优化（已完成）
**实际工作量**: 1 小时

- ✅ 移除 Try-On 页面的 "Back to Dashboard"
- ✅ 移除 Pricing 页面的条件性返回链接
- ✅ 移除 Blog 页面的 "Back to Home"
- ✅ 简化首页 header（移除重复的 Logo + LoginButton）

### 🔄 Phase 3: 高级优化（未来迭代）
**预计工作量**: 4-6 小时

- [ ] 完整的键盘导航和 focus management
- [ ] SEO 结构化数据（SiteNavigationElement）
- [ ] 性能优化（React.memo, prefetch 策略）
- [ ] 搜索功能（搜索眼镜款式）
- [ ] 通知中心（订阅状态、试用次数提醒）

---

## ✅ 验收标准

### 功能验收（待测试）
- [ ] 所有页面显示统一的导航栏
- [ ] Logo 点击可回到首页
- [ ] 导航链接正确跳转
- [ ] 当前页面高亮显示
- [ ] 登录/未登录状态正确显示
- [ ] CTA 按钮正确显示和跳转
- [ ] 用户菜单下拉正常工作
- [ ] 移动端汉堡菜单正常工作
- [ ] testSession 正确处理

### 体验验收（待测试）
- [ ] 导航栏在滚动时固定在顶部
- [ ] 移动端菜单打开/关闭流畅（动画效果）
- [ ] 点击外部区域关闭用户菜单
- [ ] Escape 键关闭用户菜单
- [ ] 导航链接悬停效果正常
- [ ] 无布局抖动（CLS）
- [ ] 首页透明背景正常显示

### 性能验收（待测试）
- [ ] 首次加载时间 < 100ms
- [ ] 导航切换无延迟
- [ ] 移动端菜单动画流畅（60fps）
- [ ] 图片加载优化（Next.js Image）

---

## 🎯 设计决策与最佳实践

### Header 与 Footer 的分工

**Header（主导航）**：
- 核心功能：Try-On, Blog, Pricing
- CTA 按钮：Start Free Trial / Start Try-On
- 用户菜单：Dashboard, History, Sign Out

**Footer（辅助导航）**：
- Product 栏：Try On, Pricing, Blog（与 Header 一致）
- Resources 栏：FAQ, Help Center, Contact（未来）
- Legal 栏：Privacy, Terms, Refund
- 社交媒体链接

**理由**：
- Header 和 Footer 可以有适度重复（行业标准）
- Footer 更全面，包含次要链接和 Legal 信息
- 两者互补，不是替代关系

### 首页的特殊处理

**方案**：首页使用透明背景的 Header 变体
```tsx
<Header transparent={true} />
```

**效果**：
- 首页：透明背景，融入页面设计
- 其他页面：白色半透明背景 + 毛玻璃效果
- 滚动时：自动切换为白色背景（sticky）

### 无障碍访问（A11y）

**实现要点**：
- ✅ 语义化 HTML（`<nav>`, `<header>`, `role="menu"`）
- ✅ ARIA 标签（`aria-label`, `aria-expanded`, `aria-haspopup`）
- ✅ 键盘导航（Tab, Escape, Enter）
- ✅ Focus 样式（`focus-visible:ring-2`）
- ✅ 屏幕阅读器友好

### 性能优化

**实现要点**：
- ✅ 使用 Next.js `<Image>` 组件（自动优化）
- ✅ CSS transition 而非 JavaScript 动画
- ✅ 避免过度的 re-render（React.memo）
- ✅ 导航链接使用 `prefetch={false}`（按需预加载）

---

## 🔄 后续优化方向

### Phase 4: 高级功能（未来）
1. **搜索功能**: 在导航栏添加搜索框，支持搜索眼镜款式
2. **通知中心**: 显示订阅状态、试用次数等提醒
3. **个性化**: 根据用户历史推荐相关页面
4. **A/B 测试**: 测试不同导航布局的转化率
5. **多语言支持**: i18n 国际化

---

## 📝 相关文档

- [登录着陆页改动](./login-landing-change.md)（如有）
- [用户体验优化计划](./ux-optimization.md)（如有）
- [响应式设计规范](../guides/responsive-design.md)（如有）
- [无障碍访问指南](../guides/accessibility.md)（如有）

---

## 🤔 讨论记录

### 2025-10-31 - 初始讨论
- **决策**: 采用统一的全局导航栏方案
- **理由**: 简洁、一致、适配新的登录流程
- **待定**: Dashboard 是否放在主导航栏（建议放在用户菜单中）

### 2025-10-31 - Review 后的修订
- **决策**: Dashboard 只放在用户菜单中
- **理由**: 符合 KISS 原则，保持主导航简洁
- **新增**: CTA 按钮（Start Free Trial / Start Try-On）
- **新增**: 首页透明 Header 变体
- **新增**: 完整的 A11y 支持
- **修复**: 使用 Next.js Image 组件
- **修复**: 支持 testSession

### 2025-10-31 - Phase 1 & 2 开发完成
- **完成**: Header 组件（统一导航 + CTA + 移动端菜单）
- **完成**: UserMenu 组件（用户信息 + Dashboard + History）
- **完成**: 清理所有页面的重复导航
- **完成**: 简化首页 header
- **状态**: 已推送到 feature/global-navigation 分支
- **Commit**: f4c5e23
- **下一步**: Vercel preview 环境测试

