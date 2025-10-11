/**
 * Performance Logger for Vercel Production Monitoring
 * 
 * 用于在 Vercel 生产环境中监控性能瓶颈
 * 所有日志会输出到 Vercel 的日志系统，可以在 Vercel Dashboard 中查看
 */

interface PerformanceMetric {
  operation: string
  duration: number
  timestamp: string
  metadata?: Record<string, any>
}

class PerformanceLogger {
  private startTimes: Map<string, number> = new Map()
  private durations: Map<string, number> = new Map()
  private enabled: boolean

  constructor() {
    // 在生产环境和开发环境都启用性能日志
    this.enabled = true
  }

  /**
   * 开始计时
   * @param operation 操作名称，例如 'db:getUserData', 'auth:getSession'
   */
  start(operation: string): void {
    if (!this.enabled) return
    this.startTimes.set(operation, Date.now())
  }

  /**
   * 结束计时并记录
   * @param operation 操作名称
   * @param metadata 额外的元数据
   */
  end(operation: string, metadata?: Record<string, any>): number {
    if (!this.enabled) return 0

    const startTime = this.startTimes.get(operation)
    if (!startTime) {
      console.warn(`⚠️ [Performance] No start time found for operation: ${operation}`)
      return 0
    }

    const duration = Date.now() - startTime
    this.startTimes.delete(operation)

    // 保存 duration 以便后续在 Summary 中使用
    this.durations.set(operation, duration)

    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      metadata
    }

    // 根据耗时使用不同的日志级别
    if (duration > 1000) {
      // 超过 1 秒，使用 error 级别（红色警告）
      console.error(`🔴 [Performance] SLOW: ${operation} took ${duration}ms`, metadata || {})
    } else if (duration > 500) {
      // 超过 500ms，使用 warn 级别（黄色警告）
      console.warn(`🟡 [Performance] ${operation} took ${duration}ms`, metadata || {})
    } else if (duration > 200) {
      // 超过 200ms，使用 info 级别
      console.info(`🟢 [Performance] ${operation} took ${duration}ms`, metadata || {})
    } else {
      // 正常速度，使用 debug 级别
      console.log(`⚡ [Performance] ${operation} took ${duration}ms`, metadata || {})
    }

    return duration
  }

  /**
   * 获取已记录的操作耗时
   * @param operation 操作名称
   */
  getDuration(operation: string): number {
    return this.durations.get(operation) || 0
  }

  /**
   * 清除所有已记录的耗时（用于新的页面加载）
   */
  clearDurations(): void {
    this.durations.clear()
  }

  /**
   * 测量异步函数的执行时间
   * @param operation 操作名称
   * @param fn 要执行的异步函数
   * @param metadata 额外的元数据
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(operation)
    try {
      const result = await fn()
      this.end(operation, { ...metadata, success: true })
      return result
    } catch (error) {
      this.end(operation, { 
        ...metadata, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      throw error
    }
  }

  /**
   * 测量同步函数的执行时间
   * @param operation 操作名称
   * @param fn 要执行的同步函数
   * @param metadata 额外的元数据
   */
  measureSync<T>(
    operation: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    this.start(operation)
    try {
      const result = fn()
      this.end(operation, { ...metadata, success: true })
      return result
    } catch (error) {
      this.end(operation, { 
        ...metadata, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      throw error
    }
  }

  /**
   * 记录一个时间点（用于标记关键节点）
   * @param label 标签
   * @param metadata 额外的元数据
   */
  mark(label: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return
    console.log(`📍 [Performance Mark] ${label}`, metadata || {})
  }

  /**
   * 记录总体页面加载时间
   * @param page 页面名称
   * @param totalDuration 总耗时
   * @param breakdown 各部分耗时分解
   */
  logPageLoad(
    page: string,
    totalDuration: number,
    breakdown?: Record<string, number>
  ): void {
    if (!this.enabled) return

    console.log(`\n${'='.repeat(60)}`)
    console.log(`📊 [Page Load Summary] ${page}`)
    console.log(`   Total Duration: ${totalDuration}ms`)
    
    if (breakdown) {
      console.log(`   Breakdown:`)
      Object.entries(breakdown).forEach(([key, value]) => {
        const percentage = ((value / totalDuration) * 100).toFixed(1)
        console.log(`     - ${key}: ${value}ms (${percentage}%)`)
      })
    }
    
    console.log(`${'='.repeat(60)}\n`)
  }
}

// 导出单例实例
export const perfLogger = new PerformanceLogger()

// 导出便捷函数
export const measureAsync = perfLogger.measure.bind(perfLogger)
export const measureSync = perfLogger.measureSync.bind(perfLogger)
export const perfMark = perfLogger.mark.bind(perfLogger)
export const logPageLoad = perfLogger.logPageLoad.bind(perfLogger)

