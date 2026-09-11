import { beforeEach, describe, expect, it, vi } from 'vitest'

const order: string[] = []
const hardRefreshTab = vi.hoisted(() => vi.fn(async (_tabId: number, url?: string) => ({ navigation: url ? 'navigate' : 'reload', clearCaches: true, target: url || 'https://example.test/' })))
vi.mock('@/shared/hardRefresh', () => ({ hardRefreshTab: (...args: unknown[]) => { order.push('hardRefresh'); return hardRefreshTab(...args as [number, string?]) } }))
vi.mock('@/shared/logs', () => ({ log: vi.fn(async () => {}) }))

import { executeRunNow } from '@/sidepanel/utils/runNow'

const local: Record<string, unknown> = {}
let reply: unknown = { ok: true }

beforeEach(() => {
  order.length = 0
  reply = { ok: true }
  hardRefreshTab.mockClear()
  for (const key of Object.keys(local)) delete local[key]
  local['results-meta:7'] = { status: 'starting', url: 'https://example.test/', ranAt: 'x' }
  vi.stubGlobal('chrome', {
    tabs: {
      query: vi.fn(async () => [{ id: 7, url: 'https://example.test/' }]),
      get: vi.fn(async () => ({ id: 7, url: 'https://example.test/' })),
    },
    runtime: { sendMessage: vi.fn(async (message: unknown) => { order.push(`send:${JSON.stringify(message)}`); return reply }) },
    storage: { local: { remove: vi.fn(async (key: string) => { delete local[key] }) } },
  })
})

describe('executeRunNow', () => {
  it('asks the background to kill the live state and mark the run starting BEFORE the single navigation', async () => {
    // No URL: the tab's CURRENT page is reloaded and reported back as the loaded URL.
    expect(await executeRunNow()).toBe('https://example.test/')
    expect(order).toEqual([
      'send:{"t":"panel:run-start","d":{"tabId":7,"url":"https://example.test/"}}',
      'hardRefresh',
    ])
    expect(hardRefreshTab).toHaveBeenCalledWith(7, undefined)
  })

  it('passes the normalized URL on to the background and the refresh', async () => {
    expect(await executeRunNow('example.test/page')).toBe('https://example.test/page')
    expect(order[0]).toContain('"url":"https://example.test/page"')
    expect(hardRefreshTab).toHaveBeenCalledWith(7, 'https://example.test/page')
  })

  it('does not navigate when the background refuses the start', async () => {
    reply = { ok: false, error: 'boom' }
    await expect(executeRunNow()).rejects.toThrow('boom')
    expect(hardRefreshTab).not.toHaveBeenCalled()
  })

  it('removes the starting meta again when the navigation itself fails', async () => {
    hardRefreshTab.mockRejectedValueOnce(new Error('No tab with id'))
    await expect(executeRunNow()).rejects.toThrow('No tab with id')
    expect(local['results-meta:7']).toBeUndefined()
  })

  it('rejects a malformed URL visibly (the button shows the message) before anything is touched', async () => {
    await expect(executeRunNow('https://exa mple.test/')).rejects.toThrow('Invalid URL. Use a full URL like https://example.com/path')
    expect(order).toEqual([])
  })

  it('accepts a scheme-less entry by assuming https', async () => {
    expect(await executeRunNow('example.test')).toBe('https://example.test')
    expect(hardRefreshTab).toHaveBeenCalledWith(7, 'https://example.test')
  })

  it('still refuses restricted and unsafe pages before touching anything', async () => {
    await expect(executeRunNow('https://example.test/wp-admin/edit.php')).rejects.toThrow(/Not tested/)
    ;(chrome.tabs.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 7, url: 'chrome://extensions/' })
    await expect(executeRunNow()).rejects.toThrow(/Cannot run on chrome:\/\/ pages/)
    expect(order).toEqual([])
  })
})
