import { describe, it, expect } from 'vitest'
import { clientSideRenderingRule } from '@/rules/dom/clientSideRendering'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: client-side rendering heuristic', () => {
  it('flags low text + many scripts', async () => {
    const doc = D('<script src="a.js"></script><script src="b.js"></script><script src="c.js"></script><script src="d.js"></script><script src="e.js"></script><script src="f.js"></script>')
    const r = await clientSideRenderingRule.run({ html:'', url:'', doc } as any, { globals: {} })
    expect((r as any).message.toLowerCase().includes('possible')).toBe(true)
  })
})

