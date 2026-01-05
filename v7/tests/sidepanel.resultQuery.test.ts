import { describe, expect, it } from 'vitest'

import { buildPriorityFilter, parsePriorityToken } from '@/sidepanel/ui/priorityFilter'
import { matchesResult } from '@/sidepanel/ui/resultQuery'

const baseResult = {
  type: 'warn',
  priority: 180,
  label: 'HEAD',
  name: 'Example',
  message: 'Example message',
} as any

describe('sidepanel: resultQuery priority filters', () => {
  it('filters by comparison tokens', () => {
    const token = parsePriorityToken('p<200')
    const filter = buildPriorityFilter(token ? [token] : [])
    expect(matchesResult(baseResult, { types: ['warn'], q: '', priority: filter })).toBe(true)
    expect(matchesResult(baseResult, { types: ['warn'], q: '', priority: buildPriorityFilter([parsePriorityToken('p<100')!]) })).toBe(false)
  })

  it('filters by range tokens', () => {
    const token = parsePriorityToken('priority:100-200')
    const filter = buildPriorityFilter(token ? [token] : [])
    expect(matchesResult(baseResult, { types: ['warn'], q: '', priority: filter })).toBe(true)
    expect(matchesResult(baseResult, { types: ['warn'], q: '', priority: buildPriorityFilter([parsePriorityToken('priority:10-50')!]) })).toBe(false)
  })
})
