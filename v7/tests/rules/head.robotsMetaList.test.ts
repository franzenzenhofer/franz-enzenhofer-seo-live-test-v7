import { describe, expect, it } from 'vitest'

import { robotsMetaListRule } from '@/rules/head/robotsMetaList'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = (html: string) => robotsMetaListRule.run({ html, url: 'https://ex.com', doc: doc(html) } as any, { globals: {} } as any)

describe('rule: robots meta list', () => {
  it('reports none', async () => {
    const res = await run('<html><head></head></html>')
    expect(res.message).toMatch(/No robots meta/)
  })

  it('lists all meta robots variants', async () => {
    const res = await run('<meta name="robots" content="all"><meta name="bingbot" content="index">')
    expect(res.message).toContain('2 robots meta tags')
    expect(res.message).toContain('bingbot')
  })
})
