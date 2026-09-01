import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EvidenceBox } from '@/components/result/EvidenceBox'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const FULL = 'the full untruncated value with every character intact'

describe('EvidenceBox click-to-copy', () => {
  let container: HTMLDivElement
  let root: Root
  const writeText = vi.fn<(text: string) => Promise<void>>()

  beforeEach(() => {
    vi.useFakeTimers()
    writeText.mockReset().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.useRealTimers()
  })

  const render = (): void => {
    act(() => {
      root.render(<EvidenceBox testId="box" copyValue={FULL}>the full…</EvidenceBox>)
    })
  }
  const box = (): HTMLElement => container.querySelector('[data-testid="box"]') as HTMLElement

  it('copies the underlying full value, not the truncated display form', async () => {
    render()
    await act(async () => { box().click() })
    expect(writeText).toHaveBeenCalledWith(FULL)
  })

  it('confirms with a toast, then reverts after the shared 2s timing', async () => {
    render()
    await act(async () => { box().click() })
    expect(container.querySelector('[data-testid="copied-toast"]')?.textContent).toBe('Copied')
    act(() => { vi.advanceTimersByTime(2000) })
    expect(container.querySelector('[data-testid="copied-toast"]')).toBeNull()
  })

  it('never claims "Copied" when the clipboard write fails', async () => {
    writeText.mockRejectedValue(new Error('denied'))
    render()
    await act(async () => { box().click() })
    expect(container.querySelector('[data-testid="copied-toast"]')).toBeNull()
  })

  it('is a real button: keyboard-reachable with a copy affordance', () => {
    render()
    expect(box().tagName).toBe('BUTTON')
    expect(box().getAttribute('aria-label')).toContain('Copy')
  })
})
