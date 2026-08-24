import { runAll } from '@/core/run'
import { boundResults } from '@/shared/boundResult'
import type { Page, Result, Rule } from '@/core/types'
import type { DomPhase } from '@/shared/domFacts'

type PhaseRun = {
  tabId: number
  phase: DomPhase
  rules: Rule[]
  page: Page
  globals: Record<string, unknown>
}

export const runPhaseRules = async ({ tabId, phase, rules, page, globals }: PhaseRun): Promise<Result[]> => {
  const matching = rules.filter((rule) => rule.input === phase)
  const results: Result[] = []
  for (const rule of matching) {
    const result = await runAll(tabId, [rule], page, { globals })
    results.push(...boundResults(result))
  }
  return results
}
