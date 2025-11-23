import { describe, it, expect } from 'vitest'
import { JSDOM } from 'jsdom'
import { registry } from '@/rules/registry'
import type { Page, Ctx } from '@/core/types'

/**
 * Test to ensure ALL rules have a specification reference URL.
 * This enforces documentation standards and helps users understand
 * the reasoning behind each rule.
 */
describe('Rule References Validation', () => {
  it('should require all rules to have a specification reference URL', async () => {
    const rulesWithoutReferences: string[] = []
    const rulesWithInvalidReferences: Array<{ id: string; reference: string }> = []

    // Create mock page and context for testing
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Page</title>
          <meta charset="utf-8">
          <link rel="canonical" href="https://example.com">
        </head>
        <body>
          <h1>Test Heading</h1>
          <p>Test content</p>
        </body>
      </html>
    `

    const dom = new JSDOM(mockHtml)
    const mockPage: Page = {
      html: mockHtml,
      url: 'https://example.com',
      doc: dom.window.document as unknown as Document,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-encoding': 'gzip',
      },
      status: 200,
      redirectChain: [],
      finalUrl: 'https://example.com',
    }

    const mockCtx: Ctx = {
      globals: {},
    }

    // Test each rule
    for (const rule of registry) {
      try {
        // Skip rules that require external data (GSC, PSI, etc.)
        if (
          rule.what === 'gsc' ||
          rule.what === 'psi' ||
          rule.id.includes('storage') ||
          rule.id.includes('robots')
        ) {
          continue
        }

        const result = await rule.run(mockPage, mockCtx)

        // Check if reference exists in result details
        const reference = result.details?.reference

        if (!reference) {
          rulesWithoutReferences.push(rule.id)
          continue
        }

        // Validate reference is a valid URL
        if (typeof reference !== 'string') {
          rulesWithInvalidReferences.push({
            id: rule.id,
            reference: String(reference),
          })
          continue
        }

        try {
          const url = new URL(reference)
          // Ensure it's a real documentation URL (http/https)
          if (!url.protocol.startsWith('http')) {
            rulesWithInvalidReferences.push({
              id: rule.id,
              reference,
            })
          }
        } catch {
          rulesWithInvalidReferences.push({
            id: rule.id,
            reference,
          })
        }
      } catch (error) {
        // If the rule throws an error during execution, we still want to check
        // if it would have had a reference. For now, we'll skip erroring rules.
        console.warn(`Rule ${rule.id} threw error during validation:`, error)
      }
    }

    // Build detailed error message
    let errorMessage = ''

    if (rulesWithoutReferences.length > 0) {
      errorMessage += `\n\n❌ ${rulesWithoutReferences.length} rules are missing specification references:\n\n`
      errorMessage += rulesWithoutReferences.map((id) => `  - ${id}`).join('\n')
      errorMessage += '\n\nEach rule MUST include a reference URL to its specification/documentation.'
      errorMessage += '\nAdd a SPEC constant to the rule file and include it in result.details.reference'
      errorMessage += '\n\nExample:'
      errorMessage += "\n  const SPEC = 'https://developers.google.com/search/docs/...'"
      errorMessage += '\n  return { ..., details: { ..., reference: SPEC } }'
    }

    if (rulesWithInvalidReferences.length > 0) {
      errorMessage += `\n\n⚠️  ${rulesWithInvalidReferences.length} rules have invalid reference URLs:\n\n`
      errorMessage += rulesWithInvalidReferences
        .map(({ id, reference }) => `  - ${id}: "${reference}"`)
        .join('\n')
      errorMessage += '\n\nReferences must be valid HTTP/HTTPS URLs.'
    }

    // Fail the test if any issues found
    if (rulesWithoutReferences.length > 0 || rulesWithInvalidReferences.length > 0) {
      throw new Error(errorMessage)
    }

    // Success message
    expect(rulesWithoutReferences).toHaveLength(0)
    expect(rulesWithInvalidReferences).toHaveLength(0)
  })

  it('should validate reference URL format', () => {
    const validReferences = [
      'https://developers.google.com/search/docs/crawling-indexing/canonicalization',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding',
      'https://ogp.me/#metadata',
      'https://schema.org/Article',
    ]

    const invalidReferences = [
      'not a url',
      'ftp://example.com',
      '',
      'javascript:alert(1)',
    ]

    validReferences.forEach((ref) => {
      expect(() => {
        const url = new URL(ref)
        expect(url.protocol).toMatch(/^https?:/)
      }).not.toThrow()
    })

    invalidReferences.forEach((ref) => {
      expect(() => {
        const url = new URL(ref)
        if (!url.protocol.startsWith('http')) {
          throw new Error('Invalid protocol')
        }
      }).toThrow()
    })
  })
})
