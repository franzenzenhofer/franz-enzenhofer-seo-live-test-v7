import { mergeRunResults, normalizeRunResult } from './runResults'

import { registry } from '@/rules/registry'
import { requiresCompleteDomFacts } from '@/rules/ruleInputs'
import { runAll } from '@/core/run'
import { pageFromEvents } from '@/shared/page'
import { Logger } from '@/shared/logger'
import { boundResults } from '@/shared/boundResult'
import type { Run } from '@/background/pipeline/types'
import type { RegisteredRule } from '@/core/types'

export type RunPayload = Run

// The background's override map is the authoritative rule set for a run: a rule
// absent from it (e.g. debug rules while the Debug data setting is off) does not
// take part at all - it must not run, and must not get a placeholder result.
const applyRuleOverrides = (overrides?: Record<string, boolean>): RegisteredRule[] => {
  if (!overrides) return [...registry]
  return registry
    .filter((rule) => typeof overrides[rule.id] === 'boolean')
    .map((rule) => ({ ...rule, enabled: overrides[rule.id]! }))
}

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
  const page = await pageFromEvents(run.ev, makeDoc, () => pageUrl || 'about:blank', undefined, run.resources)
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

  const offscreenRules = rules.filter((rule) => {
    if (rule.input !== 'context' && rule.input !== 'compare') return false
    if (!requiresCompleteDomFacts(rule.id)) return true
    // Gate only on critical facts. A capped anchor/resource sample says nothing
    // about whether this rule's head directives were captured.
    return !!page.staticFacts && !page.staticFacts.criticalTruncated
  })
  const offscreenResults = await runAll(tabId, offscreenRules, page, { globals: globals || {} }, emitChunk, { signal })
  const results = mergeRunResults(rules, boundResults(page.phaseResults || []), boundResults(offscreenResults), runId)

  Logger.logDirectSend(tabId, 'offscreen', 'handle run done', {
    runId: run.id,
    results: results.length,
    duration: `${(performance.now() - start).toFixed(2)}ms`,
  })

  return results
}
