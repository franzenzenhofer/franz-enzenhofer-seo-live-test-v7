import { describe, it, expect } from 'vitest'
import { schemaJobPostingRule } from '@/rules/schema/jobPosting'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: jobposting', () => {
  it('needs title datePosted hiringOrganization', async () => {
    const json = '<script type="application/ld+json">{"@type":"JobPosting","title":"T","datePosted":"2024-01-01","hiringOrganization":{"@type":"Organization","name":"Org"}}</script>'
    const r = await schemaJobPostingRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })
})

