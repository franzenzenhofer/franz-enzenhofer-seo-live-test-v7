import { beforeEach, describe, expect, it, vi } from 'vitest'

import { hardRefreshTab, planHardRefresh } from '@/shared/hardRefresh'

vi.mock('@/shared/logger', () => ({ Logger: { logDirect: vi.fn(async () => {}), setContext: vi.fn() } }))

// Records the order of every tab-affecting call: the cache clearing must land
// BEFORE the one navigation, and there must be exactly one navigation.
const calls: string[] = []
let currentUrl: string | undefined = 'https://example.com/'

beforeEach(() => {
  calls.length = 0
  currentUrl = 'https://example.com/'
  vi.stubGlobal('chrome', {
    tabs: {
      get: vi.fn(async () => ({ id: 7, url: currentUrl })),
      reload: vi.fn(async (_id: number, props: { bypassCache: boolean }) => { calls.push(`reload:${props.bypassCache}`) }),
      update: vi.fn(async (_id: number, props: { url: string }) => { calls.push(`update:${props.url}`) }),
    },
    scripting: { executeScript: vi.fn(async () => { calls.push('executeScript'); return [{ result: 1 }] }) },
  })
})

const navigations = () => calls.filter((call) => call !== 'executeScript')

describe('planHardRefresh', () => {
  it('reloads when no URL or the tab\'s own URL is given, normalizing the trailing slash', () => {
    expect(planHardRefresh('https://example.com/', undefined)).toEqual({ navigation: 'reload', clearCaches: true, target: 'https://example.com/' })
    expect(planHardRefresh('https://example.com/', 'https://example.com')).toMatchObject({ navigation: 'reload', clearCaches: true })
  })

  it('navigates once to a different URL and clears caches only for the same origin', () => {
    expect(planHardRefresh('https://example.com/', 'https://example.com/other')).toEqual({ navigation: 'navigate', clearCaches: true, target: 'https://example.com/other' })
    expect(planHardRefresh('https://example.com/', 'https://other.test/')).toEqual({ navigation: 'navigate', clearCaches: false, target: 'https://other.test/' })
    expect(planHardRefresh(undefined, 'https://other.test/')).toEqual({ navigation: 'navigate', clearCaches: false, target: 'https://other.test/' })
  })
})

describe('hardRefreshTab', () => {
  it('clears service workers and CacheStorage, then reloads the current URL once with bypassCache', async () => {
    await hardRefreshTab(7, 'https://example.com')
    expect(calls).toEqual(['executeScript', 'executeScript', 'reload:true'])
    expect(chrome.tabs.update).not.toHaveBeenCalled()
  })

  it('performs a single navigation for a different URL, never an update followed by a reload', async () => {
    await hardRefreshTab(7, 'https://example.com/page')
    expect(calls).toEqual(['executeScript', 'executeScript', 'update:https://example.com/page'])
    expect(navigations()).toHaveLength(1)
    expect(chrome.tabs.reload).not.toHaveBeenCalled()
  })

  it('skips the in-page cache clearing for a cross-origin target and still navigates exactly once', async () => {
    await hardRefreshTab(7, 'https://other.test/')
    expect(calls).toEqual(['update:https://other.test/'])
  })

  it('still reloads when the page refuses scripting, and reports the failure', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    ;(chrome.scripting.executeScript as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Cannot access contents of the page'))
    await hardRefreshTab(7)
    expect(navigations()).toEqual(['reload:true'])
    expect(warn).toHaveBeenCalledTimes(1)
  })
})
