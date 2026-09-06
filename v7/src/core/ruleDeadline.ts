import { CANCELLATION_ERROR } from './rulePool'
import type { Ctx, Page, Rule } from './types'

import { abortScope, raceAbort, throwIfAborted } from '@/shared/abort'

export const TIMEOUT_ERROR = 'rule-timeout'
export const runWithDeadline = async (rule: Rule, page: Page, ctx: Ctx, options: { timeoutMs: number; signal?: AbortSignal }) => {
  const parent = options.signal || ctx.signal
  const scope = abortScope(options.timeoutMs, parent, TIMEOUT_ERROR)
  try {
    throwIfAborted(scope.signal)
    return await raceAbort(rule.run(page, { ...ctx, signal: scope.signal }), scope.signal)
  } catch (error) {
    if (parent?.aborted) throw new Error(CANCELLATION_ERROR)
    throw error
  } finally { scope.dispose() }
}
