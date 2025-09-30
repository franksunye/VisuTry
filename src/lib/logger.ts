/**
 * 运行时日志系统
 * 支持开发环境和生产环境的日志记录和监控
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogCategory = 'auth' | 'oauth' | 'api' | 'database' | 'upload' | 'payment' | 'general'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  data?: any
  userId?: string
  sessionId?: string
  userAgent?: string
  ip?: string
  url?: string
  method?: string
  error?: {
    name: string
    message: string
    stack?: string
  }
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000 // 最多保存1000条日志
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    context?: {
      userId?: string
      sessionId?: string
      userAgent?: string
      ip?: string
      url?: string
      method?: string
      error?: Error
    }
  ): LogEntry {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      ...context,
    }

    // 处理错误对象
    if (context?.error) {
      entry.error = {
        name: context.error.name,
        message: context.error.message,
        stack: this.isDevelopment ? context.error.stack : undefined,
      }
    }

    return entry
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry)
    
    // 保持日志数量在限制内
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // 控制台输出（开发环境）
    if (this.isDevelopment) {
      this.consoleOutput(entry)
    }

    // 生产环境可以在这里添加外部日志服务集成
    if (this.isProduction && entry.level === 'error') {
      this.handleProductionError(entry)
    }
  }

  private consoleOutput(entry: LogEntry) {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`
    
    switch (entry.level) {
      case 'debug':
        console.log(`🔍 ${prefix}`, entry.message, entry.data || '')
        break
      case 'info':
        console.log(`ℹ️  ${prefix}`, entry.message, entry.data || '')
        break
      case 'warn':
        console.warn(`⚠️  ${prefix}`, entry.message, entry.data || '')
        break
      case 'error':
        console.error(`❌ ${prefix}`, entry.message, entry.error || entry.data || '')
        if (entry.error?.stack) {
          console.error(entry.error.stack)
        }
        break
    }
  }

  private handleProductionError(entry: LogEntry) {
    // 生产环境错误处理
    // 这里可以集成外部错误监控服务，如 Sentry, LogRocket 等
    console.error('Production Error:', {
      id: entry.id,
      timestamp: entry.timestamp,
      message: entry.message,
      category: entry.category,
      userId: entry.userId,
      url: entry.url,
      error: entry.error,
    })
  }

  // 公共日志方法
  debug(category: LogCategory, message: string, data?: any, context?: any) {
    this.addLog(this.createLogEntry('debug', category, message, data, context))
  }

  info(category: LogCategory, message: string, data?: any, context?: any) {
    this.addLog(this.createLogEntry('info', category, message, data, context))
  }

  warn(category: LogCategory, message: string, data?: any, context?: any) {
    this.addLog(this.createLogEntry('warn', category, message, data, context))
  }

  error(category: LogCategory, message: string, error?: Error, data?: any, context?: any) {
    this.addLog(this.createLogEntry('error', category, message, data, { ...context, error }))
  }

  // OAuth 专用日志方法
  oauthStart(provider: string, context?: any) {
    this.info('oauth', `OAuth login started with ${provider}`, { provider }, context)
  }

  oauthSuccess(provider: string, userId: string, context?: any) {
    this.info('oauth', `OAuth login successful with ${provider}`, { provider, userId }, context)
  }

  oauthError(provider: string, error: Error, context?: any) {
    this.error('oauth', `OAuth login failed with ${provider}`, error, { provider }, context)
  }

  oauthCallback(provider: string, data: any, context?: any) {
    this.debug('oauth', `OAuth callback received from ${provider}`, { provider, ...data }, context)
  }

  // 获取日志
  getLogs(filters?: {
    level?: LogLevel
    category?: LogCategory
    limit?: number
    since?: string
    userId?: string
  }): LogEntry[] {
    let filteredLogs = [...this.logs]

    if (filters) {
      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level)
      }
      if (filters.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filters.category)
      }
      if (filters.since) {
        const sinceDate = new Date(filters.since)
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= sinceDate)
      }
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId)
      }
      if (filters.limit) {
        filteredLogs = filteredLogs.slice(-filters.limit)
      }
    }

    return filteredLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  // 清除日志
  clearLogs() {
    this.logs = []
    this.info('general', 'Logs cleared')
  }

  // 获取统计信息
  getStats() {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const recentLogs = this.logs.filter(log => new Date(log.timestamp) >= oneHourAgo)

    const stats = {
      total: this.logs.length,
      recent: recentLogs.length,
      byLevel: {} as Record<LogLevel, number>,
      byCategory: {} as Record<LogCategory, number>,
      errors: this.logs.filter(log => log.level === 'error').length,
      warnings: this.logs.filter(log => log.level === 'warn').length,
    }

    // 统计各级别日志数量
    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1
    })

    return stats
  }
}

// 创建全局日志实例
export const logger = new Logger()

// 便捷的日志函数
export const log = {
  debug: (category: LogCategory, message: string, data?: any, context?: any) => 
    logger.debug(category, message, data, context),
  info: (category: LogCategory, message: string, data?: any, context?: any) => 
    logger.info(category, message, data, context),
  warn: (category: LogCategory, message: string, data?: any, context?: any) => 
    logger.warn(category, message, data, context),
  error: (category: LogCategory, message: string, error?: Error, data?: any, context?: any) => 
    logger.error(category, message, error, data, context),
  
  // OAuth 专用
  oauth: {
    start: (provider: string, context?: any) => logger.oauthStart(provider, context),
    success: (provider: string, userId: string, context?: any) => logger.oauthSuccess(provider, userId, context),
    error: (provider: string, error: Error, context?: any) => logger.oauthError(provider, error, context),
    callback: (provider: string, data: any, context?: any) => logger.oauthCallback(provider, data, context),
  }
}

export default logger
