import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { topWordsRule as rule } from '@/rules/dom/topWords'
import { presentationSchema } from '@/shared/presentation/schema'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (doc: Document) => enrichResult(await rule.run({ html: '', url: 'https://ex.com', doc } as never, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value

describe('rule: dom top words', () => {
  it('returns no text for empty body', async () => {
    const result = await run(D('<html><body></body></html>'))
    expect(result.type).toBe('info'); expect(result.priority).toBe(900)
    expect(value(result, 'Content text length')).toBe(0); expect(value(result, 'Top words identified')).toBe(0)
    expect(result.presentation?.input).toBe('Idle DOM')
    expect(result.presentation?.markup).toEqual([])
    expect(result.details).toBeUndefined()
    expect(presentationSchema.safeParse(result.presentation).success).toBe(true)
  })

  it('distinguishes short words from missing text', async () => {
    const result = await run(D('<p>an ox is in it</p>'))
    expect(result.priority).toBe(900)
    expect(value(result, 'Content text length')).toBeGreaterThan(0)
    expect(value(result, 'Top words identified')).toBe(0)
  })

  it('extracts top words from body text', async () => {
    const doc = D('<html><body></body></html>')
    doc.body.textContent = 'hello hello hello world world test longer words here'
    const result = await run(doc)
    expect(result.priority).toBe(800)
    expect(value(result, 'Top words identified')).toBeGreaterThan(0)
    expect(result.presentation?.evidence[0]).toEqual({ name: 'Word 1', fields: [
      { key: 'Rank', value: 1, kind: 'text' }, { key: 'Word', value: 'hello', kind: 'text' }, { key: 'Occurrences', value: 3, kind: 'text' },
    ] })
  })

  it('keeps non-ASCII words whole (Unicode tokenizer)', async () => {
    const doc = D('<html><body></body></html>')
    doc.body.textContent = 'schönheit schönheit gemüse wörterbuch etwas anderes'
    const result = await run(doc)
    const words = result.presentation?.evidence.map((record) => record.fields.find((field) => field.key === 'Word')?.value)
    expect(words).toContain('schönheit')
    expect(words).not.toContain('sch')
  })
})
