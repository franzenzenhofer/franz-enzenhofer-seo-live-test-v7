import { describe, expect, it, vi } from 'vitest'
import { unsecureInputRule } from '@/rules/body/unsecureInput'
const run = (url: string, html = '') => unsecureInputRule.run({ html, url, doc: new DOMParser().parseFromString(html, 'text/html') }, { globals: {} })
describe('password fields on HTTP pages', () => {
  it('reports HTTPS as not applicable without inspecting password fields', async () => {
    const doc = new DOMParser().parseFromString('<input type="password">', 'text/html')
    const query = vi.spyOn(doc, 'querySelectorAll')
    const r = await unsecureInputRule.run({ html: '', url: 'https://example.test/', doc }, { globals: {} })
    expect(r.type).toBe('not_applicable'); expect(query).not.toHaveBeenCalled()
    expect(r.presentation?.input).toBe('Page URL')
    expect(r.presentation?.checked).toContainEqual({ key: 'Password fields', value: 'Not checked', kind: 'text' })
    expect(r.presentation?.markup).toEqual([])
  })
  it('never describes an invalid URL or another scheme as HTTPS', async () => {
    const invalid = await run('invalid URL')
    expect(invalid.type).toBe('runtime_error'); expect(invalid.message).not.toContain('HTTPS')
    const other = await run('ftp://example.test/')
    expect(other.type).toBe('not_applicable'); expect(other.message).toContain('FTP')
  })
  it('warns on HTTP inputs with complete source and passes zero matches', async () => {
    const html = '<input id="password" class="login" type="PASSWORD" autocomplete="current-password">'
    const r = await run('http://example.test/', html)
    expect(r.type).toBe('warn'); expect(r.presentation?.values[0].value).toBe(1)
    expect(r.presentation?.markup[0].value).toBe(html)
    expect(r.presentation?.references).toEqual(unsecureInputRule.meta.references)
    const empty = await run('http://example.test/')
    expect(empty.type).toBe('ok'); expect(empty.presentation?.values[0].value).toBe(0)
  })
})
