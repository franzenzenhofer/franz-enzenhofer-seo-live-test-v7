import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCopyFeedback } from '@/components/result/useCopyFeedback'
import { ReportExportButtons } from '@/report/ExportButtons'
import type { Result } from '@/shared/results'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean }
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const results = [{ name: 'N', label: 'HEAD', message: 'm', type: 'ok', priority: 800, ruleId: 'head:x' }] as Result[]

let container: HTMLDivElement
let root: ReturnType<typeof createRoot>
let latest: ReturnType<typeof useCopyFeedback>

const Probe = () => {
  latest = useCopyFeedback()
  return <span>{latest.copied ? 'copied' : 'idle'}</span>
}

beforeEach(() => {
  vi.useFakeTimers()
  container = document.createElement('div')
  document.body.append(container)
  act(() => { root = createRoot(container) })
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const writeText = (impl: () => Promise<void>) =>
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn(impl) } })

describe('copy confirmation', () => {
  it('confirms only after the clipboard write succeeded, then resets', async () => {
    writeText(async () => {})
    await act(async () => { root.render(<Probe />) })
    expect(container.textContent).toBe('idle')

    let ok: boolean | undefined
    await act(async () => { ok = await latest.copy('payload') })
    expect(ok).toBe(true)
    expect(container.textContent).toBe('copied')

    act(() => { vi.advanceTimersByTime(2000) })
    expect(container.textContent).toBe('idle')
  })

  it('never claims "copied" when the clipboard write fails', async () => {
    writeText(async () => { throw new Error('denied') })
    await act(async () => { root.render(<Probe />) })
    let ok: boolean | undefined
    await act(async () => { ok = await latest.copy('payload') })
    expect(ok).toBe(false)
    expect(container.textContent).toBe('idle')
  })

  it('a repeated click restarts the confirmation from the latest write', async () => {
    writeText(async () => {})
    await act(async () => { root.render(<Probe />) })
    await act(async () => { await latest.copy('one') })
    act(() => { vi.advanceTimersByTime(1500) })
    await act(async () => { await latest.copy('two') })
    // The first click's timer must not clear the second click's confirmation.
    act(() => { vi.advanceTimersByTime(1500) })
    expect(container.textContent).toBe('copied')
    act(() => { vi.advanceTimersByTime(500) })
    expect(container.textContent).toBe('idle')
  })

  it('renders the full-report copy buttons with Tailwind classes and no premature success', () => {
    const html = renderToStaticMarkup(<ReportExportButtons url="https://ex.test/" results={results} />)
    expect(html).toContain('Copy JSON')
    expect(html).toContain('Copy HTML')
    expect(html).not.toContain('copied')
    expect(html).toContain('border px-2 py-1 text-xs rounded')
    expect(html).not.toContain('style=')
  })
})
