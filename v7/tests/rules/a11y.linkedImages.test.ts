import { describe, it, expect } from 'vitest'

import { linkedImagesAltRule } from '@/rules/a11y/linkedImagesAlt'
import { linkedImagesAltNoTextRule } from '@/rules/a11y/linkedImagesAltNoText'

const runAlt = (html: string) => linkedImagesAltRule.run({ html, url: 'https://example.com', doc: new DOMParser().parseFromString(html, 'text/html') } as any, { globals: {} })
const runAltNoText = (html: string) => linkedImagesAltNoTextRule.run({ html, url: 'https://example.com', doc: new DOMParser().parseFromString(html, 'text/html') } as any, { globals: {} })

describe('linked image rules', () => {
  it('warns when missing alt', async () => {
    const result = await runAlt('<a href="/"><img src="/x.png"></a>')
    expect(result.type).toBe('warn')
    expect(result.details?.domPaths).toContain('a[href="/"]')
  })

  it('warns when missing alt and text', async () => {
    const result = await runAltNoText('<a href="/"><img src="/x.png"></a>')
    expect(result.type).toBe('warn')
    expect(result.details?.domPaths).toContain('a[href="/"]')
  })

  it('passes when adequate alt', async () => {
    const result = await runAlt('<a href="/"><img src="/x.png" alt="Logo"></a>')
    expect(result.type).toBe('ok')
  })

  it('passes when link text exists', async () => {
    const result = await runAltNoText('<a href="/">Click<img src="/x.png"></a>')
    expect(result.type).toBe('ok')
  })
})
