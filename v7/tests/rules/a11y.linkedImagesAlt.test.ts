import { describe, expect, it } from 'vitest'

import { enrichResult } from '@/core/runHelpers'
import { linkedImagesAltRule as rule } from '@/rules/a11y/linkedImagesAlt'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const doc = (h: string) => new DOMParser().parseFromString(h, 'text/html')
const run = async (html: string) => enrichResult(await rule.run({ html, url: 'https://example.com/', doc: doc(html) }, { globals: {} }), rule, 'test')
const value = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.values.find((field) => field.key === key)?.value
const detail = (result: Awaited<ReturnType<typeof run>>, key: string) => result.presentation?.detailValues.find((field) => field.key === key)?.value

describe('rule: linked images alt', () => {
  it('warns when image has no alt and link has no text', async () => {
    const result = await run('<a href="#"><img/></a>')
    expect(result.type).toBe('warn'); expect(result.priority).toBe(100)
    expect(value(result, 'Linked images missing alt or text')).toBe(1)
    expect(result.details).toBeUndefined()
  })

  it('passes when image has alt text', async () => {
    const result = await run('<a href="#"><img alt="Logo"/></a>')
    expect(result.type).toBe('ok'); expect(result.priority).toBe(850)
    expect(value(result, 'Linked images missing alt or text')).toBe(0)
    expect(result.presentation?.markup).toEqual([])
  })

  it('passes when image has no alt but link has text content', async () => {
    const result = await run('<a href="#"><img/>Click here</a>')
    expect(result.type).toBe('ok')
  })

  it('passes when link has no images', async () => {
    const result = await run('<a href="#">Text only link</a>')
    expect(result.type).toBe('ok')
  })

  it('warns for multiple linked images without alt and no text, with complete markup', async () => {
    const html = '<a href="#1"><img/></a><a href="#2"><img/></a>'
    const result = await run(html)
    expect(result.type).toBe('warn')
    expect(value(result, 'Linked images missing alt or text')).toBe(2)
    expect(result.presentation?.markup.map((field) => field.value)).toEqual(['<a href="#1"><img></a>', '<a href="#2"><img></a>'])
    expect(toResultCopyPayload(result)).toContain(rule.meta.references[0])
  })

  it('carries every failing linked image with its dom path', async () => {
    const html = '<a href="#1"><img/></a><a href="#2"><img/></a><a href="#3"><img/></a><a href="#4"><img/></a>'
    const result = await run(html)
    expect(result.type).toBe('warn')
    expect(value(result, 'Linked images missing alt or text')).toBe(4)
    expect(detail(result, 'Examples retained')).toBe(4); expect(detail(result, 'Examples omitted')).toBe(0)
    expect(result.presentation?.evidence).toHaveLength(4)
    expect(result.presentation?.evidence.every((record) => record.fields.some((field) => field.key === 'DOM path'))).toBe(true)
  })

  it('uses a text field, never a url field, for an href that cannot resolve to http(s)', async () => {
    const result = await run('<a href="javascript:void(0)"><img/></a>')
    expect(result.presentation?.evidence[0]?.fields.find((field) => field.key === 'Link href')).toEqual({ key: 'Link href', value: 'javascript:void(0)', kind: 'text' })
  })

  it('distinguishes an absent alt attribute from an empty one', async () => {
    const result = await run('<a href="/a"><img></a><a href="/b"><img alt=" "></a>')
    expect(result.presentation?.evidence.map((record) => record.fields.find((field) => field.key === 'Image alt attribute')?.value)).toEqual(['Absent', 'Empty or whitespace only'])
  })

  it('states unretained linked image markup', async () => {
    const result = await run(`<a href="/big" data-x="${'x'.repeat(2000)}"><img></a>`)
    expect(result.presentation?.markup).toEqual([])
    expect(result.presentation?.evidence.find((record) => record.name === 'Capture status')?.fields).toEqual([{ key: 'Linked image markup 1', value: 'Complete original markup not retained', kind: 'text' }])
  })
})
