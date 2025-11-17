import { describe, it, expect, beforeEach } from 'vitest'
import {
  type RunState,
  generateRunId,
  createRunState,
  updateRunState,
  completeRunState,
  abortRunState,
} from '@/background/rules/runState'

describe('runState module', () => {
  describe('generateRunId', () => {
    it('generates unique run IDs', () => {
      const id1 = generateRunId(123)
      const id2 = generateRunId(123)
      expect(id1).not.toBe(id2)
    })

    it('generates IDs with correct format including tabId', () => {
      const id = generateRunId(456)
      expect(id).toMatch(/^run-456-\d+-[a-z0-9]{6}$/)
    })

    it('includes tabId in the runId', () => {
      const id = generateRunId(789)
      expect(id).toContain('run-789-')
    })
  })

  describe('createRunState', () => {
    it('creates run state with all required fields', () => {
      const state = createRunState(123, 'https://example.com', 'manual')

      expect(state.runId).toMatch(/^run-123-\d+-[a-z0-9]{6}$/)
      expect(state.tabId).toBe(123)
      expect(state.url).toBe('https://example.com')
      expect(state.triggeredBy).toBe('manual')
      expect(state.status).toBe('pending')
      expect(state.startedAt).toBeTruthy()
      expect(state.completedAt).toBeUndefined()
      expect(state.resultCount).toBeUndefined()
    })

    it('generates ISO timestamp for startedAt', () => {
      const state = createRunState(123, 'https://example.com', 'auto')
      const date = new Date(state.startedAt)
      expect(date.toISOString()).toBe(state.startedAt)
    })

    it('accepts different trigger reasons', () => {
      const triggers = ['nav:before', 'nav:commit', 'nav:history', 'dom:idle', 'manual', 'auto'] as const

      triggers.forEach((trigger) => {
        const state = createRunState(123, 'https://example.com', trigger)
        expect(state.triggeredBy).toBe(trigger)
      })
    })
  })

  describe('updateRunState', () => {
    let initialState: RunState

    beforeEach(() => {
      initialState = createRunState(123, 'https://example.com', 'manual')
    })

    it('updates status', () => {
      const updated = updateRunState(initialState, { status: 'running' })
      expect(updated.status).toBe('running')
      expect(updated.runId).toBe(initialState.runId)
    })

    it('does not mutate original state', () => {
      const originalStatus = initialState.status
      updateRunState(initialState, { status: 'running' })
      expect(initialState.status).toBe(originalStatus)
    })

    it('updates multiple fields', () => {
      const updated = updateRunState(initialState, {
        status: 'running',
        resultCount: 42,
      })
      expect(updated.status).toBe('running')
      expect(updated.resultCount).toBe(42)
    })
  })

  describe('completeRunState', () => {
    it('marks state as completed with result count', () => {
      const state = createRunState(123, 'https://example.com', 'manual')
      const completed = completeRunState(state, 100)

      expect(completed.status).toBe('completed')
      expect(completed.resultCount).toBe(100)
      expect(completed.completedAt).toBeTruthy()
    })

    it('generates ISO timestamp for completedAt', () => {
      const state = createRunState(123, 'https://example.com', 'manual')
      const completed = completeRunState(state, 50)

      if (completed.completedAt) {
        const date = new Date(completed.completedAt)
        expect(date.toISOString()).toBe(completed.completedAt)
      }
    })

    it('preserves original state properties', () => {
      const state = createRunState(123, 'https://example.com', 'auto')
      const completed = completeRunState(state, 75)

      expect(completed.runId).toBe(state.runId)
      expect(completed.tabId).toBe(123)
      expect(completed.url).toBe('https://example.com')
      expect(completed.triggeredBy).toBe('auto')
    })
  })

  describe('abortRunState', () => {
    it('marks state as aborted', () => {
      const state = createRunState(123, 'https://example.com', 'manual')
      const aborted = abortRunState(state)

      expect(aborted.status).toBe('aborted')
      expect(aborted.completedAt).toBeTruthy()
    })

    it('generates ISO timestamp for completedAt', () => {
      const state = createRunState(123, 'https://example.com', 'manual')
      const aborted = abortRunState(state)

      if (aborted.completedAt) {
        const date = new Date(aborted.completedAt)
        expect(date.toISOString()).toBe(aborted.completedAt)
      }
    })

    it('preserves original state properties', () => {
      const state = createRunState(456, 'https://test.com', 'nav:before')
      const aborted = abortRunState(state)

      expect(aborted.runId).toBe(state.runId)
      expect(aborted.tabId).toBe(456)
      expect(aborted.url).toBe('https://test.com')
      expect(aborted.triggeredBy).toBe('nav:before')
    })
  })
})
