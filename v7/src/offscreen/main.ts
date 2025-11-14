// Offscreen runner for typed rules
import { registry } from '@/rules/registry'
import { runAll } from '@/core/run'
import { pageFromEvents } from '@/shared/page'
import { Logger } from '@/shared/logger'
import type { EventRec } from '@/background/pipeline/types'
type Run = { id: number; ev: EventRec[]; domDone?: boolean }

// Set context for logging
Logger.setContext('offscreen')

const handleRun = async (_rules: unknown[], run: Run, globals?: Record<string, unknown>) => {
  await Logger.log('offscreen', 'handle run start', {
    runId: run.id,
    events: run.ev.length,
    domDone: run.domDone,
  })

  const start = performance.now()

  const makeDoc = (html: string) => new DOMParser().parseFromString(html, 'text/html')

  await Logger.log('page', 'build start', { events: run.ev.length })

  const page = await pageFromEvents(run.ev, makeDoc, () => location.href)

  await Logger.log('page', 'build done', {
    url: page.url,
    htmlSize: page.html?.length || 0,
    hasDoc: !!page.doc,
    status: page.status,
  })

  const results = await runAll(registry as import('@/core/types').Rule[], page, { globals: globals || {} })

  const duration = (performance.now() - start).toFixed(2)

  await Logger.log('offscreen', 'handle run done', {
    runId: run.id,
    results: results.length,
    duration: `${duration}ms`,
  })

  return results
}

chrome.runtime.onMessage.addListener(async (msg, _s, send) => {
  if (msg?.channel !== 'offscreen') return

  await Logger.log('offscreen', 'receive message', {
    channel: msg.channel,
    hasData: !!msg.data,
  })

  const { id, data } = msg
  if (data?.kind === 'runRules' || data?.kind === 'runTyped') {
    await Logger.log('offscreen', 'execute', {
      kind: data.kind,
      runId: data.run?.id,
    })

    const res = await handleRun(data.rules, data.run, data.globals)

    await Logger.log('offscreen', 'send results', {
      replyTo: id,
      results: res.length,
    })

    chrome.runtime.sendMessage({ channel: 'offscreen', replyTo: id, data: res })
  }
  send?.('ok')
})
