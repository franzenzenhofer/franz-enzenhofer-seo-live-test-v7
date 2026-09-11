import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PanelHeader } from '@/sidepanel/ui/PanelHeader'

/**
 * Real user report (7.0.341): after an in-page pushState navigation the panel
 * still showed the previous run, its URL field said the previous URL, and Run
 * test would have navigated the tab BACK to it. Run test must target the tab's
 * current page unless the user deliberately edited the field.
 */
const executeRunNow = vi.hoisted(() => vi.fn(async (url?: string) => url || 'https://www.example.com/r/2ATSZG006B'))
vi.mock('@/sidepanel/utils/runNow', () => ({ executeRunNow }))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
// The header also follows the active tab's URL (useCurrentPageUrl); here the tab is on the last run's URL.
const listeners = { addListener: () => {}, removeListener: () => {} }
vi.stubGlobal('chrome', {
  runtime: { getManifest: () => ({ version: '7.0.0' }), getURL: (path: string) => `chrome-extension://x/${path}` },
  tabs: {
    onActivated: listeners, onUpdated: listeners,
    query: async () => [{ id: 5, url: 'https://www.example.com/a/bike' }],
    get: async () => ({ id: 5, url: 'https://www.example.com/a/bike' }),
  },
  storage: { local: { get: async () => ({}) }, onChanged: listeners },
})

const noop = () => {}
const header = (url: string) => (
  <PanelHeader url={url} runId="run-1" status="completed" starting={false} debugEnabled={false}
    onOpenReport={noop} onClean={noop} onOpenLogs={noop} onOpenSettings={noop} />
)

let container: HTMLDivElement
let root: Root
beforeEach(() => {
  executeRunNow.mockClear()
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
const runButton = () => Array.from(container.querySelectorAll('button')).find((b) => b.textContent === 'Run test')!
const type = (value: string) => act(async () => {
  // React's controlled input tracks the native setter; bypass it the way user typing does.
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input(), value)
  input().dispatchEvent(new Event('input', { bubbles: true }))
})
const clickRun = () => act(async () => { runButton().click() })

describe('PanelHeader: what Run test targets', () => {
  it('targets the tab\'s current page (no URL) when the field is merely prefilled from the last run', async () => {
    await render('https://www.example.com/a/bike')
    expect(input().value).toBe('https://www.example.com/a/bike')
    await clickRun()
    expect(executeRunNow).toHaveBeenCalledWith(undefined)
    // The field then shows the page that was actually loaded.
    expect(input().value).toBe('https://www.example.com/r/2ATSZG006B')
  })

  it('targets the typed URL once the user edited the field', async () => {
    await render('https://www.example.com/a/bike')
    await type('https://www.example.com/r/other')
    await clickRun()
    expect(executeRunNow).toHaveBeenCalledWith('https://www.example.com/r/other')
  })

  it('forgets the edit when a new run\'s URL arrives from storage and shows the tab\'s page again', async () => {
    await render('https://www.example.com/a/bike')
    await type('https://typed.test/')
    await render('https://www.example.com/r/2ATSZG006B')
    expect(input().value).toBe('https://www.example.com/a/bike')
    await clickRun()
    expect(executeRunNow).toHaveBeenCalledWith(undefined)
  })
})
