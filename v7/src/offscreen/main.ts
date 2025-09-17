// Offscreen runner for typed rules
import { registry } from '@/rules/registry'
import { runAll } from '@/core/run'
import { pageFromEvents } from '@/shared/page'
import type { EventRec } from '@/background/pipeline/types'
type Run = { id: number; ev: EventRec[]; domDone?: boolean }

const handleRun = async (_rules: unknown[], run: Run, globals?: Record<string, unknown>) => {
  const makeDoc = (html: string) => new DOMParser().parseFromString(html, 'text/html')
  const page = await pageFromEvents(run.ev, makeDoc, () => location.href)
  return runAll(registry as import('@/core/types').Rule[], page, { globals: globals || {} })
}

chrome.runtime.onMessage.addListener(async (msg, _s, send) => {
  if (msg?.channel !== 'offscreen') return
  const { id, data } = msg
  if (data?.kind === 'runRules' || data?.kind === 'runTyped') {
    const res = await handleRun(data.rules, data.run, data.globals)
    chrome.runtime.sendMessage({ channel: 'offscreen', replyTo: id, data: res })
  }
  send?.('ok')
})
