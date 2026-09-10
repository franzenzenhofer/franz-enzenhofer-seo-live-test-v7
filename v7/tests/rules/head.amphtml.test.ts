import { describe, it, expect } from 'vitest'
import { amphtmlRule } from '@/rules/head/amphtml'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: amphtml link', () => {
  it('warns when present', async () => {
    const r = await amphtmlRule.run({ html:'', url:'https://example.test/page', doc: doc('<link rel="amphtml" href="/amp"/>') }, { globals: {} })
    expect((r as any).type).toBe('info')
  })

  it('notes absence as info', async () => {
    const r = await amphtmlRule.run({ html:'', url:'https://example.test/page', doc: doc('<head></head>') }, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})

it('resolves the document base and safely encodes the validator destination', async () => {
  const result = await amphtmlRule.run({ html: '', url: 'https://example.test/page', doc: doc('<base href="/news/"><link rel="amphtml" href="story?x=1&amp;y=2">') }, { globals: {} })
  expect(result.details?.['ampUrl']).toBe('https://example.test/news/story?x=1&y=2')
  expect(result.details?.['validatorUrl']).toContain(encodeURIComponent('https://example.test/news/story?x=1&y=2'))
})
