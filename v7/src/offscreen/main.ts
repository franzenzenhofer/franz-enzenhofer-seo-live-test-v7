import { handleRun, type RunPayload } from './handleRun'

import { Logger } from '@/shared/logger'
import { installCrashNet } from '@/shared/crashNet'

Logger.setContext('offscreen')
installCrashNet('offscreen')

const CONTROLLER_MAX_LIFETIME_MS = 90_000
const controllers = new Map<string, { ac: AbortController; timer: ReturnType<typeof setTimeout> }>()

const dropController = (id: string | undefined): void => {
  if (!id) return
  const entry = controllers.get(id)
  if (entry) { clearTimeout(entry.timer); controllers.delete(id) }
}

const registerController = (id: string | undefined, ac: AbortController): void => {
  if (!id) return
  const timer = setTimeout(() => {
    ac.abort(); controllers.delete(id)
    Logger.logDirectSend(0, 'offscreen', 'purge stale', { id, ageMs: CONTROLLER_MAX_LIFETIME_MS })
  }, CONTROLLER_MAX_LIFETIME_MS)
  controllers.set(id, { ac, timer })
}

chrome.runtime.onMessage.addListener((msg, _s, send) => {
  const m = msg as { channel?: string; id?: string; tabId?: number; data?: unknown; control?: string; target?: string }
  const { channel, id, tabId, data, control, target } = m
  if (channel !== 'offscreen') return false

  if (control === 'cancel' && target) {
    const existing = controllers.get(target)
    if (existing) {
      existing.ac.abort()
      dropController(target)
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
      registerController(id, controller)
      const res = await handleRun(tabId, payload.run, payload.globals, payload.pageUrl, payload.ruleOverrides, id, controller.signal)
      dropController(id)
      Logger.logDirectSend(tabId, 'offscreen', 'send results', { id, results: res.length })
      await chrome.runtime.sendMessage({ channel: 'offscreen', replyTo: id, data: res })
      send?.('ok')
    } catch (err) {
      dropController(id)
      Logger.logDirectSend(tabId, 'offscreen', 'error', { id, error: String(err) })
      await chrome.runtime.sendMessage({ channel: 'offscreen', replyTo: id, error: String(err) })
      send?.({ error: String(err) })
    }
  })()

  return true
})
