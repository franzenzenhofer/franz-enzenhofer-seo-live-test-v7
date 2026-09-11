import { beforeEach, describe, expect, it, vi } from 'vitest'

import { hardRefreshTab, planHardRefresh } from '@/shared/hardRefresh'

// Real Logger over a storage shim (pattern: tests/background.commands.test.ts);
// the tab log records what the button did. Records the order of every
// tab-affecting call: the cache clearing must land BEFORE the one navigation,
// and there must be exactly one navigation.
const calls: string[] = []
const session: Record<string, unknown> = {}
let currentUrl: string | undefined = 'https://example.com/'

beforeEach(() => {
  calls.length = 0
  for (const key of Object.keys(session)) delete session[key]
  currentUrl = 'https://example.com/'
  vi.stubGlobal('chrome', {
    tabs: {
      get: vi.fn(async () => ({ id: 7, url: currentUrl })),
      reload: vi.fn(async (_id: number, props: { bypassCache: boolean }) => { calls.push(`reload:${props.bypassCache}`) }),
      update: vi.fn(async (_id: number, props: { url: string }) => { calls.push(`update:${props.url}`) }),
    },
    scripting: { executeScript: vi.fn(async () => { calls.push('executeScript'); return [{ result: 1 }] }) },
    storage: {
      local: { get: async () => ({ 'ui:debug': true }) },
      session: {
        get: async (key: string) => ({ [key]: session[key] }),
        set: async (obj: Record<string, unknown>) => { Object.assign(session, obj) },
      },
    },
  })
})

const navigations = () => calls.filter((call) => call !== 'executeScript')
const tabLog = () => (session['logs:7'] as string[] | undefined) || []

describe('planHardRefresh', () => {
  it('reloads when no URL or the tab\'s own URL is given, normalizing the trailing slash', () => {
    expect(planHardRefresh('https://example.com/', undefined)).toEqual({ navigation: 'reload', clearCaches: true, target: 'https://example.com/' })
    expect(planHardRefresh('https://example.com/', 'https://example.com')).toEqual({ navigation: 'reload', clearCaches: true, target: 'https://example.com/' })
  })

  it('navigates once to a different URL and clears caches only for the same origin', () => {
    expect(planHardRefresh('https://example.com/', 'https://example.com/other')).toEqual({ navigation: 'navigate', clearCaches: true, target: 'https://example.com/other' })
    expect(planHardRefresh('https://example.com/', 'https://other.test/')).toEqual({ navigation: 'navigate', clearCaches: false, target: 'https://other.test/' })
    expect(planHardRefresh(undefined, 'https://other.test/')).toEqual({ navigation: 'navigate', clearCaches: false, target: 'https://other.test/' })
  })

  it('fails loudly, with the offending value, on a URL the panel validation should have refused', () => {
    expect(() => planHardRefresh('https://example.com/', 'example.com')).toThrow('Run test: the target is not a valid URL: example.com')
    expect(() => planHardRefresh('not a url', 'https://example.com/')).toThrow('Run test: the tab URL is not a valid URL: not a url')
  })
})

describe('hardRefreshTab', () => {
  it('clears service workers and CacheStorage, then reloads the current URL once with bypassCache', async () => {
    expect(await hardRefreshTab(7, 'https://example.com')).toMatchObject({ navigation: 'reload', target: 'https://example.com/' })
    expect(calls).toEqual(['executeScript', 'executeScript', 'reload:true'])
    expect(chrome.tabs.update).not.toHaveBeenCalled()
    expect(tabLog().some((line) => line.includes('hard-refresh') && line.includes('complete'))).toBe(true)
  })

  it('performs a single navigation for a different URL, never an update followed by a reload', async () => {
    await hardRefreshTab(7, 'https://example.com/page')
    expect(calls).toEqual(['executeScript', 'executeScript', 'update:https://example.com/page'])
    expect(navigations()).toHaveLength(1)
    expect(chrome.tabs.reload).not.toHaveBeenCalled()
  })

  it('skips the in-page cache clearing for a cross-origin target, says so in the tab log, and still navigates exactly once', async () => {
    await hardRefreshTab(7, 'https://other.test/')
    expect(calls).toEqual(['update:https://other.test/'])
    expect(tabLog().some((line) => line.includes('clear skipped') && line.includes('cross-origin'))).toBe(true)
  })

  it('still reloads when the page refuses scripting, and reports the failure', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    ;(chrome.scripting.executeScript as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Cannot access contents of the page'))
    await hardRefreshTab(7)
    expect(navigations()).toEqual(['reload:true'])
    expect(warn).toHaveBeenCalledTimes(1)
    expect(tabLog().some((line) => line.includes('clear failed') && line.includes('Cannot access contents'))).toBe(true)
  })
})
