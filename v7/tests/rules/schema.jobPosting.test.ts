import { describe, it, expect } from 'vitest'
import { schemaJobPostingRule } from '@/rules/schema/jobPosting'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

describe('schema: jobposting', () => {
  it('passes with all required fields', async () => {
    const json = '<script type="application/ld+json">{"@type":"JobPosting","title":"Software Engineer","datePosted":"2024-01-15","hiringOrganization":{"@type":"Organization","name":"Acme Corp"}}</script>'
    const r = await schemaJobPostingRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('fails when title is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"JobPosting","datePosted":"2024-01-15","hiringOrganization":{"@type":"Organization","name":"Acme Corp"}}</script>'
    const r = await schemaJobPostingRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('fails when datePosted is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"JobPosting","title":"Software Engineer","hiringOrganization":{"@type":"Organization","name":"Acme Corp"}}</script>'
    const r = await schemaJobPostingRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('fails when hiringOrganization is missing', async () => {
    const json = '<script type="application/ld+json">{"@type":"JobPosting","title":"Software Engineer","datePosted":"2024-01-15"}</script>'
    const r = await schemaJobPostingRule.run({ html:'', url:'https://ex.com', doc: D(json) } as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaJobPostingRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})

