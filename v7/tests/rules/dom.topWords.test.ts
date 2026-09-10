import { describe, expect, it } from 'vitest'

import { topWordsRule } from '@/rules/dom/topWords'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: dom top words', () => {
  it('returns no text for empty body', async () => {
    const doc = D('<html><body></body></html>')
    const r = await topWordsRule.run({ html: '', url: 'https://ex.com', doc } as any, { globals: {} })
    expect(r.message).toContain('No text found')
    expect(r.details?.['textLength']).toBe(0)
    expect(r.type).toBe('info')
  })

  it('distinguishes short words from missing text', async () => {
    const r = await topWordsRule.run({ html: '', url: 'https://ex.com', doc: D('<p>an ox is in it</p>') }, { globals: {} })
    expect(r.message).toContain('No qualifying words')
    expect(r.details?.['textLength']).toBeGreaterThan(0)
  })

  it('extracts top words from body text', async () => {
    const doc = D('<html><body></body></html>')
    doc.body.textContent = 'hello hello hello world world test longer words here'
    const r = await topWordsRule.run({ html: '', url: 'https://ex.com', doc } as any, { globals: {} })
    expect(r.message).toContain('Top words')
    expect(r.message).toContain('hello')
    expect((r.details as any)?.topWords?.hello).toBe(3)
  })

  it('keeps non-ASCII words whole (Unicode tokenizer)', async () => {
    const doc = D('<html><body></body></html>')
    doc.body.textContent = 'sch\u00f6nheit sch\u00f6nheit gem\u00fcse w\u00f6rterbuch etwas anderes'
    const r = await topWordsRule.run({ html: '', url: 'https://ex.com', doc } as any, { globals: {} })
    expect((r.details as any)?.topWords?.['sch\u00f6nheit']).toBe(2)
    expect(Object.keys((r.details as any)?.topWords || {})).not.toContain('sch')
  })
})
