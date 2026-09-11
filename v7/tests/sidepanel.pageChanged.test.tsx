import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PanelHeader } from '@/sidepanel/ui/PanelHeader'
import { isPageChanged } from '@/sidepanel/ui/PageChangedNotice'

/**
 * example.com report (7.0.341): after a pushState the header still said the
 * previous URL and presented the previous run as this page's. The header now
 * follows the tab's URL and says which URL the shown run belongs to.
 */
vi.mock('@/sidepanel/utils/runNow', () => ({ executeRunNow: vi.fn(async () => undefined) }))
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const RUN_URL = 'https://www.example.com/a/bike'
const NEW_URL = 'https://www.example.com/r/2ATSZG006B'
let tabUrl = RUN_URL
let autoRun: boolean | undefined
type Updated = (tabId: number, changeInfo: { url?: string }) => void
const updated: Updated[] = []
const noopEvent = { addListener: () => {}, removeListener: () => {} }
vi.stubGlobal('chrome', {
  runtime: { getManifest: () => ({ version: '7.0.0' }), getURL: (path: string) => `chrome-extension://x/${path}` },
  tabs: {
    onActivated: noopEvent,
    onUpdated: { addListener: (fn: Updated) => updated.push(fn), removeListener: (fn: Updated) => updated.splice(updated.indexOf(fn), 1) },
    query: async () => [{ id: 5, url: tabUrl }],
    get: async () => ({ id: 5, url: tabUrl }),
  },
  storage: { local: { get: async () => (autoRun === undefined ? {} : { 'ui:autoRun': autoRun }) }, onChanged: noopEvent },
})

const noop = () => {}
const header = (url: string) => (
  <PanelHeader url={url} runId="run-1" status="completed" starting={false} debugEnabled={false}
    onOpenReport={noop} onClean={noop} onOpenLogs={noop} onOpenSettings={noop} />
)
let container: HTMLDivElement
let root: Root
beforeEach(() => {
  tabUrl = RUN_URL
  autoRun = undefined
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => { root.unmount() })
  container.remove()
})
const render = (url: string) => act(async () => { root.render(header(url)) })
const input = () => container.querySelector('input')!
const notice = () => container.querySelector('[data-testid="page-changed"]')
const navigateInPage = (url: string) => act(async () => { tabUrl = url; updated.forEach((fn) => fn(5, { url })) })

describe('isPageChanged', () => {
  it('is a different URL once the fragment is dropped, never while a side is unknown', () => {
    expect(isPageChanged(NEW_URL, RUN_URL)).toBe(true)
    expect(isPageChanged(`${RUN_URL}#gallery`, RUN_URL)).toBe(false)
    expect(isPageChanged(RUN_URL, RUN_URL)).toBe(false)
    expect(isPageChanged(null, RUN_URL)).toBe(false)
    expect(isPageChanged(NEW_URL, '')).toBe(false)
  })
})

describe('PanelHeader after an in-page navigation', () => {
  it('shows the run\'s URL and no notice while the tab is still on it', async () => {
    await render(RUN_URL)
    expect(input().value).toBe(RUN_URL)
    expect(notice()).toBeNull()
  })

  it('follows the tab to the new URL and says the shown run belongs to the previous one (auto-run on)', async () => {
    await render(RUN_URL)
    await navigateInPage(NEW_URL)
    expect(input().value).toBe(NEW_URL)
    expect(notice()?.textContent).toContain(RUN_URL)
    expect(notice()?.textContent).toContain('Auto-run is on')
  })

  it('tells the user to click Run test when auto-run is off', async () => {
    autoRun = false
    await render(RUN_URL)
    await navigateInPage(NEW_URL)
    expect(notice()?.textContent).toContain('Auto-run is off: click Run test')
  })

  it('shows the current page at mount when the panel opens after the navigation', async () => {
    tabUrl = NEW_URL
    await render(RUN_URL)
    expect(input().value).toBe(NEW_URL)
    expect(notice()).not.toBeNull()
  })

  it('drops the notice once a run for the current URL arrives, and ignores a fragment jump', async () => {
    await render(RUN_URL)
    await navigateInPage(NEW_URL)
    await render(NEW_URL)
    expect(notice()).toBeNull()
    await navigateInPage(`${NEW_URL}#details`)
    expect(notice()).toBeNull()
    expect(input().value).toBe(`${NEW_URL}#details`)
  })
})
