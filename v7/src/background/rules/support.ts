import { buildPendingResults, buildRuleOverrides } from './pending'
import { allowedScheme, hasDomSnapshot, derivePageUrl, getPageUrl, checkUrlChange, summarizeEvents, persistResults } from './util'
import type { RuleResult } from './types'

import { getEnabledRules } from './index'

import type { Rule } from '@/core/types'


const FAST_TIMEOUT_MS = 15000
const SLOW_TIMEOUT_MS = 60000
const SLOW_RULE_TYPES = new Set(['psi', 'gsc'])

export const buildRunGlobals = async (
  run: import('../pipeline/types').Run,
  runId: string,
  runTimestamp: Date,
) => {
  const { globalRuleVariables, googleApiAccessToken } = await chrome.storage.local.get([
    'globalRuleVariables',
    'googleApiAccessToken',
  ])
  return {
    variables: globalRuleVariables || {},
    googleApiAccessToken: googleApiAccessToken || null,
    events: run.ev,
    rulesUrl: chrome.runtime.getURL('src/sidepanel.html'),
    codeviewUrl: chrome.runtime.getURL('src/sidepanel.html#codeview'),
    runId,
    runTimestamp: runTimestamp.toISOString(),
  }
}

export const prepareRulesForRun = (rules: Rule[]) => {
  const enabled = rules.filter((rule) => rule.enabled)
  const hasSlow = enabled.some((rule) => rule.what && SLOW_RULE_TYPES.has(rule.what))
  return {
    enabled,
    ruleOverrides: buildRuleOverrides(rules),
    timeoutMs: hasSlow ? SLOW_TIMEOUT_MS : FAST_TIMEOUT_MS,
  }
}

export const createChunkSync = (tabId: number, key: string) => {
  let queue = Promise.resolve()
  const append = (chunk: RuleResult[]) => {
    if (!chunk.length) return queue
    queue = queue.then(async () => {
      const got = await chrome.storage.local.get(key)
      const prev = got[key] as RuleResult[] | undefined
      await persistResults(tabId, key, prev, chunk)
    })
    return queue
  }
  const flush = () => queue
  return { append, flush }
}

export {
  buildPendingResults,
  buildRuleOverrides,
  allowedScheme,
  hasDomSnapshot,
  derivePageUrl,
  getPageUrl,
  checkUrlChange,
  summarizeEvents,
  persistResults,
  getEnabledRules,
}
