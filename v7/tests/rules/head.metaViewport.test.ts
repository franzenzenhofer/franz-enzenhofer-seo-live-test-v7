import { describe, expect, it } from 'vitest'

import { metaViewportRule as rule } from '@/rules/head/metaViewport'

const run = (html: string) => rule.run({
  html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html'),
}, { globals: {} })

describe('meta viewport', () => {
  it('warns when the viewport tag is missing and identifies the idle input', async () => {
    const r = await run('<title>x</title>')

    expect(r.type).toBe('warn')
    expect(r.priority).toBe(200)
    expect(r.presentation?.input).toBe('Idle DOM')
    expect(r.presentation?.values).toContainEqual({ key: 'Viewport tags', value: 0, kind: 'text' })
    expect(r.presentation?.noMarkup).toBe('No meta viewport element found')
  })

  it('accepts a typical viewport and retains its complete original markup', async () => {
    const html = '<meta name="viewport" data-source="template" content="width=device-width, initial-scale=1">'
    const r = await run(html)

    expect(r.type).toBe('ok')
    expect(r.priority).toBe(700)
    expect(r.presentation?.values).toContainEqual({ key: 'Content (trimmed)', value: 'width=device-width, initial-scale=1', kind: 'text' })
    expect(r.presentation?.markup[0].value).toBe(html)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'initial-scale', value: '1', kind: 'text' })
  })

  it('retains each existing issue as a factual value', async () => {
    const r = await run('<meta name="viewport" content="initial-scale=0.5, user-scalable=no">')

    expect(r.type).toBe('warn')
    expect(r.priority).toBe(300)
    expect(r.presentation?.values).toContainEqual({
      key: 'Viewport issues', value: 'missing width=device-width; initial-scale=0.5 (below 1); user-scalable=no (blocks zoom)', kind: 'text',
    })
  })

  it('checks only the first tag while reporting duplicate count and source omissions', async () => {
    const html = '<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="viewport" content="initial-scale=0.5">'
    const r = await run(html)

    expect(r.type).toBe('ok')
    expect(r.presentation?.values).toContainEqual({ key: 'Viewport tags', value: 2, kind: 'text' })
    expect(r.presentation?.markup).toHaveLength(2)
  })

  it('reports complete source omissions when more than ten tags are captured', async () => {
    const r = await run(Array.from({ length: 12 }, () => '<meta name="viewport" content="width=device-width">').join(''))

    expect(r.presentation?.values).toContainEqual({ key: 'Viewport tags', value: 12, kind: 'text' })
    expect(r.presentation?.markup).toHaveLength(10)
    expect(r.presentation?.evidence[0].fields).toContainEqual({ key: 'Elements omitted', value: 2, kind: 'text' })
  })

  it('preserves the documentation reference and removes the legacy details payload', async () => {
    const r = await run('<meta name="viewport" content="width=device-width">')

    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
  })
})
