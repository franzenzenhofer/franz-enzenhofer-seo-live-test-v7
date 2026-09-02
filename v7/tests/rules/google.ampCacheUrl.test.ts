import { describe, it, expect } from 'vitest'
import { ampCacheUrlRule } from '@/rules/google/ampCacheUrl'

const D = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: amp cache url', () => {
  it('derives the publisher-subdomain cache url and keeps the query string', async () => {
    const doc = D('<link rel="amphtml" href="https://my-pub.com/article.amp.html?id=7">')
    const r = await ampCacheUrlRule.run({ html:'', url:'https://my-pub.com', doc }, { globals: {} })
    expect((r as any).message.includes('AMP Cache')).toBe(true)
    expect((r as any).details.ampCacheUrl).toBe('https://my--pub-com.cdn.ampproject.org/c/s/my-pub.com/article.amp.html?id=7')
  })

  it('omits the /s/ infix for http amp pages', async () => {
    const doc = D('<link rel="amphtml" href="http://pub.com/amp">')
    const r = await ampCacheUrlRule.run({ html:'', url:'http://pub.com', doc }, { globals: {} })
    expect((r as any).details.ampCacheUrl).toBe('https://pub-com.cdn.ampproject.org/c/pub.com/amp')
  })

  it('defers presence to head:amphtml when no amphtml link exists', async () => {
    const r = await ampCacheUrlRule.run({ html:'', url:'https://ex.com', doc: D('<p>x</p>') }, { globals: {} })
    expect((r as any).type).toBe('info')
    expect((r as any).message).toContain('No amphtml link')
  })
})
