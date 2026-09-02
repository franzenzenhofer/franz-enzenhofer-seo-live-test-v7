import { afterEach, describe, expect, it, vi } from 'vitest'

import { gzipRule } from '@/rules/http/gzip'

const run = (headers?: Record<string, string>) =>
  gzipRule.run({ html: '', url: 'https://example.com', doc: new DOMParser().parseFromString('<html></html>', 'text/html'), headers } as any, { globals: {} })

describe('http:gzip rule', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns runtime_error when no headers captured', async () => {
    const result = await run({})
    expect(result.type).toBe('runtime_error')
    expect(result.message).toContain('Hard Reload')
  })

  it('warns when no encoding header but other headers present', async () => {
    const result = await run({ 'content-type': 'text/html' })
    expect(result.type).toBe('warn')
    expect(result.message).toContain('No content-encoding header')
  })

  it('warns when encoding unsupported', async () => {
    const result = await run({ 'content-encoding': 'compress' })
    expect(result.message).toContain('Unsupported')
    expect(result.type).toBe('warn')
  })

  it('passes when zstd present (modern browsers support Zstandard)', async () => {
    const result = await run({ 'content-encoding': 'zstd' })
    expect(result.type).toBe('ok')
    expect(result.message).toContain('zstd')
  })

  it('passes when deflate present (accepted by Lighthouse)', async () => {
    const result = await run({ 'content-encoding': 'deflate' })
    expect(result.type).toBe('ok')
    expect(result.message).toContain('compressed')
  })

  it('passes when gzip present', async () => {
    const result = await run({ 'content-encoding': 'gzip' })
    expect(result.type).toBe('ok')
    expect(result.message).toContain('compressed')
  })

  it('passes when br present even with other encodings', async () => {
    const result = await run({ 'content-encoding': 'br, zstd' })
    expect(result.type).toBe('ok')
    expect(result.message).toContain('br')
  })

  it('warns when no content-encoding header present', async () => {
    const result = await run({ 'content-type': 'text/html' })
    expect(result.type).toBe('warn')
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
    expect((result.details as any).headerSource).toBe('probe')
  })

  it('does not re-probe when page headers already came from a live probe', async () => {
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    const result = await gzipRule.run(
      {
        html: '',
        url: 'https://example.com',
        doc: new DOMParser().parseFromString('<html></html>', 'text/html'),
        headers: { 'content-type': 'image/png' },
        headerSource: 'probe',
      } as any,
      { globals: {} },
    )
    expect(f).not.toHaveBeenCalled()
    expect(result.type).toBe('warn')
    expect((result.details as any).headerSource).toBe('captured')
  })
})
