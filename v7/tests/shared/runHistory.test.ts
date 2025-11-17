import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  readRunHistory,
  appendRunHistory,
  clearRunHistory,
  getTabRunHistory,
  getUrlRunHistory,
  findRunById,
} from '@/shared/runHistory'
import type { RunState } from '@/background/rules/runState'

// Mock chrome.storage.local
const mockStorage: Record<string, unknown> = {}

global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys) => {
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: mockStorage[keys] })
        }
        return Promise.resolve(mockStorage)
      }),
      set: vi.fn((items) => {
        Object.assign(mockStorage, items)
        return Promise.resolve()
      }),
      remove: vi.fn((keys) => {
        const keysArray = Array.isArray(keys) ? keys : [keys]
        keysArray.forEach((key) => delete mockStorage[key])
        return Promise.resolve()
      }),
    },
  },
} as any

describe('runHistory module', () => {
  const createMockRun = (overrides: Partial<RunState> = {}): RunState => ({
    runId: 'run-123-abc',
    tabId: 1,
    url: 'https://example.com',
    triggeredBy: 'manual',
    startedAt: '2025-01-01T00:00:00.000Z',
    status: 'completed',
    completedAt: '2025-01-01T00:00:05.000Z',
    resultCount: 10,
    ...overrides,
  })

  beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
  })

  describe('readRunHistory', () => {
    it('returns empty array when no history exists', async () => {
      const history = await readRunHistory()
      expect(history).toEqual([])
    })

    it('returns stored history', async () => {
      const mockRuns = [createMockRun(), createMockRun({ runId: 'run-456-def' })]
      mockStorage['run-history'] = mockRuns

      const history = await readRunHistory()
      expect(history).toEqual(mockRuns)
    })

    it('returns empty array if stored value is not an array', async () => {
      mockStorage['run-history'] = { invalid: 'data' }

      const history = await readRunHistory()
      expect(history).toEqual([])
    })
  })

  describe('appendRunHistory', () => {
    it('appends run to empty history', async () => {
      const run = createMockRun()
      await appendRunHistory(run)

      const history = await readRunHistory()
      expect(history).toEqual([run])
    })

    it('appends run to existing history', async () => {
      const run1 = createMockRun({ runId: 'run-1' })
      const run2 = createMockRun({ runId: 'run-2' })

      await appendRunHistory(run1)
      await appendRunHistory(run2)

      const history = await readRunHistory()
      expect(history).toHaveLength(2)
      expect(history[0].runId).toBe('run-1')
      expect(history[1].runId).toBe('run-2')
    })

    it('trims history to max 100 entries', async () => {
      // Add 101 runs
      for (let i = 0; i < 101; i++) {
        await appendRunHistory(createMockRun({ runId: `run-${i}` }))
      }

      const history = await readRunHistory()
      expect(history).toHaveLength(100)
      // Should keep the most recent 100 (1-100, not 0-99)
      expect(history[0].runId).toBe('run-1')
      expect(history[99].runId).toBe('run-100')
    })
  })

  describe('clearRunHistory', () => {
    it('clears all run history', async () => {
      await appendRunHistory(createMockRun())
      await appendRunHistory(createMockRun({ runId: 'run-2' }))

      await clearRunHistory()

      const history = await readRunHistory()
      expect(history).toEqual([])
    })
  })

  describe('getTabRunHistory', () => {
    it('filters runs by tab ID', async () => {
      await appendRunHistory(createMockRun({ runId: 'run-1', tabId: 1 }))
      await appendRunHistory(createMockRun({ runId: 'run-2', tabId: 2 }))
      await appendRunHistory(createMockRun({ runId: 'run-3', tabId: 1 }))

      const tab1Runs = await getTabRunHistory(1)
      expect(tab1Runs).toHaveLength(2)
      expect(tab1Runs[0].runId).toBe('run-1')
      expect(tab1Runs[1].runId).toBe('run-3')
    })

    it('returns empty array for tab with no runs', async () => {
      await appendRunHistory(createMockRun({ tabId: 1 }))

      const tab2Runs = await getTabRunHistory(2)
      expect(tab2Runs).toEqual([])
    })
  })

  describe('getUrlRunHistory', () => {
    it('filters runs by URL', async () => {
      await appendRunHistory(createMockRun({ runId: 'run-1', url: 'https://example.com' }))
      await appendRunHistory(createMockRun({ runId: 'run-2', url: 'https://test.com' }))
      await appendRunHistory(createMockRun({ runId: 'run-3', url: 'https://example.com' }))

      const exampleRuns = await getUrlRunHistory('https://example.com')
      expect(exampleRuns).toHaveLength(2)
      expect(exampleRuns[0].runId).toBe('run-1')
      expect(exampleRuns[1].runId).toBe('run-3')
    })

    it('returns empty array for URL with no runs', async () => {
      await appendRunHistory(createMockRun({ url: 'https://example.com' }))

      const runs = await getUrlRunHistory('https://other.com')
      expect(runs).toEqual([])
    })
  })

  describe('findRunById', () => {
    it('finds run by ID', async () => {
      await appendRunHistory(createMockRun({ runId: 'run-1' }))
      await appendRunHistory(createMockRun({ runId: 'run-2' }))

      const run = await findRunById('run-2')
      expect(run).toBeTruthy()
      expect(run?.runId).toBe('run-2')
    })

    it('returns null when run not found', async () => {
      await appendRunHistory(createMockRun({ runId: 'run-1' }))

      const run = await findRunById('run-999')
      expect(run).toBeNull()
    })
  })
})
