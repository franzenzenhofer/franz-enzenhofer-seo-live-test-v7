/**
 * Logger Types and Format Helpers
 */

export type LogCategory =
  | 'ui'
  | 'storage'
  | 'chrome'
  | 'dom'
  | 'rule'
  | 'rules'
  | 'event'
  | 'msg'
  | 'perf'
  | 'error'
  | 'warn'
  | 'offscreen'
  | 'run'
  | 'page'
  | 'req'
  | 'nav'
  | 'auth'
  | 'content'
  | 'alarm'
  | 'cache'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogData {
  [key: string]: unknown
}

export function formatValue(val: unknown): string {
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (typeof val === 'string') {
    // Truncate HTML content to 500 characters
    if (val.includes('<') && val.includes('>')) {
      const truncated = val.length > 500 ? val.substring(0, 500) + '...[truncated]' : val
      return JSON.stringify(truncated)
    }
    return JSON.stringify(val)
  }
  if (typeof val === 'number') return val.toString()
  if (typeof val === 'boolean') return val.toString()
  if (Array.isArray(val) || typeof val === 'object') {
    try {
      return JSON.stringify(val)
    } catch {
      if (Array.isArray(val)) return `[${val.length}]`
      return `{${Object.keys(val as object).length}}`
    }
  }
  return String(val)
}

export function formatData(data: LogData): string {
  return Object.entries(data)
    .map(([key, value]) => `${key}=${formatValue(value)}`)
    .join(' ')
}

export function formatLogMessage(context: string, category: LogCategory, action: string, data?: LogData): string {
  const timestamp = new Date().toISOString()
  const dataStr = data ? ' ' + formatData(data) : ''
  return `[${timestamp}] ${context}:${category}:${action}${dataStr}`
}
