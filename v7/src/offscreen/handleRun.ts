import { mergeRunResults, normalizeRunResult } from './runResults'

import { registry } from '@/rules/registry'
import { runAll } from '@/core/run'
import { pageFromEvents } from '@/shared/page'
import { Logger } from '@/shared/logger'
import { boundResults } from '@/shared/boundResult'
import type { EventRec } from '@/background/pipeline/types'
import type { RegisteredRule } from '@/core/types'

export type RunPayload = { id: number; ev: EventRec[]; domDone?: boolean }

const applyRuleOverrides = (overrides?: Record<string, boolean>): RegisteredRule[] =>
  registry.map((rule) => (typeof overrides?.[rule.id] === 'boolean' ? { ...rule, enabled: overrides[rule.id]! } : rule))

export const handleRun = async (
  tabId: number,
  run: RunPayload,
  globals?: Record<string, unknown>,
  pageUrl?: string,
  ruleOverrides?: Record<string, boolean>,
  messageId?: string,
  signal?: AbortSignal,
) => {
  Logger.logDirectSend(tabId, 'offscreen', 'handle run start', {
    runId: run.id,
    events: run.ev.length,
    domDone: run.domDone,
    pageUrl: pageUrl || '(none)',
  })

  const start = performance.now()
  const makeDoc = (html: string) => new DOMParser().parseFromString(html, 'text/html')

  Logger.logDirectSend(tabId, 'page', 'build start', { events: run.ev.length })
  const page = await pageFromEvents(run.ev, makeDoc, () => pageUrl || 'about:blank')
  Logger.logDirectSend(tabId, 'page', 'build done', {
    url: page.url,
    staticNodes: page.staticFacts?.nodeCount || 0,
    hasDoc: !!page.doc,
    status: page.status,
  })

  const rules = applyRuleOverrides(ruleOverrides)
  const runId = typeof globals?.['runId'] === 'string' ? globals['runId'] : undefined
  const emitChunk = async (chunk: unknown[]) => {
    if (!messageId || !chunk.length) return
    const normalized = (chunk as import('@/core/types').Result[]).map((result) => normalizeRunResult(rules, result, runId))
    await chrome.runtime.sendMessage({ channel: 'offscreen', replyTo: messageId, chunk: true, data: normalized })
  }

  const offscreenRules = rules.filter((rule) => rule.input === 'context' || rule.input === 'compare')
  const offscreenResults = await runAll(tabId, offscreenRules, page, { globals: globals || {} }, emitChunk, { signal })
  const results = mergeRunResults(rules, boundResults(page.phaseResults || []), boundResults(offscreenResults), runId)

  Logger.logDirectSend(tabId, 'offscreen', 'handle run done', {
    runId: run.id,
    results: results.length,
    duration: `${(performance.now() - start).toFixed(2)}ms`,
  })

  return results
}
