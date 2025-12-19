import { describe, it, expect } from 'vitest'
import { linkedImagesAltRule } from '@/rules/a11y/linkedImagesAlt'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')

describe('rule: linked images alt', () => {
  it('warns when image has no alt and link has no text', async () => {
    const r = await linkedImagesAltRule.run({ html:'', url:'', doc: doc('<a href="#"><img/></a>') }, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.message).toContain('linked images missing alt text or link text')
  })

  it('passes when image has alt text', async () => {
    const r = await linkedImagesAltRule.run({ html:'', url:'', doc: doc('<a href="#"><img alt="Logo"/></a>') }, { globals: {} })
    expect(r.type).toBe('ok')
  })

  it('passes when image has no alt but link has text content', async () => {
    const r = await linkedImagesAltRule.run({ html:'', url:'', doc: doc('<a href="#"><img/>Click here</a>') }, { globals: {} })
    expect(r.type).toBe('ok')
  })

  it('passes when link has no images', async () => {
    const r = await linkedImagesAltRule.run({ html:'', url:'', doc: doc('<a href="#">Text only link</a>') }, { globals: {} })
    expect(r.type).toBe('ok')
  })

  it('warns for multiple linked images without alt and no text', async () => {
    const html = '<a href="#1"><img/></a><a href="#2"><img/></a>'
    const r = await linkedImagesAltRule.run({ html:'', url:'', doc: doc(html) }, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.message).toContain('2 linked images missing alt text or link text')
  })

  it('caps snippet details and exposes total count', async () => {
    const html = '<a href="#1"><img/></a><a href="#2"><img/></a><a href="#3"><img/></a><a href="#4"><img/></a>'
    const r = await linkedImagesAltRule.run({ html:'', url:'', doc: doc(html) }, { globals: {} })
    expect(r.type).toBe('warn')
    expect(r.details?.count).toBe(4)
    expect(Array.isArray(r.details?.domPaths)).toBe(true)
    expect((r.details?.domPaths as string[]).length).toBeLessThanOrEqual(3)
  })
})
