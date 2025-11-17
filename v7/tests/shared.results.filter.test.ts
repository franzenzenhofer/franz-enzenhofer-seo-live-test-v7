import { describe, it, expect } from 'vitest'
import { filterResultsByRunId } from '@/shared/results'
import type { Result } from '@/shared/results'

describe('filterResultsByRunId', () => {
  const mockResults: Result[] = [
    {
      name: 'test1',
      label: 'TEST',
      message: 'Result from run 1',
      type: 'ok',
      runIdentifier: 'run-123-1700000000000-abc123',
    },
    {
      name: 'test2',
      label: 'TEST',
      message: 'Result from run 1',
      type: 'warn',
      runIdentifier: 'run-123-1700000000000-abc123',
    },
    {
      name: 'test3',
      label: 'TEST',
      message: 'Result from run 2',
      type: 'ok',
      runIdentifier: 'run-123-1700000001000-def456',
    },
    {
      name: 'test4',
      label: 'TEST',
      message: 'Result without runIdentifier (old)',
      type: 'info',
      // No runIdentifier (simulates old results)
    },
  ]

  it('returns all results when runId is undefined', () => {
    const filtered = filterResultsByRunId(mockResults, undefined)
    expect(filtered).toHaveLength(4)
    expect(filtered).toEqual(mockResults)
  })

  it('filters to only results matching the runId', () => {
    const filtered = filterResultsByRunId(mockResults, 'run-123-1700000000000-abc123')
    expect(filtered).toHaveLength(2)
    expect(filtered[0].name).toBe('test1')
    expect(filtered[1].name).toBe('test2')
  })

  it('returns different results for different runId', () => {
    const filtered = filterResultsByRunId(mockResults, 'run-123-1700000001000-def456')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('test3')
  })

  it('excludes results without runIdentifier when filtering', () => {
    const filtered = filterResultsByRunId(mockResults, 'run-123-1700000000000-abc123')
    expect(filtered.some((r) => r.name === 'test4')).toBe(false)
  })

  it('returns empty array when no results match runId', () => {
    const filtered = filterResultsByRunId(mockResults, 'run-999-nonexistent')
    expect(filtered).toHaveLength(0)
  })

  it('handles empty results array', () => {
    const filtered = filterResultsByRunId([], 'run-123-1700000000000-abc123')
    expect(filtered).toHaveLength(0)
  })

  it('returns empty array when filtering empty array with undefined runId', () => {
    const filtered = filterResultsByRunId([], undefined)
    expect(filtered).toHaveLength(0)
  })
})
