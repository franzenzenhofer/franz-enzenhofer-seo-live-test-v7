import { describe, it, expect } from 'vitest'
import { cleanupOldResults } from '@/shared/results'
import type { Result } from '@/shared/results'

describe('cleanupOldResults', () => {
  const makeResult = (runId: string, name: string): Result => ({
    name,
    label: 'TEST',
    message: `Result from ${runId}`,
    type: 'ok',
    runIdentifier: runId,
  })

  const makeOldResult = (name: string): Result => ({
    name,
    label: 'TEST',
    message: 'Old result without runId',
    type: 'info',
  })

  it('keeps last 3 runs by default', () => {
    const results: Result[] = [
      makeResult('run-1-1000-aaa', 'r1a'),
      makeResult('run-1-1000-aaa', 'r1b'),
      makeResult('run-1-2000-bbb', 'r2a'),
      makeResult('run-1-3000-ccc', 'r3a'),
      makeResult('run-1-4000-ddd', 'r4a'),
      makeResult('run-1-4000-ddd', 'r4b'),
    ]
    const cleaned = cleanupOldResults(results)
    expect(cleaned).toHaveLength(4)
    expect(cleaned.filter((r) => r.runIdentifier === 'run-1-2000-bbb')).toHaveLength(1)
    expect(cleaned.filter((r) => r.runIdentifier === 'run-1-3000-ccc')).toHaveLength(1)
    expect(cleaned.filter((r) => r.runIdentifier === 'run-1-4000-ddd')).toHaveLength(2)
    expect(cleaned.every((r) => r.runIdentifier !== 'run-1-1000-aaa')).toBe(true)
  })

  it('keeps last N runs when specified', () => {
    const results: Result[] = [
      makeResult('run-1-1000-aaa', 'r1a'),
      makeResult('run-1-2000-bbb', 'r2a'),
      makeResult('run-1-3000-ccc', 'r3a'),
      makeResult('run-1-4000-ddd', 'r4a'),
    ]
    const cleaned = cleanupOldResults(results, 2)
    expect(cleaned).toHaveLength(2)
    expect(cleaned.filter((r) => r.runIdentifier === 'run-1-3000-ccc')).toHaveLength(1)
    expect(cleaned.filter((r) => r.runIdentifier === 'run-1-4000-ddd')).toHaveLength(1)
  })

  it('discards results without runIdentifier', () => {
    const results: Result[] = [
      makeOldResult('old1'),
      makeResult('run-1-1000-aaa', 'r1a'),
      makeOldResult('old2'),
      makeResult('run-1-2000-bbb', 'r2a'),
    ]
    const cleaned = cleanupOldResults(results)
    expect(cleaned).toHaveLength(2)
    expect(cleaned.every((r) => r.runIdentifier)).toBe(true)
  })

  it('returns empty array for empty input', () => {
    const cleaned = cleanupOldResults([])
    expect(cleaned).toEqual([])
  })

  it('returns empty array when all results lack runIdentifier', () => {
    const results: Result[] = [makeOldResult('old1'), makeOldResult('old2'), makeOldResult('old3')]
    const cleaned = cleanupOldResults(results)
    expect(cleaned).toEqual([])
  })

  it('preserves order within same run', () => {
    const results: Result[] = [
      makeResult('run-1-1000-aaa', 'first'),
      makeResult('run-1-1000-aaa', 'second'),
      makeResult('run-1-1000-aaa', 'third'),
    ]
    const cleaned = cleanupOldResults(results)
    expect(cleaned.map((r) => r.name)).toEqual(['first', 'second', 'third'])
  })

  it('keeps all runs when fewer than limit', () => {
    const results: Result[] = [
      makeResult('run-1-1000-aaa', 'r1a'),
      makeResult('run-1-2000-bbb', 'r2a'),
    ]
    const cleaned = cleanupOldResults(results, 5)
    expect(cleaned).toHaveLength(2)
  })

  it('handles single run correctly', () => {
    const results: Result[] = [
      makeResult('run-1-1000-aaa', 'r1a'),
      makeResult('run-1-1000-aaa', 'r1b'),
      makeResult('run-1-1000-aaa', 'r1c'),
    ]
    const cleaned = cleanupOldResults(results, 1)
    expect(cleaned).toHaveLength(3)
    expect(cleaned.every((r) => r.runIdentifier === 'run-1-1000-aaa')).toBe(true)
  })
})
