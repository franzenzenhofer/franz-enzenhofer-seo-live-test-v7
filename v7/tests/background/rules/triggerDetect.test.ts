import { describe, it, expect } from 'vitest'
import { determineTrigger } from '@/background/rules/triggerDetect'

describe('triggerDetect module', () => {
  describe('determineTrigger', () => {
    it('returns nav:before when nav:before event present', () => {
      const events = [
        { t: 'nav:before' },
        { t: 'dom:document_idle' },
      ]
      expect(determineTrigger(events)).toBe('nav:before')
    })

    it('returns nav:commit when nav:commit event present', () => {
      const events = [
        { t: 'nav:commit' },
        { t: 'dom:document_idle' },
      ]
      expect(determineTrigger(events)).toBe('nav:commit')
    })

    it('returns nav:history when nav:history event present', () => {
      const events = [
        { t: 'nav:history' },
        { t: 'dom:document_idle' },
      ]
      expect(determineTrigger(events)).toBe('nav:history')
    })

    it('returns dom:idle when dom:document_idle event present', () => {
      const events = [{ t: 'dom:document_idle' }]
      expect(determineTrigger(events)).toBe('dom:idle')
    })

    it('returns auto when no recognized events present', () => {
      const events = [
        { t: 'req:beforeHeaders' },
        { t: 'req:headers' },
      ]
      expect(determineTrigger(events)).toBe('auto')
    })

    it('returns auto for empty event list', () => {
      expect(determineTrigger([])).toBe('auto')
    })

    it('prioritizes nav:before over other events', () => {
      const events = [
        { t: 'nav:commit' },
        { t: 'nav:before' },
        { t: 'dom:document_idle' },
      ]
      expect(determineTrigger(events)).toBe('nav:before')
    })

    it('prioritizes nav:commit over nav:history and dom:idle', () => {
      const events = [
        { t: 'nav:history' },
        { t: 'nav:commit' },
        { t: 'dom:document_idle' },
      ]
      expect(determineTrigger(events)).toBe('nav:commit')
    })

    it('prioritizes nav:history over dom:idle', () => {
      const events = [
        { t: 'dom:document_idle' },
        { t: 'nav:history' },
      ]
      expect(determineTrigger(events)).toBe('nav:history')
    })
  })
})
