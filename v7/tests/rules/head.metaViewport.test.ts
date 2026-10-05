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
    expect(r.presentation?.values).toEqual([{ key: 'Meta viewport', value: 'Not found', kind: 'text' }])
    expect(r.presentation?.noMarkup).toBe('No meta viewport element found')
  })

  it('accepts a typical viewport and retains its complete original markup', async () => {
    const html = '<meta name="viewport" data-source="template" content="width=device-width, initial-scale=1">'
    const r = await run(html)

    expect(r.type).toBe('ok')
    expect(r.priority).toBe(700)
    expect(r.presentation?.values).toEqual([{ key: 'width', value: 'device-width', kind: 'text' }, { key: 'initial-scale', value: '1', kind: 'text' },
      { key: 'user-scalable', value: 'Not declared', kind: 'text' }, { key: '<meta name="viewport">', value: html, kind: 'original', fidelity: 'complete-original' }])
    expect(r.presentation?.markup[0].value).toBe(html)
    expect(r.presentation?.evidence).toEqual([{ name: '<meta name="viewport">', fields: [{ key: 'DOM path', value: 'html > head > meta', kind: 'path' }] }])
    expect(r.presentation?.detailValues).toEqual([{ key: 'Markup retained', value: 1, kind: 'text' }, { key: 'Markup omitted', value: 0, kind: 'text' },
      { key: 'Evidence retained', value: 1, kind: 'text' }, { key: 'Evidence omitted', value: 0, kind: 'text' }])
  })

  it('shows each checked directive as declared so the issue is visible as a fact', async () => {
    const r = await run('<meta name="viewport" content="initial-scale=0.5, user-scalable=no">')

    expect(r.type).toBe('warn')
    expect(r.priority).toBe(300)
    expect(r.presentation?.values.slice(0, 3)).toEqual([{ key: 'width', value: 'Not declared', kind: 'text' },
      { key: 'initial-scale', value: '0.5', kind: 'text' }, { key: 'user-scalable', value: 'no', kind: 'text' }])
  })

  it('warns on user-scalable=0 and on a non device-width value', async () => {
    const zoom = await run('<meta name="viewport" content="width=device-width, user-scalable=0">')
    expect(zoom.type).toBe('warn'); expect(zoom.presentation?.values).toContainEqual({ key: 'user-scalable', value: '0', kind: 'text' })
    const fixed = await run('<meta name="viewport" content="width=1024">')
    expect(fixed.type).toBe('warn'); expect(fixed.presentation?.values).toContainEqual({ key: 'width', value: '1024', kind: 'text' })
  })

  it('checks only the first tag while reporting duplicate count and source omissions', async () => {
    const html = '<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="viewport" content="initial-scale=0.5">'
    const r = await run(html)

    expect(r.type).toBe('ok')
    expect(r.presentation?.values[0]).toEqual({ key: 'Viewport tags', value: 2, kind: 'text' })
    expect(r.presentation?.values.filter((f) => f.kind === 'original').map((f) => f.key)).toEqual(['<meta name="viewport"> 1', '<meta name="viewport"> 2'])
    expect(r.presentation?.markup).toHaveLength(2)
  })

  it('reports complete source omissions when more than ten tags are captured', async () => {
    const r = await run(Array.from({ length: 12 }, () => '<meta name="viewport" content="width=device-width">').join(''))

    expect(r.presentation?.values).toContainEqual({ key: 'Viewport tags', value: 12, kind: 'text' })
    expect(r.presentation?.values.filter((f) => f.kind === 'original')).toEqual([])
    expect(r.presentation?.markup).toHaveLength(10); expect(r.presentation?.evidence).toHaveLength(10)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Markup omitted', value: 2, kind: 'text' })
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Evidence omitted', value: 2, kind: 'text' })
  })

  it('preserves the documentation reference and removes the legacy details payload', async () => {
    const r = await run('<meta name="viewport" content="width=device-width">')

    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
  })
})
