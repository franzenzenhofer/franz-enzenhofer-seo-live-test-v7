import { afterEach, describe, expect, it, vi } from 'vitest'

import { gzipRule } from '@/rules/http/gzip'
import { enrichResult } from '@/core/runHelpers'
import { toResultCopyPayload } from '@/components/result/resultCopy'

const page = (headers?: Record<string, string>, extra: Record<string, unknown> = {}) =>
  ({ html: '', url: 'https://example.com', doc: new DOMParser().parseFromString('<html></html>', 'text/html'), headers, ...extra })
const run = (headers?: Record<string, string>, extra: Record<string, unknown> = {}) => gzipRule.run(page(headers, extra), { globals: {} })

describe('http:gzip rule', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns runtime_error when no headers captured', async () => {
    const result = await run({})
    expect(result.type).toBe('runtime_error')
    expect(result.priority).toBe(50)
    expect(result.presentation?.input).toBe('Not captured')
    expect(result.presentation?.values).toEqual([{ key: 'Response headers', value: 'Not captured', kind: 'text' }])
    expect(result.presentation?.noMarkup).toContain('HTTP response')
  })

  it('warns when no encoding header but other headers present', async () => {
    const result = await run({ 'content-type': 'text/html' })
    expect(result.type).toBe('warn')
    expect(result.priority).toBe(150)
    expect(result.presentation?.values).toEqual([{ key: 'Content-Encoding', value: 'Absent', kind: 'text' }])
  })

  it('warns when encoding unsupported', async () => {
    const result = await run({ 'content-encoding': 'compress' })
    expect(result.type).toBe('warn')
    expect(result.presentation?.values).toContainEqual({ key: 'Content-Encoding', value: 'compress', kind: 'text' })
    expect(result.presentation?.values).toContainEqual({ key: 'Codings', value: 'LZW compress', kind: 'text' })
  })

  it('passes when zstd present (modern browsers support Zstandard)', async () => {
    const result = await run({ 'content-encoding': 'zstd' })
    expect(result.type).toBe('ok')
    expect(result.priority).toBe(800)
    expect(result.presentation?.values).toContainEqual({ key: 'Content-Encoding', value: 'zstd', kind: 'text' })
  })

  it('passes when deflate present (accepted by Lighthouse)', async () => {
    const result = await run({ 'content-encoding': 'deflate' })
    expect(result.type).toBe('ok')
  })

  it('passes when gzip present', async () => {
    const result = await run({ 'content-encoding': 'gzip' })
    expect(result.type).toBe('ok')
  })

  it('passes when br present even with other encodings', async () => {
    const result = await run({ 'content-encoding': 'br, zstd' })
    expect(result.type).toBe('ok')
    expect(result.presentation?.values).toContainEqual({ key: 'Content-Encoding', value: 'br, zstd', kind: 'text' })
    expect(result.presentation?.values).toContainEqual({ key: 'Codings', value: 'Brotli, Zstandard', kind: 'text' })
    expect(result.presentation?.evidence.map((record) => record.name)).toEqual(['Content-Encoding', 'Content-Encoding token br', 'Content-Encoding token zstd'])
  })

  it('preserves original header values in evidence', async () => {
    const result = await run({ 'content-encoding': 'gzip', 'x-trace': 'abc' })
    const record = result.presentation?.evidence.find((e) => e.name === 'Content-Encoding')
    expect(record?.fields).toEqual([{ key: 'Value', value: 'gzip', kind: 'text' }])
    expect(JSON.stringify(result.presentation)).not.toContain('x-trace')
  })

  it('re-probes main document when captured headers look like an asset', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, {
        headers: {
          'content-encoding': 'gzip',
          'content-type': 'text/html; charset=utf-8',
        },
      }),
    )
    const result = await run({ 'content-type': 'image/png' })
    expect(result.type).toBe('ok')
    expect(result.presentation?.checked).toContainEqual({ key: 'Header source', value: 'HEAD re-probe of the page URL', kind: 'text' })
    expect(result.presentation?.values.map((field) => field.key)).not.toContain('Header source')
  })

  it('does not re-probe when page headers already came from a live probe', async () => {
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    const result = await gzipRule.run(
      page({ 'content-type': 'image/png' }, { headerSource: 'probe' }),
      { globals: {} },
    )
    expect(f).not.toHaveBeenCalled()
    expect(result.type).toBe('warn')
    expect(result.presentation?.checked).toContainEqual({ key: 'Header source', value: 'Captured response headers', kind: 'text' })
    expect(result.details).toBeUndefined()
  })

  it('copies references and labelled facts without legacy details', async () => {
    const result = enrichResult(await run({ 'content-encoding': 'gzip' }), gzipRule, 'test')
    const copy = toResultCopyPayload(result)
    for (const value of ['Content-Encoding: gzip', ...gzipRule.meta.references]) expect(copy).toContain(value)
    expect(result.details).toBeUndefined()
  })
})
