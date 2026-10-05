import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { linkedImagesAltRule as rule } from '@/rules/a11y/linkedImagesAlt'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string) => enrichResult(await rule.run({ html, url: 'https://example.com/', doc: doc(html) }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('rule: linked images alt', () => {
  it('warns when image has no alt and link has no text, showing the anchor markup instead of a count of 1', async () => {
    const result = await run('<a href="#"><img/></a>')
    expect(result.type).toBe('warn'); expect(result.priority).toBe(100)
    expect(result.presentation?.values.map((field) => field.key)).toEqual(['<a>'])
    expect(result.presentation?.values[0]).toMatchObject({ kind: 'original', value: '<a href="#"><img></a>' })
    expect(result.details).toBeUndefined()
  })

  it('passes when image has alt text and lists the inspected linked image', async () => {
    const result = await run('<a href="#"><img alt="Logo"/></a>')
    expect(result.type).toBe('ok'); expect(result.priority).toBe(850)
    expect(value(result, 'Without alt or text')).toBe(0)
    expect(result.presentation?.markup.map((field) => field.value)).toEqual(['<a href="#"><img alt="Logo"></a>'])
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'alt')?.value).toBe('Logo')
  })

  it('passes when image has no alt but link has text content', async () => {
    const result = await run('<a href="#"><img/>Click here</a>')
    expect(result.type).toBe('ok')
  })

  it('passes when link has no images, with zero counts and no evidence', async () => {
    const result = await run('<a href="#">Text only link</a>')
    expect(result.type).toBe('ok')
    expect(value(result, 'Linked images')).toBe(0); expect(value(result, 'Without alt or text')).toBe(0)
    expect(result.presentation?.markup).toEqual([]); expect(result.presentation?.evidence).toEqual([])
  })

  it('warns for multiple linked images without alt and no text, with complete markup in the overview', async () => {
    const html = '<a href="#1"><img/></a><a href="#2"><img/></a>'
    const result = await run(html)
    expect(result.type).toBe('warn')
    expect(value(result, 'Linked images')).toBe(2); expect(value(result, 'Without alt or text')).toBe(2)
    expect(result.presentation?.values.filter((field) => field.kind === 'original').map((field) => field.value)).toEqual(['<a href="#1"><img></a>', '<a href="#2"><img></a>'])
    expect(result.presentation?.markup.map((field) => field.key)).toEqual(['<a> 1', '<a> 2'])
    expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('carries every failing linked image with its dom path and summarizes the links above three', async () => {
    const html = '<a href="/1"><img/></a><a href="/2"><img/></a><a href="/3"><img/></a><a href="/4"><img/></a>'
    const result = await run(html)
    expect(result.type).toBe('warn')
    expect(value(result, 'Without alt or text')).toBe(4)
    expect(value(result, 'Links')).toBe('/1, /2, /3, /4')
    expect(detail(result, 'Evidence retained')).toBe(4); expect(detail(result, 'Evidence omitted')).toBe(0)
    expect(result.presentation?.evidence).toHaveLength(4)
    expect(result.presentation?.evidence.every((record) => record.fields.filter((field) => field.kind === 'path').map((field) => field.key).join() === 'DOM path')).toBe(true)
  })

  it('uses a text field, never a url field, for an href that cannot resolve to http(s)', async () => {
    const result = await run('<a href="javascript:void(0)"><img/></a>')
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'href')).toEqual({ key: 'href', value: 'javascript:void(0)', kind: 'text' })
  })

  it('distinguishes an absent alt attribute from an empty one', async () => {
    const result = await run('<a href="/a"><img></a><a href="/b"><img alt=" "></a>')
    expect(result.presentation?.evidence.map((record) => record.fields.find((field) => field.key === 'alt')?.value)).toEqual(['Absent', 'Empty'])
  })

  it('states unretained linked image markup inside the element record', async () => {
    const result = await run(`<a href="/big" data-x="${'x'.repeat(2000)}"><img></a>`)
    expect(result.presentation?.markup).toEqual([])
    expect(result.presentation?.evidence[0]?.fields).toContainEqual({ key: 'Markup', value: 'Not captured', kind: 'text' })
    expect(detail(result, 'Markup retained')).toBe(0); expect(detail(result, 'Markup omitted')).toBe(1)
  })
})
