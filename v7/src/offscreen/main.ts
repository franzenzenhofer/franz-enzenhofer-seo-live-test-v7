import { handleRun, type RunPayload } from './handleRun'

import { Logger } from '@/shared/logger'

// Offscreen context logs
Logger.setContext('offscreen')

chrome.runtime.onMessage.addListener((msg, _s, send) => {
  const m = msg as { channel?: string; id?: string; tabId?: number; data?: unknown }
  const { channel, id, tabId, data } = m
  if (channel !== 'offscreen' || !tabId) return false

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

      const res = await handleRun(tabId, payload.run, payload.globals, payload.pageUrl, payload.ruleOverrides, id)

      Logger.logDirectSend(tabId, 'offscreen', 'send results', { id, results: res.length })
      await chrome.runtime.sendMessage({ channel: 'offscreen', replyTo: id, data: res })
      send?.('ok')
    } catch (err) {
      Logger.logDirectSend(tabId, 'offscreen', 'error', { id, error: String(err) })
      send?.({ error: String(err) })
    }
  })()

  return true
})
