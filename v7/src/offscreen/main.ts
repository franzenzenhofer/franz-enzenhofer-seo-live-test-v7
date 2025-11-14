// Offscreen runner for typed rules
import { registry } from '@/rules/registry'
import { runAll } from '@/core/run'
import { pageFromEvents } from '@/shared/page'
import { Logger } from '@/shared/logger'
import type { EventRec } from '@/background/pipeline/types'
type Run = { id: number; ev: EventRec[]; domDone?: boolean }

// Set context for logging
Logger.setContext('offscreen')

const handleRun = async (tabId: number, _rules: unknown[], run: Run, globals?: Record<string, unknown>) => {
  Logger.logDirect(tabId, 'offscreen', 'handle run start', {
    runId: run.id,
    events: run.ev.length,
    domDone: run.domDone,
  })

  const start = performance.now()

  const makeDoc = (html: string) => new DOMParser().parseFromString(html, 'text/html')

  Logger.logDirect(tabId, 'page', 'build start', { events: run.ev.length })

  const page = await pageFromEvents(run.ev, makeDoc, () => location.href)

  Logger.logDirect(tabId, 'page', 'build done', {
    url: page.url,
    htmlSize: page.html?.length || 0,
    hasDoc: !!page.doc,
    status: page.status,
  })

  const results = await runAll(registry as import('@/core/types').Rule[], page, { globals: globals || {} })

  const duration = (performance.now() - start).toFixed(2)

  Logger.logDirect(tabId, 'offscreen', 'handle run done', {
    runId: run.id,
    results: results.length,
    duration: `${duration}ms`,
  })

  return results
}

chrome.runtime.onMessage.addListener(async (msg, _s, send) => {
  const m = msg as { channel?: string; id?: string; tabId?: number; data?: unknown }
  const { channel, id, tabId, data } = m

  if (channel !== 'offscreen') return
  if (!tabId) return

  const payload = data as { kind?: string; rules?: unknown[]; run?: unknown; globals?: Record<string, unknown> }

  if (payload?.kind === 'runRules' || payload?.kind === 'runTyped') {
    Logger.logDirect(tabId, 'offscreen', 'receive', { id, kind: payload.kind })

    const res = await handleRun(tabId, payload.rules || [], payload.run as Run, payload.globals)

    Logger.logDirect(tabId, 'offscreen', 'send results', { id, results: res.length })

    chrome.runtime.sendMessage({ channel: 'offscreen', replyTo: id, data: res })
  }
  send?.('ok')
})
