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

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogData {
  [key: string]: unknown
}

export function formatValue(val: unknown): string {
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (typeof val === 'string') {
    return val.length > 100 ? `"${val.slice(0, 100)}..."` : `"${val}"`
  }
  if (typeof val === 'number') return val.toString()
  if (typeof val === 'boolean') return val.toString()
  if (Array.isArray(val)) return `[${val.length}]`
  if (typeof val === 'object') {
    return `{${Object.keys(val as object).length}}`
  }
  return String(val)
}

export function formatData(data: LogData): string {
  return Object.entries(data)
    .map(([key, value]) => `${key}=${formatValue(value)}`)
    .join(' ')
}

export function formatLogMessage(category: LogCategory, action: string, data?: LogData): string {
  const timestamp = new Date().toISOString()
  const dataStr = data ? ' ' + formatData(data) : ''
  return `[${timestamp}] ${category}:${action}${dataStr}`
}
