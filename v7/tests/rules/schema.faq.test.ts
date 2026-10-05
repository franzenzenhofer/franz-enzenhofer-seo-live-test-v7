import { describe, it, expect } from 'vitest'
import { schemaFaqRule } from '@/rules/schema/faq'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')
const fieldCheckOf = (r: any) => r.presentation?.evidence.flatMap((record: any) => record.fields)
  .find((field: any) => field.key === 'FAQPage fields')?.value as string | undefined
// The field-check row of an entity inside its <script> record, e.g. `Article fields: Missing: headline, image`.
const missingFieldsOf = (r: any) => r.presentation?.evidence.flatMap((record: any) => record.fields)
  .find((field: any) => / fields$/.test(field.key) && String(field.value).startsWith('Missing: '))?.value as string | undefined
const deprecationNoteOf = (r: any) => r.presentation?.checked.find((field: any) => field.key === 'Applicable condition')?.value as string | undefined

describe('schema: faq', () => {
  it('reports complete FAQ as info because Google retired the FAQ rich result', async () => {
    const json = '<script type="application/ld+json">{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"What is SEO?","acceptedAnswer":{"@type":"Answer","text":"Search Engine Optimization"}}]}</script>'
    const r = await schemaFaqRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect(deprecationNoteOf(r)).toContain('retired')
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Deprecation notice', value: 'https://developers.google.com/search/blog/2023/08/howto-faq-changes', kind: 'url' })
    expect(r.details).toBeUndefined()
  })

  it('accepts a single Question object as mainEntity without throwing', async () => {
    const json = '<script type="application/ld+json">{"@type":"FAQPage","mainEntity":{"@type":"Question","name":"Q1","acceptedAnswer":{"@type":"Answer","text":"A1"}}}</script>'
    const r = await schemaFaqRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect(fieldCheckOf(r)).toBe('Present')
  })

  it('reports incomplete FAQ (empty mainEntity) as info, not warn', async () => {
    const json = '<script type="application/ld+json">{"@type":"FAQPage","mainEntity":[]}</script>'
    const r = await schemaFaqRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect(missingFieldsOf(r)).toContain('mainEntity Question with acceptedAnswer')
  })

  it('reports missing mainEntity as info, not warn', async () => {
    const json = '<script type="application/ld+json">{"@type":"FAQPage"}</script>'
    const r = await schemaFaqRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaFaqRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect(r.details).toBeUndefined()
  })
})
