import { describe, it, expect } from 'vitest'

import { toResultCopyPayload } from '@/components/result/resultCopy'

describe('result copy payload', () => {
  it('renders markdown representation with snippet and reference', () => {
    const payload = toResultCopyPayload({
      name: 'H1 Present',
      label: 'BODY',
      message: '1 <h1> found.',
      type: 'ok',
      priority: 1000,
      ruleId: 'body:h1',
      what: 'static',
      details: {
        snippet: '<h1>Example</h1>',
        reference: 'https://example.com',
        sourceHtml: '<h1 class="hero">Example</h1>',
      },
    } as any)
    expect(payload).toMatch(/### BODY: H1 Present/)
    expect(payload).toMatch(/Snippet/)
    expect(payload).toMatch(/```html\n<h1>Example<\/h1>\n```/)
    expect(payload).toMatch(/Reference/)
    expect(payload).toMatch(/<https:\/\/example\.com>/)
    expect(payload).not.toMatch(/Best Practice/)
  })

  it('returns empty string when result is missing', () => {
    expect(toResultCopyPayload(undefined as any)).toBe('')
  })
})
