import { buildPendingResults } from './pending'
import type { RuleResult } from './types'

import type { Rule } from '@/core/types'
import { cleanupOldResults } from '@/shared/results'
import { log } from '@/shared/logs'

/**
 * Seeds the results store at the start of a run. "Pending" must mean "still to
 * run": rules already answered by the content script's phase runners are seeded
 * with their result, not a placeholder that only clears at the final merge.
 */
export const prepareResultsStorage = async (
  tabId: number,
  key: string,
  enabledRules: Rule[],
  runId: string,
  runIndexByRuleId: Record<string, number>,
  settled: RuleResult[] = [],
) => {
  const { [key]: existingResults } = await chrome.storage.local.get(key)
  const cleaned = cleanupOldResults((existingResults as RuleResult[]) || [], 2)
  await log(tabId, `runner:cleanup tab=${tabId} runId=${runId} kept=${cleaned.length} from previous runs`)
  const answered = new Set(settled.map((result) => result.ruleId))
  const pending = buildPendingResults(enabledRules.filter((rule) => !answered.has(rule.id)), runId, runIndexByRuleId)
  const combined = [...cleaned, ...settled, ...pending]
  if (!combined.length) return
  await chrome.storage.local.set({ [key]: combined })
  await log(tabId, `runner:seed tab=${tabId} runId=${runId} pending=${pending.length} settled=${settled.length} total=${combined.length}`)
}
