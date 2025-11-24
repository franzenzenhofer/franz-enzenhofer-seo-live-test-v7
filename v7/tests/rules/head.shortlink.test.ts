import { describe, it, expect } from 'vitest'
import { shortlinkRule } from '@/rules/head/shortlink'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: shortlink', () => {
  it('reports present', async () => {
    const r = await shortlinkRule.run({ html:'', url:'', doc: doc('<link rel="shortlink" href="/s"/>') }, { globals: {} })
    expect((r as any).message.toLowerCase().includes('shortlink')).toBe(true)
    expect((r as any).type).toBe('info')
  })

  it('warns when present without href', async () => {
    const r = await shortlinkRule.run({ html:'', url:'', doc: doc('<link rel="shortlink">') }, { globals: {} })
    expect((r as any).type).toBe('warn')
    expect((r as any).message.toLowerCase()).toContain('no href')
  })

  it('handles missing shortlink', async () => {
    const r = await shortlinkRule.run({ html:'', url:'', doc: doc('<head></head>') }, { globals: {} })
    expect((r as any).type).toBe('info')
    expect((r as any).message.toLowerCase()).toContain('no shortlink')
  })
})
