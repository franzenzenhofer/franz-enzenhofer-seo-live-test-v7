// Global crash net for any MV3 context (SW, content, offscreen, side panel,
// options/report/ruleruns). Forwards reports to the SW via channel:'crash'.
// Idempotent per realm.

const INSTALLED = Symbol.for('f19n.crashNet.installed')

type CrashContext =
  | 'background'
  | 'content'
  | 'offscreen'
  | 'sidepanel'
  | 'settings'
  | 'report'
  | 'ruleruns'

interface CrashReport {
  channel: 'crash'
  context: CrashContext
  kind: 'error' | 'unhandledrejection'
  message: string
  stack: string
  at: number
}

const safeString = (val: unknown): string => {
  if (val instanceof Error) return val.message
  if (typeof val === 'string') return val
  try { return JSON.stringify(val) } catch { return String(val) }
}

const safeStack = (val: unknown): string => {
  if (val instanceof Error && val.stack) return val.stack.split('\n').slice(0, 8).join('\n')
  return ''
}

const forward = (report: CrashReport): void => {
  console.warn(`[crashNet] ${report.context}:${report.kind} ${report.message}`)
  if (typeof chrome === 'undefined' || !chrome.runtime?.id) return
  chrome.runtime.sendMessage(report).catch(() => {})
}

export interface CrashNetTarget extends EventTarget {
  [INSTALLED]?: true
}

export const installCrashNet = (context: CrashContext, target: CrashNetTarget = self as CrashNetTarget): () => void => {
  if (target[INSTALLED]) return () => {}
  target[INSTALLED] = true

  const onRejection = (event: Event): void => {
    const reason = (event as { reason?: unknown }).reason
    forward({ channel: 'crash', context, kind: 'unhandledrejection', message: safeString(reason), stack: safeStack(reason), at: Date.now() })
    event.preventDefault?.()
  }
  const onError = (event: Event): void => {
    const err = (event as { error?: unknown }).error
    const msg = (event as { message?: string }).message || safeString(err)
    forward({ channel: 'crash', context, kind: 'error', message: msg, stack: safeStack(err), at: Date.now() })
    event.preventDefault?.()
  }

  target.addEventListener('unhandledrejection', onRejection)
  target.addEventListener('error', onError)
  return () => {
    target.removeEventListener('unhandledrejection', onRejection)
    target.removeEventListener('error', onError)
    delete target[INSTALLED]
  }
}

export type { CrashReport, CrashContext }
