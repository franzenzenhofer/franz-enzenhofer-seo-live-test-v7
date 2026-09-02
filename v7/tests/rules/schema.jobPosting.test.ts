import { describe, it, expect } from 'vitest'
import { schemaJobPostingRule } from '@/rules/schema/jobPosting'

const D = (h: string) => new DOMParser().parseFromString(h,'text/html')

const FULL = '{"@type":"JobPosting","title":"Software Engineer","datePosted":"2024-01-15","description":"<p>Build things.</p>","hiringOrganization":{"@type":"Organization","name":"Acme Corp"},"jobLocation":{"@type":"Place","address":{"@type":"PostalAddress","addressLocality":"Vienna"}}}'

const run = async (json: string) =>
  schemaJobPostingRule.run({ html:'', url:'https://ex.com', doc: D(`<script type="application/ld+json">${json}</script>`) } as any, { globals: {} })

const without = (key: string) => {
  const node = JSON.parse(FULL) as Record<string, unknown>
  delete node[key]
  return JSON.stringify(node)
}

describe('schema: jobposting', () => {
  it('passes with all required fields', async () => {
    const r = await run(FULL)
    expect((r as any).type).toBe('ok')
  })

  it('fails when title is missing', async () => {
    const r = await run(without('title'))
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('title')
  })

  it('fails when datePosted is missing', async () => {
    const r = await run(without('datePosted'))
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('datePosted')
  })

  it('fails when description is missing (required per Google)', async () => {
    const r = await run(without('description'))
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('description')
  })

  it('fails when hiringOrganization is missing', async () => {
    const r = await run(without('hiringOrganization'))
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('hiringOrganization')
  })

  it('fails when jobLocation is missing (required per Google)', async () => {
    const r = await run(without('jobLocation'))
    expect((r as any).type).toBe('warn')
    expect((r as any).message).toContain('jobLocation')
  })

  it('handles no schema gracefully', async () => {
    const r = await schemaJobPostingRule.run({ html:'', url:'https://ex.com', doc: D('') } as any, { globals: {} })
    expect((r as any).type).toBe('info')
  })
})
