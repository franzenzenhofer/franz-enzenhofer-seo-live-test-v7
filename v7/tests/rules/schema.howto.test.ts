import { describe, it, expect } from 'vitest'
import { schemaHowToRule } from '@/rules/schema/howto'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')
// The field-check row of an entity inside its <script> record, e.g. `Article fields: Missing: headline, image`.
const missingFieldsOf = (r: any) => r.presentation?.evidence.flatMap((record: any) => record.fields)
  .find((field: any) => / fields$/.test(field.key) && String(field.value).startsWith('Missing: '))?.value as string | undefined
const deprecationNoteOf = (r: any) => r.presentation?.checked.find((field: any) => field.key === 'Applicable condition')?.value as string | undefined

describe('schema: howto', () => {
  it('reports complete HowTo as info because Google retired How-to rich results', async () => {
    const json = '<script type="application/ld+json">{"@type":"HowTo","name":"How to Bake Cookies","step":[{"@type":"HowToStep","text":"Preheat oven"},{"@type":"HowToStep","text":"Mix ingredients"}]}</script>'
    const r = await schemaHowToRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect(deprecationNoteOf(r)).toContain('no longer shown')
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Deprecation notice', value: 'https://developers.google.com/search/updates#how-to-deprecation', kind: 'url' })
    expect(r.details).toBeUndefined()
  })

  it('reports single step as info', async () => {
    const json = '<script type="application/ld+json">{"@type":"HowTo","name":"How to Start","step":[{"@type":"HowToStep","text":"Begin"}]}</script>'
    const r = await schemaHowToRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect(r.details).toBeUndefined()
  })

  it('reports missing name as info, not warn (feature retired)', async () => {
    const json = '<script type="application/ld+json">{"@type":"HowTo","step":[{"@type":"HowToStep","text":"Step 1"}]}</script>'
    const r = await schemaHowToRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect(missingFieldsOf(r)).toContain('name')
  })

  it('reports missing steps as info, not warn (feature retired)', async () => {
    const json = '<script type="application/ld+json">{"@type":"HowTo","name":"How to Cook"}</script>'
    const r = await schemaHowToRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect(missingFieldsOf(r)).toContain('step')
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaHowToRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
    expect(r.details).toBeUndefined()
  })
})
