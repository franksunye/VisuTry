/**
 * 运行时日志系统
 * 支持开发环境和生产环境的日志记录和监控
 * 生产环境日志通过 Axiom 发送到云端
 */

import { Axiom } from '@axiomhq/js'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type LogCategory = 'auth' | 'oauth' | 'api' | 'database' | 'upload' | 'payment' | 'web' | 'general' | 'email' | 'grsai' | 'grsai-face' | 'tryon-service' | 'face-analysis' | 'face-analysis-service' | 'quota' | 'cron' | 'store' | 'face-shape' | 'frame-compare' | 'style-explorer' | 'generation'

type LogScalar = string | number | boolean | null
export type LogValue = LogScalar | LogValue[] | { [key: string]: LogValue }
export type LogData = Record<string, LogValue>

const MAX_LOG_STRING_LENGTH = 512
const MAX_LOG_ARRAY_ITEMS = 20
const MAX_LOG_OBJECT_KEYS = 64

// Axiom indexes object keys as fields. Keep this list deliberately explicit so
// a provider response, request body, or future object spread cannot create new
// production columns by accident. Consumer-funnel fields are included because
// they are part of the active observation/reporting contract.
const ALLOWED_LOG_DATA_FIELDS = new Set([
  'aborted', 'access', 'accessMode', 'active', 'acquisition_medium',
  'acquisition_source', 'agent_source', 'amount',
  'analytics_schema_version', 'apiTime', 'attempt', 'attemptNumber', 'baseUrl',
  'batchId', 'batchIndex', 'browser_language', 'browser_languages', 'bufferSize',
  'campaign', 'campaign_id', 'campaign_name', 'candidateCount', 'category',
  'checkoutContext', 'checkout_locale', 'clientSubmissionId', 'code',
  'completion_status', 'completionTimeMs', 'connectionTimeout', 'consumer_funnel_id',
  'contentLength', 'contentType', 'created', 'createdAt', 'currentStatus',
  'customerId', 'destination', 'detectedShape', 'deviceType', 'detail', 'diagnostics', 'duration',
  'durationMs', 'emailId', 'endpoint', 'entry_point', 'error', 'errorMessage',
  'errorName', 'errorType', 'event_id', 'event_name', 'eventCreated', 'experienceId',
  'externalTaskId', 'failureReason', 'failCount', 'fetchedPageCount', 'fileName',
  'fileSize', 'finalUrl', 'frame_category', 'framePresetId', 'geometryQuality',
  'geometryStatus', 'geo_country', 'hasCallbackUrl', 'hasContent', 'hasData',
  'hasError', 'hasId', 'hasImageUrl', 'hasMetadata', 'hasResultImage', 'httpStatus',
  'httpStatusText', 'imageSize', 'imageTransport', 'inlineImageKb', 'intentId',
  'isAsync', 'isNewCompletion', 'isNewUser', 'isPremium', 'isSameMetadata',
  'isSameObject', 'itemImageFingerprint', 'itemImageName', 'itemImageSize',
  'itemSha256', 'itemUrl', 'landing_locale', 'landing_page', 'landing_surface',
  'lastModified', 'locale', 'locale_changed', 'markedFailed', 'maxRetries', 'merchantFrameId',
  'merchantId', 'merchantSessionId', 'merchantSlug', 'message', 'method', 'model',
  'msg', 'normalizedStatus', 'origin', 'page_path', 'path', 'pathname',
  'paymentStatus', 'photoAssetId', 'planCode', 'pollDuration', 'presetCount',
  'presetId', 'presetIds', 'product_path', 'productType', 'progress', 'provider',
  'providerId', 'providerTaskId', 'query_cluster', 'quotaSource', 'rawStatus',
  'recommendation_count', 'referrer_host', 'remaining', 'remainingCredits',
  'reportUnlocked', 'requiredCredits', 'responseTime', 'resultStatus', 'retryCount',
  'retryable', 'role', 'route', 'sameContentSha256', 'sameFileName', 'sameFileSize',
  'sameMetadata', 'sameObjectReference', 'scanned', 'site_locale', 'skipped',
  'source', 'sourceAccess', 'sourceBlobAccess', 'source_class', 'source_page',
  'sourceHostnames', 'platforms', 'status', 'statusChanged', 'storeId', 'subscriptionId',
  'successful', 'success', 'surface', 'syncReason', 'taskId', 'taskUserId', 'textResponse',
  'timeoutMs', 'total', 'totalDuration', 'totalTime', 'traffic_class',
  'tryOnType', 'type', 'updatedAt', 'uploadTarget', 'usagePolicyKind',
  'usageSettled', 'userId', 'userIntent', 'user_intent', 'userSha256', 'vercel',
  'content_cluster', 'geo_region', 'pricing_locale',
  'assets', 'itemFile', 'itemImage', 'metadata', 'orphans', 'threeDayEmails',
  'twentyFourHourEmails', 'userFile', 'userImage',
])

const ALLOWED_LOG_ARRAY_FIELDS = new Set([
  'browser_languages', 'platforms', 'presetIds', 'sourceHostnames',
])

const ALLOWED_LOG_NESTED_FIELDS: Record<string, Set<string>> = {
  assets: new Set(['blockedScanned', 'deleted', 'failed', 'scanned']),
  diagnostics: new Set([
    'bitmapDecodeErrorName', 'bitmapDecodeErrorMessage', 'code',
    'compressionErrorName', 'compressionErrorMessage', 'compressionFailed',
    'cpuRuntimeErrorName', 'cpuRuntimeErrorMessage', 'detectedFileFormat',
    'detectorFileSize', 'detectorFileType', 'failureReason', 'message',
    'rawStatus', 'sourceFileSize', 'sourceFileType',
  ]),
  itemFile: new Set(['name', 'size', 'type']),
  itemImage: new Set(['name', 'size', 'type']),
  metadata: new Set(['clientSubmissionId', 'code', 'isAsync', 'message', 'name', 'providerId', 'retryCount', 'serviceType']),
  orphans: new Set(['deleted', 'failed', 'scanned']),
  threeDayEmails: new Set(['failed', 'sent']),
  twentyFourHourEmails: new Set(['failed', 'sent']),
  userFile: new Set(['name', 'size', 'type']),
  userImage: new Set(['name', 'size', 'type']),
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function truncateLogString(value: string): string {
  return value.length > MAX_LOG_STRING_LENGTH ? value.slice(0, MAX_LOG_STRING_LENGTH) : value
}

function sanitizeLogValue(value: unknown, path: string, seen: Set<object>): LogValue | undefined {
  if (typeof value === 'string') return truncateLogString(value)
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'boolean' || value === null) return value

  if (Array.isArray(value)) {
    if (!ALLOWED_LOG_ARRAY_FIELDS.has(path) || value.some(item => isRecord(item) || Array.isArray(item))) {
      return undefined
    }
    return value.slice(0, MAX_LOG_ARRAY_ITEMS).map(item => sanitizeLogValue(item, path, seen)).filter((item): item is LogValue => item !== undefined)
  }

  if (!isRecord(value) || seen.has(value)) return undefined
  seen.add(value)

  const allowedFields = ALLOWED_LOG_NESTED_FIELDS[path]
  if (!allowedFields) {
    seen.delete(value)
    return undefined
  }

  const result: Record<string, LogValue> = {}
  for (const [key, nestedValue] of Object.entries(value)) {
    if (Object.keys(result).length >= MAX_LOG_OBJECT_KEYS || !allowedFields.has(key)) continue
    const sanitized = sanitizeLogValue(nestedValue, `${path}.${key}`, seen)
    if (sanitized !== undefined) result[key] = sanitized
  }

  seen.delete(value)
  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Normalize the only payload that may be sent to Axiom.
 * Unknown keys and arbitrary nested objects are intentionally dropped.
 */
export function normalizeLogData(data: unknown): LogData | undefined {
  if (!isRecord(data)) return undefined

  const result: LogData = {}
  const seen = new Set<object>()
  for (const [key, value] of Object.entries(data)) {
    if (Object.keys(result).length >= MAX_LOG_OBJECT_KEYS || !ALLOWED_LOG_DATA_FIELDS.has(key)) continue
    const sanitized = sanitizeLogValue(value, key, seen)
    if (sanitized !== undefined) result[key] = sanitized
  }

  return Object.keys(result).length > 0 ? result : undefined
}

function normalizeLogContext(context: unknown) {
  if (!isRecord(context)) return {}

  const result: Pick<LogEntry, 'userId' | 'sessionId' | 'userAgent' | 'ip' | 'accept_language' | 'url' | 'method'> = {}
  for (const key of ['userId', 'sessionId', 'userAgent', 'ip', 'accept_language', 'url', 'method'] as const) {
    const value = context[key]
    if (typeof value === 'string') result[key] = truncateLogString(value)
  }
  return result
}

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  data?: LogData
  userId?: string
  sessionId?: string
  userAgent?: string
  ip?: string
  accept_language?: string
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
  private axiom: Axiom | null = null

  constructor() {
    // 初始化 Axiom 客户端（仅在生产环境）
    if (this.isProduction && process.env.AXIOM_TOKEN) {
      try {
        this.axiom = new Axiom({
          token: process.env.AXIOM_TOKEN,
          orgId: process.env.AXIOM_ORG_ID,
        })
      } catch (error) {
        console.error('Failed to initialize Axiom client:', error)
      }
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: unknown,
    context?: unknown,
    error?: Error,
  ): LogEntry {
    const contextFields = normalizeLogContext(context)
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: normalizeLogData(data),
      ...contextFields,
    }

    // 处理错误对象
    if (error) {
      entry.error = {
        name: truncateLogString(error.name),
        message: truncateLogString(error.message),
        stack: this.isDevelopment ? error.stack : undefined,
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

    // 生产环境：同时输出到 Vercel 日志和 Axiom
    if (this.isProduction && entry.level !== 'debug') {
      // 输出到 Vercel 日志（console）
      this.handleProductionError(entry)
      // 异步发送到 Axiom（不阻塞主流程）
      this.sendToAxiom(entry)
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

  private async sendToAxiom(entry: LogEntry) {
    if (!this.axiom) return

    try {
      // 构建发送到 Axiom 的日志对象
      const axiomLog = {
        timestamp: entry.timestamp,
        level: entry.level,
        category: entry.category,
        message: entry.message,
        id: entry.id,
        userId: entry.userId,
        sessionId: entry.sessionId,
        userAgent: entry.userAgent,
        ip: entry.ip,
        accept_language: entry.accept_language,
        url: entry.url,
        method: entry.method,
        error: entry.error,
        // Re-apply the boundary at the transport edge as a defense in depth
        // measure for any future LogEntry construction path.
        data: normalizeLogData(entry.data),
      }

      // 异步发送到 Axiom，不阻塞主流程
      await this.axiom.ingest(process.env.AXIOM_DATASET || 'visutry-logs', [axiomLog])
    } catch (error) {
      // 发送失败不影响应用运行，仅输出到控制台
      console.error('Failed to send log to Axiom:', error instanceof Error ? error.message : error)
    }
  }

  private handleProductionError(entry: LogEntry) {
    // 生产环境日志输出到 Vercel（同时也发送到 Axiom）
    const logData = {
      id: entry.id,
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      category: entry.category,
      userId: entry.userId,
      url: entry.url,
      error: entry.error,
    }

    switch (entry.level) {
      case 'error':
        console.error('❌ Production Error:', logData)
        break
      case 'warn':
        console.warn('⚠️ Production Warning:', logData)
        break
      case 'info':
        console.log('ℹ️ Production Info:', logData)
        break
    }
  }

  // 公共日志方法
  debug(category: LogCategory, message: string, data?: unknown, context?: unknown) {
    // Production drops debug from Axiom/Vercel — skip entry construction too.
    if (this.isProduction) return
    this.addLog(this.createLogEntry('debug', category, message, data, context))
  }

  info(category: LogCategory, message: string, data?: unknown, context?: unknown) {
    this.addLog(this.createLogEntry('info', category, message, data, context))
  }

  warn(category: LogCategory, message: string, data?: unknown, context?: unknown) {
    this.addLog(this.createLogEntry('warn', category, message, data, context))
  }

  error(category: LogCategory, message: string, error?: Error, data?: unknown, context?: unknown) {
    this.addLog(this.createLogEntry('error', category, message, data, context, error))
  }

  // OAuth 专用日志方法
  oauthStart(provider: string, context?: unknown) {
    this.info('oauth', `OAuth login started with ${provider}`, { provider }, context)
  }

  oauthSuccess(provider: string, userId: string, context?: unknown) {
    this.info('oauth', `OAuth login successful with ${provider}`, { provider, userId }, context)
  }

  oauthError(provider: string, error: Error, context?: unknown) {
    this.error('oauth', `OAuth login failed with ${provider}`, error, { provider }, context)
  }

  oauthCallback(provider: string, _data: unknown, context?: unknown) {
    // Callback payloads are provider-controlled and can contain arbitrary
    // nested objects. Keep the event useful without forwarding that payload.
    this.debug('oauth', `OAuth callback received from ${provider}`, { provider }, context)
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
  debug: (category: LogCategory, message: string, data?: unknown, context?: unknown) =>
    logger.debug(category, message, data, context),
  info: (category: LogCategory, message: string, data?: unknown, context?: unknown) =>
    logger.info(category, message, data, context),
  warn: (category: LogCategory, message: string, data?: unknown, context?: unknown) =>
    logger.warn(category, message, data, context),
  error: (category: LogCategory, message: string, error?: Error, data?: unknown, context?: unknown) =>
    logger.error(category, message, error, data, context),
  
  // OAuth 专用
  oauth: {
    start: (provider: string, context?: unknown) => logger.oauthStart(provider, context),
    success: (provider: string, userId: string, context?: unknown) => logger.oauthSuccess(provider, userId, context),
    error: (provider: string, error: Error, context?: unknown) => logger.oauthError(provider, error, context),
    callback: (provider: string, data: unknown, context?: unknown) => logger.oauthCallback(provider, data, context),
  }
}

export function getRequestContext(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') || undefined
  const realIp = request.headers.get('x-real-ip') || undefined
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || undefined
  const userAgent = request.headers.get('user-agent') || undefined
  const acceptLanguageHeader = request.headers.get('accept-language') || undefined
  const accept_language = acceptLanguageHeader?.slice(0, 256) || undefined
  return {
    method: request.method,
    url: request.url,
    ip,
    userAgent,
    accept_language,
  }
}

export function getRequestLanguageContext(request: Request) {
  const acceptLanguageHeader = request.headers.get('accept-language') || undefined
  const accept_language = acceptLanguageHeader?.slice(0, 256) || undefined

  return { accept_language }
}

export default logger
