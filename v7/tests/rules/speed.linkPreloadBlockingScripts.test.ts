import { describe, it, expect } from 'vitest'
import { linkPreloadRule } from '@/rules/speed/linkPreload'
import { blockingScriptsRule } from '@/rules/speed/blockingScripts'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rules: speed', () => {
  it('reports preload and blocking scripts', async () => {
    const doc = D('<head><link rel="preload" as="script" href="/a.js"><script src="/b.js"></script></head>')
    const p = { html:'', url:'https://ex.com', doc }
    const r1 = await linkPreloadRule.run(p as any, { globals: {} })
    const r2 = await blockingScriptsRule.run(p as any, { globals: {} })
    expect((r1 as any).message.includes('preload')).toBe(true)
    expect((r2 as any).type).toBe('warn')
  })

  it('does not flag module scripts', async () => {
    const doc = D('<head><script type="module" src="/m.js"></script></head>')
    const p = { html:'', url:'https://ex.com', doc }
    const r = await blockingScriptsRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('does not flag non-JavaScript script types', async () => {
    const doc = D('<head><script type="text/template" src="/t.tpl"></script></head>')
    const p = { html:'', url:'https://ex.com', doc }
    const r = await blockingScriptsRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('ok')
  })

  it('still flags explicit JavaScript MIME types', async () => {
    const doc = D('<head><script type="text/javascript" src="/c.js"></script></head>')
    const p = { html:'', url:'https://ex.com', doc }
    const r = await blockingScriptsRule.run(p as any, { globals: {} })
    expect((r as any).type).toBe('warn')
  })
})
