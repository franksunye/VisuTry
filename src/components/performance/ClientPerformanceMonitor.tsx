"use client"

import { useEffect } from "react"

interface ClientPerformanceMonitorProps {
  pageName: string
}

/**
 * 客户端性能监控组件
 * 监控前端渲染性能，包括：
 * - FCP (First Contentful Paint)
 * - LCP (Largest Contentful Paint)
 * - TTI (Time to Interactive)
 * - 总渲染时间
 */
export function ClientPerformanceMonitor({ pageName }: ClientPerformanceMonitorProps) {
  useEffect(() => {
    // 只在浏览器环境中运行
    if (typeof window === 'undefined') return

    const measureClientPerformance = () => {
      try {
        // 获取 Navigation Timing API 数据
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        
        if (!perfData) {
          console.warn('⚠️ [Client Performance] Navigation Timing API not available')
          return
        }

        // 计算关键性能指标
        const metrics = {
          // DNS 查询时间
          dns: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),

          // TCP 连接时间
          tcp: Math.round(perfData.connectEnd - perfData.connectStart),

          // 请求响应时间
          request: Math.round(perfData.responseEnd - perfData.requestStart),

          // DOM 解析时间
          domParse: Math.round(perfData.domInteractive - perfData.responseEnd),

          // DOM 内容加载完成时间
          domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),

          // 页面完全加载时间
          pageLoad: Math.round(perfData.loadEventEnd - perfData.fetchStart),

          // 首次内容绘制时间 (FCP)
          fcp: 0,

          // 最大内容绘制时间 (LCP)
          lcp: 0,
        }

        // 获取 Paint Timing API 数据 (FCP)
        const paintEntries = performance.getEntriesByType('paint')
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
        if (fcpEntry) {
          metrics.fcp = Math.round(fcpEntry.startTime)
        }

        // 获取 LCP (需要 PerformanceObserver)
        if ('PerformanceObserver' in window) {
          try {
            const lcpObserver = new PerformanceObserver((list) => {
              const entries = list.getEntries()
              const lastEntry = entries[entries.length - 1] as any
              if (lastEntry) {
                metrics.lcp = Math.round(lastEntry.startTime)
              }
            })
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
          } catch (e) {
            // LCP 可能不被支持
          }
        }

        // 输出性能日志
        console.log('\n' + '='.repeat(60))
        console.log(`🎨 [Client Performance] ${pageName}`)
        console.log(`   DNS Lookup: ${metrics.dns}ms`)
        console.log(`   TCP Connection: ${metrics.tcp}ms`)
        console.log(`   Request/Response: ${metrics.request}ms`)
        console.log(`   DOM Parse: ${metrics.domParse}ms`)
        console.log(`   DOM Content Loaded: ${metrics.domContentLoaded}ms`)
        console.log(`   Page Load Complete: ${metrics.pageLoad}ms`)
        
        if (metrics.fcp > 0) {
          const fcpStatus = metrics.fcp < 1800 ? '✅' : metrics.fcp < 3000 ? '⚠️' : '❌'
          console.log(`   ${fcpStatus} First Contentful Paint (FCP): ${metrics.fcp}ms`)
        }
        
        if (metrics.lcp > 0) {
          const lcpStatus = metrics.lcp < 2500 ? '✅' : metrics.lcp < 4000 ? '⚠️' : '❌'
          console.log(`   ${lcpStatus} Largest Contentful Paint (LCP): ${metrics.lcp}ms`)
        }
        
        console.log('='.repeat(60) + '\n')

        // 性能评分
        const performanceScore = calculatePerformanceScore(metrics)
        if (performanceScore < 50) {
          console.error(`🔴 [Client Performance] Poor performance score: ${performanceScore}/100`)
        } else if (performanceScore < 80) {
          console.warn(`🟡 [Client Performance] Moderate performance score: ${performanceScore}/100`)
        } else {
          console.log(`🟢 [Client Performance] Good performance score: ${performanceScore}/100`)
        }

      } catch (error) {
        console.error('❌ [Client Performance] Error measuring performance:', error)
      }
    }

    // 等待页面完全加载后再测量
    if (document.readyState === 'complete') {
      measureClientPerformance()
    } else {
      window.addEventListener('load', measureClientPerformance)
      return () => window.removeEventListener('load', measureClientPerformance)
    }
  }, [pageName])

  return null // 这是一个纯监控组件，不渲染任何内容
}

/**
 * 计算性能评分 (0-100)
 */
function calculatePerformanceScore(metrics: {
  fcp: number
  lcp: number
  domContentLoaded: number
  pageLoad: number
}): number {
  let score = 100

  // FCP 评分 (权重 25%)
  if (metrics.fcp > 0) {
    if (metrics.fcp > 3000) score -= 25
    else if (metrics.fcp > 1800) score -= 15
    else if (metrics.fcp > 1000) score -= 5
  }

  // LCP 评分 (权重 25%)
  if (metrics.lcp > 0) {
    if (metrics.lcp > 4000) score -= 25
    else if (metrics.lcp > 2500) score -= 15
    else if (metrics.lcp > 1500) score -= 5
  }

  // DOM Content Loaded 评分 (权重 25%)
  if (metrics.domContentLoaded > 3000) score -= 25
  else if (metrics.domContentLoaded > 2000) score -= 15
  else if (metrics.domContentLoaded > 1000) score -= 5

  // Page Load 评分 (权重 25%)
  if (metrics.pageLoad > 5000) score -= 25
  else if (metrics.pageLoad > 3000) score -= 15
  else if (metrics.pageLoad > 2000) score -= 5

  return Math.max(0, score)
}

