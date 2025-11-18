import { buildPendingResults, buildRuleOverrides } from './pending'
import { allowedScheme, hasDomSnapshot, derivePageUrl, getPageUrl, checkUrlChange, summarizeEvents, persistResults } from './util'
import type { RuleResult } from './types'
import { createChunkSync } from './chunking'

import { getEnabledRules } from './index'

import type { Rule } from '@/core/types'
import { getRunTimeoutMs } from '@/core/ruleTimeouts'
import { cleanupOldResults } from '@/shared/results'
import { log } from '@/shared/logs'


export const buildRunGlobals = async (
  tabId: number,
  run: import('../pipeline/types').Run,
  runId: string,
  runTimestamp: Date,
) => {
  const { globalRuleVariables, googleApiAccessToken } = await chrome.storage.local.get([
    'globalRuleVariables',
    'googleApiAccessToken',
  ])
  const authStatus = googleApiAccessToken ? 'present' : 'missing'
  await log(tabId, `auth:token status=${authStatus} runId=${runId}`)
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
  return {
    enabled,
    ruleOverrides: buildRuleOverrides(rules),
    timeoutMs: getRunTimeoutMs(enabled.length ? enabled : rules),
  }
}

export const prepareResultsStorage = async (tabId: number, key: string, enabledRules: Rule[], runId: string) => {
  const { [key]: existingResults } = await chrome.storage.local.get(key)
  const cleaned = cleanupOldResults((existingResults as RuleResult[]) || [], 2)
  await log(tabId, `runner:cleanup tab=${tabId} runId=${runId} kept=${cleaned.length} from previous runs`)
  const pending = buildPendingResults(enabledRules, runId)
  const combined = [...cleaned, ...pending]
  if (combined.length) {
    await chrome.storage.local.set({ [key]: combined })
    await log(tabId, `runner:pending tab=${tabId} runId=${runId} seeded count=${pending.length} total=${combined.length}`)
  }
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
  createChunkSync,
}
