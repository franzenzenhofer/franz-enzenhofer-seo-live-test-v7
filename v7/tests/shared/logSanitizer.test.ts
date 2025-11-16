import { describe, it, expect } from 'vitest'
import { sanitizeForLogging } from '@/shared/logSanitizer'
import type { RuleResult } from '@/background/rules/types'

describe('logSanitizer', () => {
  describe('sanitizeForLogging', () => {
    it('should handle undefined results', () => {
      expect(sanitizeForLogging(undefined)).toBeUndefined()
    })

    it('should preserve results without details', () => {
      const result: RuleResult = {
        name: 'test',
        label: 'TEST',
        type: 'info',
        message: 'Test message',
      }
      expect(sanitizeForLogging(result)).toEqual(result)
    })

    it('should truncate sourceHtml to 200 chars', () => {
      const longHtml = '<a href="https://example.com">'.repeat(100) // ~3000 chars
      const result: RuleResult = {
        name: 'test',
        label: 'TEST',
        type: 'info',
        message: 'Test',
        details: {
          sourceHtml: longHtml,
        },
      }

      const sanitized = sanitizeForLogging(result) as any
      expect(sanitized.details.sourceHtml).toContain('...[truncated')
      expect(sanitized.details.sourceHtml.length).toBeLessThan(250)
      expect(sanitized.details.sourceHtml).toContain(longHtml.slice(0, 200))
    })

    it('should not truncate short sourceHtml', () => {
      const shortHtml = '<a href="https://example.com">Link</a>'
      const result: RuleResult = {
        name: 'test',
        label: 'TEST',
        type: 'info',
        message: 'Test',
        details: {
          sourceHtml: shortHtml,
        },
      }

      const sanitized = sanitizeForLogging(result) as any
      expect(sanitized.details.sourceHtml).toBe(shortHtml)
    })

    it('should limit domPaths to first 5 entries', () => {
      const manyPaths = Array.from({ length: 50 }, (_, i) => `a[href="${i}"]`)
      const result: RuleResult = {
        name: 'test',
        label: 'TEST',
        type: 'info',
        message: 'Test',
        details: {
          domPaths: manyPaths,
        },
      }

      const sanitized = sanitizeForLogging(result) as any
      expect(sanitized.details.domPaths).toHaveLength(6) // 5 + marker
      expect(sanitized.details.domPaths[0]).toBe('a[href="0"]')
      expect(sanitized.details.domPaths[4]).toBe('a[href="4"]')
      expect(sanitized.details.domPaths[5]).toContain('...[+45 more]')
    })

    it('should not truncate domPaths with 5 or fewer entries', () => {
      const fewPaths = ['a[href="1"]', 'a[href="2"]', 'a[href="3"]']
      const result: RuleResult = {
        name: 'test',
        label: 'TEST',
        type: 'info',
        message: 'Test',
        details: {
          domPaths: fewPaths,
        },
      }

      const sanitized = sanitizeForLogging(result) as any
      expect(sanitized.details.domPaths).toEqual(fewPaths)
    })

    it('should truncate httpHeaders to 500 chars', () => {
      const longHeaders = 'Content-Type: text/html\n'.repeat(100) // ~2500 chars
      const result: RuleResult = {
        name: 'test',
        label: 'TEST',
        type: 'info',
        message: 'Test',
        details: {
          httpHeaders: longHeaders,
        },
      }

      const sanitized = sanitizeForLogging(result) as any
      expect(sanitized.details.httpHeaders).toContain('...[truncated')
      expect(sanitized.details.httpHeaders.length).toBeLessThan(550)
    })

    it('should preserve all other fields', () => {
      const result: RuleResult = {
        name: 'test',
        label: 'TEST',
        type: 'info',
        message: 'Test message',
        ruleId: 'test:rule',
        bestPractice: true,
        what: 'static',
        details: {
          snippet: 'Short snippet',
          reference: 'https://example.com/docs',
          customField: 'custom value',
        },
      }

      const sanitized = sanitizeForLogging(result) as any
      expect(sanitized.name).toBe('test')
      expect(sanitized.label).toBe('TEST')
      expect(sanitized.type).toBe('info')
      expect(sanitized.message).toBe('Test message')
      expect(sanitized.ruleId).toBe('test:rule')
      expect(sanitized.bestPractice).toBe(true)
      expect(sanitized.what).toBe('static')
      expect(sanitized.details.snippet).toBe('Short snippet')
      expect(sanitized.details.reference).toBe('https://example.com/docs')
      expect(sanitized.details.customField).toBe('custom value')
    })

    it('should handle complex real-world result', () => {
      const realWorldResult: RuleResult = {
        label: 'A11Y',
        message: '34 linked images missing alt',
        type: 'warn',
        priority: 100,
        name: 'Linked Images need alt',
        ruleId: 'a11y:linked-images-alt',
        bestPractice: false,
        what: 'static',
        details: {
          snippet: '<a href="...">first few chars</a>',
          sourceHtml: '<a href="https://example.com">...</a>\n'.repeat(500), // ~25KB
          domPaths: Array.from({ length: 34 }, (_, i) => `a[href="link${i}"]`),
          reference: 'https://developer.mozilla.org/docs/Web/HTML/Element/img#attr-alt',
        },
      }

      const original = JSON.stringify(realWorldResult)
      const sanitized = JSON.stringify(sanitizeForLogging(realWorldResult))

      // Should be dramatically smaller
      expect(sanitized.length).toBeLessThan(original.length * 0.1) // At least 90% reduction
      expect(sanitized.length).toBeLessThan(2000) // Under 2KB

      // Verify all important fields preserved
      const parsed = JSON.parse(sanitized)
      expect(parsed.message).toBe('34 linked images missing alt')
      expect(parsed.details.snippet).toBe('<a href="...">first few chars</a>')
      expect(parsed.details.reference).toContain('mozilla.org')
    })
  })
})
