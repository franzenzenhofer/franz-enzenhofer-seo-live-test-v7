import { describe, it, expect } from 'vitest'

import { dedupRunner } from '@/background/rules/dedup'

describe('dedupRunner', () => {
  it('keeps distinct rules even when names match', () => {
    const runId = 'run-1'
    const results = [
      { name: 'Article structured data', ruleId: 'discover:article-structured-data', runIdentifier: runId },
      { name: 'Article structured data', ruleId: 'dom:ldjson', runIdentifier: runId },
    ]
    const deduped = dedupRunner(results)
    expect(deduped).toHaveLength(2)
  })
})
