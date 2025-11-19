import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NavigationLedgerSchema } from '@/background/history/types'

describe('Navigation Ledger Listeners', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('NavigationLedgerSchema validation', () => {
    it('validates complete navigation ledger', () => {
      const ledger = {
        tabId: 123,
        currentUrl: 'https://example.com',
        trace: [
          {
            url: 'https://example.com',
            timestamp: Date.now(),
            type: 'load',
            statusCode: 200,
          },
        ],
      }

      const result = NavigationLedgerSchema.safeParse(ledger)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tabId).toBe(123)
        expect(result.data.trace).toHaveLength(1)
      }
    })

    it('validates http_redirect hop', () => {
      const ledger = {
        tabId: 456,
        currentUrl: 'https://example.com',
        trace: [
          {
            url: 'http://example.com',
            timestamp: Date.now(),
            type: 'http_redirect',
            statusCode: 301,
            statusText: '301 Moved Permanently',
          },
          {
            url: 'https://example.com',
            timestamp: Date.now(),
            type: 'load',
            statusCode: 200,
          },
        ],
      }

      const result = NavigationLedgerSchema.safeParse(ledger)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.trace[0].type).toBe('http_redirect')
        expect(result.data.trace[0].statusCode).toBe(301)
      }
    })

    it('validates client_redirect hop', () => {
      const ledger = {
        tabId: 789,
        currentUrl: 'https://example.com/redirected',
        trace: [
          {
            url: 'https://example.com',
            timestamp: Date.now(),
            type: 'load',
            statusCode: 200,
          },
          {
            url: 'https://example.com/redirected',
            timestamp: Date.now(),
            type: 'client_redirect',
            statusCode: 200,
            transitionType: 'link',
            transitionQualifiers: ['client_redirect'],
          },
        ],
      }

      const result = NavigationLedgerSchema.safeParse(ledger)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.trace[1].type).toBe('client_redirect')
        expect(result.data.trace[1].transitionQualifiers).toContain('client_redirect')
      }
    })

    it('validates history_api hop', () => {
      const ledger = {
        tabId: 101,
        currentUrl: 'https://example.com/spa-route',
        trace: [
          {
            url: 'https://example.com',
            timestamp: Date.now(),
            type: 'load',
            statusCode: 200,
          },
          {
            url: 'https://example.com/spa-route',
            timestamp: Date.now(),
            type: 'history_api',
            statusCode: 200,
            transitionType: 'link',
          },
        ],
      }

      const result = NavigationLedgerSchema.safeParse(ledger)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.trace[1].type).toBe('history_api')
      }
    })

    it('rejects invalid hop type', () => {
      const ledger = {
        tabId: 123,
        currentUrl: 'https://example.com',
        trace: [
          {
            url: 'https://example.com',
            timestamp: Date.now(),
            type: 'invalid_type',
            statusCode: 200,
          },
        ],
      }

      const result = NavigationLedgerSchema.safeParse(ledger)
      expect(result.success).toBe(false)
    })

    it('validates empty trace', () => {
      const ledger = {
        tabId: 123,
        currentUrl: 'https://example.com',
        trace: [],
      }

      const result = NavigationLedgerSchema.safeParse(ledger)
      expect(result.success).toBe(true)
    })

    it('validates complex redirect chain', () => {
      const ledger = {
        tabId: 999,
        currentUrl: 'https://example.com/final',
        trace: [
          {
            url: 'http://example.com',
            timestamp: Date.now(),
            type: 'http_redirect',
            statusCode: 301,
          },
          {
            url: 'https://example.com',
            timestamp: Date.now(),
            type: 'http_redirect',
            statusCode: 302,
          },
          {
            url: 'https://example.com/temp',
            timestamp: Date.now(),
            type: 'client_redirect',
            statusCode: 200,
          },
          {
            url: 'https://example.com/final',
            timestamp: Date.now(),
            type: 'load',
            statusCode: 200,
          },
        ],
      }

      const result = NavigationLedgerSchema.safeParse(ledger)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.trace).toHaveLength(4)
        expect(result.data.trace[0].statusCode).toBe(301)
        expect(result.data.trace[1].statusCode).toBe(302)
        expect(result.data.trace[2].type).toBe('client_redirect')
        expect(result.data.trace[3].type).toBe('load')
      }
    })

    it('requires tabId, currentUrl, and trace', () => {
      const incomplete = { tabId: 123 }
      const result = NavigationLedgerSchema.safeParse(incomplete)
      expect(result.success).toBe(false)
    })
  })

  describe('Navigation hop scenarios', () => {
    it('represents permanent redirect (301)', () => {
      const hop = {
        url: 'http://example.com',
        timestamp: Date.now(),
        type: 'http_redirect',
        statusCode: 301,
        statusText: '301 Moved Permanently',
      }

      expect(hop.type).toBe('http_redirect')
      expect(hop.statusCode).toBe(301)
    })

    it('represents temporary redirect (302)', () => {
      const hop = {
        url: 'http://example.com',
        timestamp: Date.now(),
        type: 'http_redirect',
        statusCode: 302,
        statusText: '302 Found',
      }

      expect(hop.type).toBe('http_redirect')
      expect(hop.statusCode).toBe(302)
    })

    it('represents meta refresh redirect', () => {
      const hop = {
        url: 'https://example.com/redirected',
        timestamp: Date.now(),
        type: 'client_redirect',
        statusCode: 200,
        transitionType: 'link',
        transitionQualifiers: ['client_redirect'],
      }

      expect(hop.type).toBe('client_redirect')
      expect(hop.transitionQualifiers).toContain('client_redirect')
    })

    it('represents SPA navigation', () => {
      const hop = {
        url: 'https://example.com/products',
        timestamp: Date.now(),
        type: 'history_api',
        statusCode: 200,
        transitionType: 'link',
      }

      expect(hop.type).toBe('history_api')
    })
  })
})
