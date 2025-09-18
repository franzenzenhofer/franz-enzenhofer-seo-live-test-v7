import { describe, it, expect } from 'vitest'
import { schemaOrganizationRule } from '@/rules/schema/organization'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: organization', () => {
  it('needs name logo/image and url', async () => {
    const json = '<script type="application/ld+json">{"@type":"Organization","name":"Org","logo":"/l.png","url":"https://ex.com"}</script>'
    const r = await schemaOrganizationRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
})

