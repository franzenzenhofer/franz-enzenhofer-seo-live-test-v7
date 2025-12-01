import { describe, expect, it } from 'vitest'

import { topWordsRule } from '@/rules/dom/topWords'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: dom top words', () => {
  it('returns no text for empty body', async () => {
    const doc = D('<html><body></body></html>')
    const r = await topWordsRule.run({ html: '', url: 'https://ex.com', doc } as any, { globals: {} })
    expect(r.message).toBe('No text')
    expect(r.type).toBe('info')
  })

  it('extracts top words from body text', async () => {
    // JSDOM innerText works differently - set textContent directly
    const doc = D('<html><body></body></html>')
    Object.defineProperty(doc.body, 'innerText', { value: 'hello hello hello world world test longer words here' })
    const r = await topWordsRule.run({ html: '', url: 'https://ex.com', doc } as any, { globals: {} })
    expect(r.message).toContain('Top words')
    expect(r.message).toContain('hello')
    expect((r.details as any)?.topWords?.hello).toBe(3)
  })
})
