import { describe, it, expect } from 'vitest'
import { shortlinkRule } from '@/rules/head/shortlink'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: shortlink', () => {
  it('reports a valid alternate shortlink without calling it a defect', async () => {
    const r = await shortlinkRule.run({ html:'', url:'https://example.com/page', doc: doc('<link rel="shortlink" href="/s"/>') }, { globals: {} })
    expect((r as any).message.toLowerCase().includes('shortlink')).toBe(true)
    expect((r as any).type).toBe('info')
  })

  it('warns when present without href', async () => {
    const r = await shortlinkRule.run({ html:'', url:'https://example.com/page', doc: doc('<link rel="shortlink">') }, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message.toLowerCase()).toContain('href')
  })

  it('treats missing shortlink as ok/info', async () => {
    const r = await shortlinkRule.run({ html:'', url:'https://example.com/page', doc: doc('<head></head>') }, { globals: {} })
    expect((r as any).type).toBe('info')
    expect((r as any).message.toLowerCase()).toContain('no shortlink')
  })
})

it('reports an invalid shortlink as a named finding instead of throwing', async () => {
  const result = await shortlinkRule.run({ html: '', url: 'https://example.test/', doc: doc('<link rel="shortlink" href="http://[">') }, { globals: {} })
  expect(result.type).toBe('warn')
  expect(result.details?.['href']).toBe('http://[')
})
