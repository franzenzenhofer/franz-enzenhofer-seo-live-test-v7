import { describe, it, expect, vi } from 'vitest'
import { fetchTextOnce } from '../src/shared/fetchOnce'

describe('URL Validation - No Chrome URLs', () => {
  it('blocks chrome:// URLs in fetchTextOnce', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await fetchTextOnce('chrome://new-tab-page/')
    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[fetchTextOnce] Invalid URL blocked')
    )

    consoleSpy.mockRestore()
  })

  it('blocks edge:// URLs in fetchTextOnce', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await fetchTextOnce('edge://settings/')
    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[fetchTextOnce] Invalid URL blocked')
    )

    consoleSpy.mockRestore()
  })

  it('blocks file:// URLs in fetchTextOnce', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await fetchTextOnce('file:///etc/passwd')
    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[fetchTextOnce] Invalid URL blocked')
    )

    consoleSpy.mockRestore()
  })

  it('allows http:// URLs', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('test content')
    })

    const result = await fetchTextOnce('http://example.com/robots.txt')
    expect(result).toBe('test content')
  })

  it('allows https:// URLs', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('test content')
    })

    const result = await fetchTextOnce('https://example.com/robots.txt')
    expect(result).toBe('test content')
  })
})