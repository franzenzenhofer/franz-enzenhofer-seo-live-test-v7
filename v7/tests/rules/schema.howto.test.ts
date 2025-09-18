import { describe, it, expect } from 'vitest'
import { schemaHowToRule } from '@/rules/schema/howto'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: howto', () => {
  it('needs name and steps', async () => {
    const json = '<script type="application/ld+json">{"@type":"HowTo","name":"How","step":[{"@type":"HowToStep","text":"x"}]}</script>'
    const r = await schemaHowToRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
})

