import { describe, it, expect, vi, beforeEach } from 'vitest'

import { findResultsByRunId } from '@/shared/results'

describe('findResultsByRunId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('finds results by runId across multiple tabs', async () => {
    const mockStorage = {
      'results:123': [
        { name: 'rule1', runIdentifier: 'run-old-123', type: 'ok', message: 'old', label: 'TEST' },
        { name: 'rule2', runIdentifier: 'run-old-123', type: 'warn', message: 'old', label: 'TEST' },
      ],
      'results:456': [
        { name: 'rule1', runIdentifier: 'run-new-456', type: 'ok', message: 'new', label: 'TEST' },
        { name: 'rule2', runIdentifier: 'run-new-456', type: 'error', message: 'new', label: 'TEST' },
      ],
      'results:789': [
        { name: 'rule1', runIdentifier: 'run-other-789', type: 'info', message: 'other', label: 'TEST' },
      ],
    }

    global.chrome = {
      storage: {
        local: {
          get: vi.fn().mockResolvedValue(mockStorage),
        },
      },
    } as never

    const result = await findResultsByRunId('run-new-456')

    expect(result).toEqual({
      tabId: 456,
      results: [
        { name: 'rule1', runIdentifier: 'run-new-456', type: 'ok', message: 'new', label: 'TEST' },
        { name: 'rule2', runIdentifier: 'run-new-456', type: 'error', message: 'new', label: 'TEST' },
      ],
    })
  })

  it('returns null when runId not found', async () => {
    const mockStorage = {
      'results:123': [
        { name: 'rule1', runIdentifier: 'run-old-123', type: 'ok', message: 'test', label: 'TEST' },
      ],
    }

    global.chrome = {
      storage: {
        local: {
          get: vi.fn().mockResolvedValue(mockStorage),
        },
      },
    } as never

    const result = await findResultsByRunId('run-nonexistent')
    expect(result).toBeNull()
  })

  it('returns null when no results in storage', async () => {
    global.chrome = {
      storage: {
        local: {
          get: vi.fn().mockResolvedValue({}),
        },
      },
    } as never

    const result = await findResultsByRunId('run-any')
    expect(result).toBeNull()
  })

  it('ignores non-results keys in storage', async () => {
    const mockStorage = {
      'results:123': [
        { name: 'rule1', runIdentifier: 'run-target', type: 'ok', message: 'test', label: 'TEST' },
      ],
      'results-meta:123': { url: 'https://example.com', runId: 'run-target' },
      'ui:pinnedRules': ['rule1'],
      randomKey: 'random value',
    }

    global.chrome = {
      storage: {
        local: {
          get: vi.fn().mockResolvedValue(mockStorage),
        },
      },
    } as never

    const result = await findResultsByRunId('run-target')

    expect(result).toEqual({
      tabId: 123,
      results: [
        { name: 'rule1', runIdentifier: 'run-target', type: 'ok', message: 'test', label: 'TEST' },
      ],
    })
  })
})
