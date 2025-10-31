# 导航结构重设计方案

## 📋 文档信息
- **创建日期**: 2025-10-31
- **状态**: 待实施
- **优先级**: 高
- **相关改动**: 登录后着陆页改为 Try-On（已完成）

---

## 🎯 背景与目标

### 当前问题
1. **缺少统一的全局导航栏** - 不同页面导航方式不一致
2. **"返回"逻辑混乱** - Try-On 页面有 "Back to Dashboard"，但用户可能从未见过 Dashboard
3. **缺少核心导航入口** - 用户在页面间跳转困难
4. **Footer 导航不够强大** - 位置太底部，不能替代顶部导航

### 目标
- 提供一致的全局导航体验
- 简化页面间跳转路径
- 适配登录后直接到 Try-On 的新流程
- 保持简洁，避免臃肿

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
┌─────────────────────────────────────────────────────────┐
│  [Logo] VisuTry    Try-On  Blog  Pricing    [User/Login]│
└─────────────────────────────────────────────────────────┘
```

**未登录状态：**
- Logo（点击回首页）
- Try-On（点击引导登录）
- Blog
- Pricing
- Login Button

**已登录状态：**
- Logo（点击回首页）
- Try-On
- Blog
- Pricing
- Dashboard（可选，或放在用户菜单中）
- User Avatar + Dropdown
  - Dashboard
  - Settings（未来）
  - Logout

**移动端布局：**
```
┌─────────────────────────┐
│ [Logo]          [☰] [👤]│
└─────────────────────────┘

点击 [☰] 展开：
┌─────────────────────────┐
│ Try-On                  │
│ Blog                    │
│ Pricing                 │
│ Dashboard (if logged in)│
└─────────────────────────┘
```

---

## 🔧 技术实现

### 1. 创建 Header 组件

**文件位置**: `src/components/layout/Header.tsx`

```tsx
'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Glasses, Menu, X } from 'lucide-react'
import { LoginButton } from '@/components/auth/LoginButton'
import { UserMenu } from '@/components/auth/UserMenu'
import { useState } from 'react'
import { cn } from '@/utils/cn'

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const isAuthenticated = !!session
  
  const navLinks = [
    { href: '/try-on', label: 'Try-On' },
    { href: '/blog', label: 'Blog' },
    { href: '/pricing', label: 'Pricing' },
    ...(isAuthenticated ? [{ href: '/dashboard', label: 'Dashboard' }] : []),
  ]
  
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
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
          
          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <LoginButton variant="default" />
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
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
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
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
import { User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

export function UserMenu() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  const user = session?.user
  
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
  
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {user?.image ? (
          <img src={user.image} alt={user.name || 'User'} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-500" />
          </div>
        )}
        <span className="hidden sm:block text-sm font-medium text-gray-700">
          {user?.name || 'User'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
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

#### Pricing 页面
**移除**: 条件性返回链接（第121-137行）

#### Blog 页面
**移除**: "Back to Home" 按钮（第191-197行）

#### Dashboard 页面
**保留**: "Start Try-On" 按钮（作为主要 CTA）

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

### Phase 1: 核心导航（必须）
**预计工作量**: 2-3 小时

- [ ] 创建 `Header` 组件
- [ ] 创建 `UserMenu` 组件
- [ ] 在 `MainLayout` 中引入 `Header`
- [ ] 测试桌面端导航
- [ ] 测试移动端导航
- [ ] 测试登录/未登录状态切换

### Phase 2: 清理优化（推荐）
**预计工作量**: 1-2 小时

- [ ] 移除 Try-On 页面的 "Back to Dashboard"
- [ ] 移除 Pricing 页面的条件性返回链接
- [ ] 移除 Blog 页面的 "Back to Home"
- [ ] 更新 `navigation.ts` 工具函数（如需要）
- [ ] 测试所有页面导航流程

### Phase 3: 高级功能（可选）
**预计工作量**: 4-6 小时

- [ ] 添加搜索功能（搜索眼镜款式）
- [ ] 添加通知中心（订阅状态、试用次数提醒）
- [ ] 添加快捷键支持（如 `/` 打开搜索）
- [ ] 添加面包屑导航（Breadcrumbs）

---

## ✅ 验收标准

### 功能验收
- [ ] 所有页面显示统一的导航栏
- [ ] Logo 点击可回到首页
- [ ] 导航链接正确跳转
- [ ] 当前页面高亮显示
- [ ] 登录/未登录状态正确显示
- [ ] 用户菜单下拉正常工作
- [ ] 移动端汉堡菜单正常工作

### 体验验收
- [ ] 导航栏在滚动时固定在顶部
- [ ] 移动端菜单打开/关闭流畅
- [ ] 点击外部区域关闭用户菜单
- [ ] 导航链接悬停效果正常
- [ ] 无布局抖动（CLS）

### 性能验收
- [ ] 首次加载时间 < 100ms
- [ ] 导航切换无延迟
- [ ] 移动端菜单动画流畅（60fps）

---

## 🔄 后续优化方向

1. **搜索功能**: 在导航栏添加搜索框，支持搜索眼镜款式
2. **通知中心**: 显示订阅状态、试用次数等提醒
3. **个性化**: 根据用户历史推荐相关页面
4. **A/B 测试**: 测试不同导航布局的转化率

---

## 📝 相关文档

- [登录着陆页改动](./login-landing-change.md)（如有）
- [用户体验优化计划](./ux-optimization.md)（如有）
- [响应式设计规范](../guides/responsive-design.md)（如有）

---

## 🤔 讨论记录

### 2025-10-31 - 初始讨论
- **决策**: 采用统一的全局导航栏方案
- **理由**: 简洁、一致、适配新的登录流程
- **待定**: Dashboard 是否放在主导航栏（建议放在用户菜单中）

