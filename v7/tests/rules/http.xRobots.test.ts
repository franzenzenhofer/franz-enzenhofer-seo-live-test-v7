import { describe, it, expect } from 'vitest'
import { xRobotsRule } from '@/rules/http/xRobots'

const P = (h: Record<string,string>) => ({ html:'', url:'', doc: new DOMParser().parseFromString('<p/>','text/html'), headers: h })

describe('rule: http x-robots-tag', () => {
  it('reports present', async () => {
    const r = await xRobotsRule.run(P({ 'x-robots-tag': 'noindex' }), { globals: {} })
    expect((r as any).message.includes('X-Robots-Tag')).toBe(true)
  })
})

