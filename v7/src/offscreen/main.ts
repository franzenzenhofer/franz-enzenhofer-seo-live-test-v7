// Offscreen runner for typed rules
import { registry } from '@/rules/registry'
import { runAll } from '@/core/run'
import type { EventRec } from '@/background/pipeline/types'
type Run = { id: number; ev: EventRec[]; domDone?: boolean }

const handleRun = async (_rules: unknown[], run: Run, globals?: Record<string, unknown>) => {
  const lastDom = [...run.ev].reverse().find((e) => e.t === 'dom:document_idle' || e.t === 'dom:document_end')
  type DomPayload = { html?: string }
  const html = (lastDom?.d as DomPayload | undefined)?.html || ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  let status: number|undefined; let headers: Record<string,string>|undefined
  try {
    const r = await fetch(location.href, { method: 'HEAD', redirect: 'follow' })
    status = r.status; const h: Record<string,string> = {}; r.headers.forEach((v,k)=>h[k.toLowerCase()]=v); headers = h
  } catch { /* ignore */ }
  return runAll(registry as import('@/core/types').Rule[], { html, url: location.href, doc, status, headers }, { globals: globals || {} })
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
