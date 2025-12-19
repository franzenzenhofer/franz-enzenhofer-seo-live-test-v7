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

  it('fails when no encoding header but other headers present', async () => {
    const result = await run({ 'content-type': 'text/html' })
    expect(result.type).toBe('error')
    expect(result.message).toContain('No content-encoding header')
  })

  it('warns when encoding unsupported', async () => {
    const result = await run({ 'content-encoding': 'zstd' })
    expect(result.message).toContain('Unsupported')
    expect(result.type).toBe('warn')
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

  it('fails when no content-encoding header present', async () => {
    const result = await run({ 'content-type': 'text/html' })
    expect(result.type).toBe('error')
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
})
