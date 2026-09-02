import { describe, it, expect } from 'vitest'
import { xRobotsRule } from '@/rules/http/xRobots'

const P = (h: Record<string,string>) => ({ html:'', url:'', doc: new DOMParser().parseFromString('<p/>','text/html'), headers: h })

describe('rule: http x-robots-tag', () => {
  it('reports present', async () => {
    const r = await xRobotsRule.run(P({ 'x-robots-tag': 'noindex' }), { globals: {} })
    expect((r as any).message.includes('X-Robots-Tag')).toBe(true)
  })

  it('warns when the header carries noindex', async () => {
    const r = await xRobotsRule.run(P({ 'x-robots-tag': 'noindex' }), { globals: {} })
    expect((r as any).type).toBe('warn')
    expect(((r as any).details as any).hasNoindex).toBe(true)
  })

  it('warns when the header carries nofollow', async () => {
    const r = await xRobotsRule.run(P({ 'x-robots-tag': 'nofollow' }), { globals: {} })
    expect((r as any).type).toBe('warn')
    expect(((r as any).details as any).hasNofollow).toBe(true)
  })

  it('stays info for non-blocking directives', async () => {
    const r = await xRobotsRule.run(P({ 'x-robots-tag': 'noarchive' }), { globals: {} })
    expect((r as any).type).toBe('info')
  })

  it('stays info without the header', async () => {
    const r = await xRobotsRule.run(P({ 'content-type': 'text/html' }), { globals: {} })
    expect((r as any).type).toBe('info')
    expect((r as any).message).toMatch(/No X-Robots-Tag/)
  })
})
