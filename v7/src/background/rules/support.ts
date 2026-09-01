import { getLedger } from '../history/listeners'

import { buildPendingResults, buildRuleOverrides } from './pending'
import { allowedScheme, hasDomSnapshot, derivePageUrl, getPageUrl, checkUrlChange, summarizeEvents, persistResults } from './util'
import { createChunkSync } from './chunking'
import { prepareResultsStorage } from './seedResults'

import { getEnabledRules } from './index'

import type { Rule } from '@/core/types'
import { getRunTimeoutMs } from '@/core/ruleTimeouts'
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
  const navigationLedger = await getLedger(tabId)
  return {
    variables: globalRuleVariables || {},
    googleApiAccessToken: googleApiAccessToken || null,
    events: run.ev,
    rulesUrl: chrome.runtime.getURL('src/sidepanel.html'),
    codeviewUrl: chrome.runtime.getURL('src/sidepanel.html#codeview'),
    runId,
    runTimestamp: runTimestamp.toISOString(),
    navigationLedger,
  }
}

export const prepareRulesForRun = (rules: Rule[]) => {
  const enabled = rules.filter((rule) => rule.enabled)
  const runIndexByRuleId = enabled.reduce<Record<string, number>>((acc, rule, idx) => {
    acc[rule.id] = idx + 1
    return acc
  }, {})
  return {
    enabled,
    ruleOverrides: buildRuleOverrides(rules),
    timeoutMs: getRunTimeoutMs(enabled.length ? enabled : rules),
    runIndexByRuleId,
  }
}

export {
  prepareResultsStorage,
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
