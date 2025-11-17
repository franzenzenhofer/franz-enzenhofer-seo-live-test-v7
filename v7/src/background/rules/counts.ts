import type { RuleResult } from './types'

export const countResultTypes = (results: RuleResult[]) => {
  const counts = { ok: 0, warn: 0, error: 0, runtime_error: 0, info: 0, pending: 0, disabled: 0 }
  for (const r of results) {
    if (r.type === 'ok') counts.ok++
    else if (r.type === 'warn') counts.warn++
    else if (r.type === 'error') counts.error++
    else if (r.type === 'runtime_error') counts.runtime_error++
    else if (r.type === 'info') counts.info++
    else if (r.type === 'pending') counts.pending++
    else if (r.type === 'disabled') counts.disabled++
  }
  return counts
}
