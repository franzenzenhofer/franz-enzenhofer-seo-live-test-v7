import { describe, expect, it } from 'vitest'

import { extractLogsSummary } from '@/logs/LogsSummary'

const sampleStart = '[2025-11-18T08:14:02.108Z] offscreen:rules:start total=100 enabled=100 disabled=0 url="https://example.com"'
const sampleRulesDone = '[2025-11-18T08:14:15.432Z] offscreen:rules:done total=212 byType={"ok":55}'
const sampleRunnerDone = '[2025-11-18T08:14:15.466Z] runner:done tab=1 runId=run-1 results=212 status=completed'

describe('extractLogsSummary', () => {
  it('prefers rules:done when present', () => {
    const { results } = extractLogsSummary([sampleStart, sampleRulesDone])
    expect(results).toBe(212)
  })

  it('falls back to runner:done when rules summary missing', () => {
    const { results } = extractLogsSummary([sampleStart, sampleRunnerDone])
    expect(results).toBe(212)
  })

  it('returns nulls when start log missing', () => {
    const summary = extractLogsSummary([sampleRunnerDone])
    expect(summary).toEqual({ total: null, enabled: null, results: null })
  })
})
