/**
 * Centralized Logging System - CLEAN CODE: NO FALLBACKS, FAIL LOUD
 */

import type { LogCategory, LogData } from './logger-types.js'
import { formatLogMessage } from './logger-types.js'
import { log as writeLog } from './logs.js'

export type { LogCategory, LogData } from './logger-types.js'

export class Logger {
  private static currentTabId: number | null = null
  private static contextName: string = 'unknown'
  static setTabId(tabId: number): void { this.currentTabId = tabId }
  static setContext(context: string): void { this.contextName = context }
  private static async getTabId(): Promise<number | null> {
    if (this.currentTabId !== null) return this.currentTabId
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tabs[0]?.id) return tabs[0].id
    }
    return null
  }
  static async log(category: LogCategory, action: string, data?: LogData): Promise<void> {
    const message = formatLogMessage(category, action, data)
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const tabId = await this.getTabId()
      await chrome.runtime.sendMessage({ channel: 'log', tabId, message })
    }
  }
  static logSync(category: LogCategory, action: string, data?: LogData): void {
    const message = formatLogMessage(category, action, data)
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ channel: 'log', tabId: this.currentTabId, message })
    }
  }
  static async logDirect(tabId: number, category: LogCategory, action: string, data?: LogData): Promise<void> {
    const message = formatLogMessage(category, action, data)
    await writeLog(tabId, message)
  }
  static startTimer(label: string): () => Promise<void> {
    const start = performance.now()
    const id = Math.random().toString(36).slice(2, 9)
    this.logSync('perf', 'start', { operation: label, id })
    return async () => {
      const duration = (performance.now() - start).toFixed(2)
      await this.log('perf', 'end', { operation: label, id, duration: `${duration}ms` })
    }
  }
  static async logError(context: string, error: Error | unknown, additionalData?: LogData): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    await this.log('error', context, { error: errorMessage, stack: stack?.split('\n')[0] || 'no-stack', ...additionalData })
  }
  static async logWarn(context: string, message: string, data?: LogData): Promise<void> {
    await this.log('warn', context, { message, ...data })
  }
}

export const logger = Logger
