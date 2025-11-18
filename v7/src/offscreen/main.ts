import { handleRun, type RunPayload } from './handleRun'

import { Logger } from '@/shared/logger'

Logger.setContext('offscreen')

const controllers = new Map<string, AbortController>()

chrome.runtime.onMessage.addListener((msg, _s, send) => {
  const m = msg as { channel?: string; id?: string; tabId?: number; data?: unknown; control?: string; target?: string }
  const { channel, id, tabId, data, control, target } = m
  if (channel !== 'offscreen') return false

  if (control === 'cancel' && target) {
    const existing = controllers.get(target)
    if (existing) {
      existing.abort()
      controllers.delete(target)
      Logger.logDirectSend(tabId || 0, 'offscreen', 'cancelled', { id: target })
    }
    send?.('ok')
    return true
  }

  if (!tabId) return false
  const payload = data as {
    kind?: string
    run?: RunPayload
    globals?: Record<string, unknown>
    pageUrl?: string
    ruleOverrides?: Record<string, boolean>
  }
  if (payload?.kind !== 'runRules' && payload?.kind !== 'runTyped') return false

  ;(async () => {
    try {
      Logger.logDirectSend(tabId, 'offscreen', 'receive', { id, kind: payload.kind, pageUrl: payload.pageUrl || '(none)' })
      if (!payload.run) throw new Error('missing-run-payload')
      const controller = new AbortController()
      if (id) controllers.set(id, controller)
      const res = await handleRun(tabId, payload.run, payload.globals, payload.pageUrl, payload.ruleOverrides, id, controller.signal)
      if (id) controllers.delete(id)
      Logger.logDirectSend(tabId, 'offscreen', 'send results', { id, results: res.length })
      await chrome.runtime.sendMessage({ channel: 'offscreen', replyTo: id, data: res })
      send?.('ok')
    } catch (err) {
      if (id) controllers.delete(id)
      Logger.logDirectSend(tabId, 'offscreen', 'error', { id, error: String(err) })
      await chrome.runtime.sendMessage({ channel: 'offscreen', replyTo: id, error: String(err) })
      send?.({ error: String(err) })
    }
  })()

  return true
})
