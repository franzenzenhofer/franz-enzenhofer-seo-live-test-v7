import { describe, expect, it } from 'vitest'

import { discoverHeadlineLengthRule as rule } from '@/rules/discover/headlineLength'

const run = (html: string) => rule.run({
  html, url: 'https://example.test/', doc: new DOMParser().parseFromString(html, 'text/html'),
}, { globals: {} })

describe('headline length', () => {
  it('passes at the exact 20-character threshold and retains original nested markup', async () => {
    const html = '<h1 class="hero"><a href="/story">Exactly <em>twenty chars</em></a></h1>'
    const r = await run(html)

    expect(r.type).toBe('ok')
    expect(r.priority).toBe(850)
    expect(r.presentation?.input).toBe('Idle DOM')
    expect(r.presentation?.values).toContainEqual({ key: 'Characters', value: 20, kind: 'text' })
    expect(r.presentation?.markup[0]).toEqual({ key: '<h1>', value: html, kind: 'original', fidelity: 'complete-original' })
    expect(r.presentation?.values[1]).toEqual(r.presentation?.markup[0])
    expect(r.presentation?.evidence[0]?.name).toBe('<h1>')
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Headline', value: 'Exactly twenty chars', kind: 'text' })
  })

  it('reports a short first heading as informational with the editorial heuristic', async () => {
    const r = await run('<h1>Short one</h1>')

    expect(r.type).toBe('info')
    expect(r.priority).toBe(500)
    expect(r.presentation?.values).toContainEqual({ key: 'Characters', value: 9, kind: 'text' })
    expect(r.presentation?.checked).toContainEqual({
      key: 'Criterion',
      value: 'At least 20 characters (editorial heuristic; Google sets no minimum length)',
      kind: 'text',
    })
  })

  it('warns for a missing heading without reporting a zero-length heading', async () => {
    const r = await run('<p>No heading</p>')

    expect(r.type).toBe('warn')
    expect(r.priority).toBe(300)
    expect(r.presentation?.values).toEqual([{ key: 'H1 heading', value: 'Not found', kind: 'text' }])
    expect(r.presentation?.markup).toEqual([])
    expect(r.presentation?.noMarkup).toBe('No h1 element found')
  })

  it('warns for an empty first heading and does not use a later heading', async () => {
    const r = await run('<h1 data-source="cms"><span> </span></h1><h1>This later heading is long enough</h1>')

    expect(r.type).toBe('warn')
    expect(r.presentation?.values).toContainEqual({ key: 'Characters', value: 0, kind: 'text' })
    expect(r.presentation?.markup).toHaveLength(1)
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Markup omitted', value: 1, kind: 'text' })
    expect(r.presentation?.markup[0].value).toBe('<h1 data-source="cms"><span> </span></h1>')
    expect(r.presentation?.detailValues).toContainEqual({ key: 'Headline', value: '', kind: 'text' })
  })

  it('uses only the first heading when multiple non-empty headings exist', async () => {
    const r = await run('<h1>First</h1><h1>This second heading is much longer</h1>')

    expect(r.type).toBe('info')
    expect(r.presentation?.values).toContainEqual({ key: 'Characters', value: 5, kind: 'text' })
    expect(r.presentation?.markup).toHaveLength(1)
    expect(r.presentation?.markup[0].value).toBe('<h1>First</h1>')
  })

  it('preserves both documentation references and avoids the legacy details payload', async () => {
    const r = await run('<h1>Headline with enough characters</h1>')

    expect(r.presentation?.references).toEqual(rule.meta.references)
    expect(r.details).toBeUndefined()
  })
})
