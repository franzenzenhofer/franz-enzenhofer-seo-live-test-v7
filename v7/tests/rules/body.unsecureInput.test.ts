import { describe, expect, it, vi } from 'vitest'
import { unsecureInputRule } from '@/rules/body/unsecureInput'
const run = (url: string, html = '') => unsecureInputRule.run({ html, url, doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
const value = (r: Awaited<ReturnType<typeof run>>, key: string) => r.presentation?.values.find((field) => field.key === key)?.value
describe('password fields on HTTP pages', () => {
  it('reports HTTPS as not applicable without inspecting password fields', async () => {
    const doc = new DOMParser().parseFromString('<input type="password">', 'text/html')
    const query = vi.spyOn(doc, 'querySelectorAll')
    const r = await unsecureInputRule.run({ html: '', url: 'https://example.test/', doc }, { globals: {} })
    expect(r.type).toBe('not_applicable'); expect(query).not.toHaveBeenCalled()
    expect(r.presentation?.input).toBe('Page URL')
    expect(r.presentation?.values).toEqual([{ key: 'Page protocol', value: 'https:', kind: 'text' }, { key: 'Password fields', value: 'Not checked', kind: 'text' }])
    expect(r.presentation?.detailValues).toEqual([{ key: 'Current page URL', value: 'https://example.test/', kind: 'url' }])
    expect(r.presentation?.markup).toEqual([])
  })
  it('never describes an invalid URL or another scheme as HTTPS', async () => {
    const invalid = await run('invalid URL')
    expect(invalid.type).toBe('runtime_error'); expect(invalid.message).not.toContain('https')
    expect(value(invalid, 'Page protocol')).toBe('Invalid URL')
    const other = await run('ftp://example.test/')
    expect(other.type).toBe('not_applicable'); expect(value(other, 'Page protocol')).toBe('ftp:')
  })
  it('warns on HTTP inputs with complete source in the overview and passes zero matches', async () => {
    const html = '<input id="password" class="login" type="PASSWORD" autocomplete="current-password">'
    const r = await run('http://example.test/', html)
    expect(r.type).toBe('warn'); expect(value(r, 'Page protocol')).toBe('http:')
    expect(r.presentation?.values[1]).toMatchObject({ key: '<input>', kind: 'original', value: html })
    expect(r.presentation?.markup[0].value).toBe(html)
    expect(r.presentation?.references).toEqual(unsecureInputRule.meta.references)
    const empty = await run('http://example.test/')
    expect(empty.type).toBe('ok'); expect(value(empty, 'Password fields')).toBe(0)
  })
})
