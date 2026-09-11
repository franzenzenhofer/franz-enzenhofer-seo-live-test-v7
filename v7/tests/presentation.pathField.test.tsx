import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createPresentation, domPathField, pathField, textField } from '../src/shared/presentation/create'
import { presentationSchema } from '../src/shared/presentation/schema'
import { presentationCopy } from '../src/shared/presentation/copy'
import { collapsePath, PATH_COLLAPSE_MIN_LENGTH } from '../src/shared/presentation/pathDisplay'
import { PresentationCard } from '../src/components/presentation/Card'
import { Fields } from '../src/components/presentation/Fields'
import { toResultCopyPayload } from '../src/components/result/resultCopy'
import { matchesResult } from '../src/sidepanel/ui/resultQuery'
import type { Result } from '../src/shared/results'

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const MIDDLE = 'section:nth-of-type(3)'
const LONG = `html > body > div.page-wrapper > main#content > ${MIDDLE} > div.grid > ul.items > li:nth-of-type(4) > a.product-link`
const SHORT = 'html > body > h1.hero'
const view = () => createPresentation({ name: 'Heading', input: 'Static DOM', pageUrl: 'https://example.test/',
  values: [textField('Headings', 2)], checked: [textField('Selector', 'h1, a')],
  evidence: [{ name: 'Element 1', fields: [pathField('DOM path 1', LONG), pathField('DOM path 2', SHORT)] }],
  references: ['https://html.spec.whatwg.org/'],
})
const result = () => ({ name: 'Heading', label: 'BODY', message: 'Headings: 2', type: 'info' as const, ruleId: 'body-h1', priority: 1, runIndex: 1, presentation: view() })

describe('path field kind', () => {
  it('is a schema-checked field kind, and a missing path stays a stated reason', () => {
    expect(presentationSchema.safeParse(view()).success).toBe(true)
    for (const field of [{ key: 'DOM path', kind: 'path', value: '' }, { key: 'DOM path', kind: 'path', value: 5 },
      { key: 'DOM path', kind: 'path', value: SHORT, fidelity: 'complete-original' }]) {
      expect(presentationSchema.safeParse({ ...view(), values: [field] }).success).toBe(false)
    }
    expect(domPathField('DOM path', null, 'Not captured')).toEqual({ key: 'DOM path', value: 'Not captured', kind: 'text' })
    expect(domPathField('DOM path', SHORT, 'Not captured')).toEqual({ key: 'DOM path', value: SHORT, kind: 'path' })
  })

  it('shortens only long paths, at segment boundaries, keeping the element itself', () => {
    expect(collapsePath('x'.repeat(PATH_COLLAPSE_MIN_LENGTH))).toBeNull()
    const collapsed = collapsePath(LONG)!
    expect(collapsed.head).toBe('html > body > ')
    expect(collapsed.tail.startsWith(' > ')).toBe(true)
    expect(collapsed.tail.endsWith(' > a.product-link')).toBe(true)
    expect(`${collapsed.head}${collapsed.tail}`).not.toContain(MIDDLE)
    expect(collapsed.head.length + collapsed.tail.length).toBeLessThan(LONG.length)
    const unbroken = collapsePath('y'.repeat(80))!
    expect([unbroken.head.length, unbroken.tail.length]).toEqual([24, 32])
  })

  it('renders a long path collapsed with a toggle and a short path in full', () => {
    const doc = new JSDOM(renderToStaticMarkup(<PresentationCard result={result()} defaultExpanded />)).window.document
    const collapsed = doc.querySelector('[data-dom-path="collapsed"]')!
    expect(collapsed.textContent).toContain('…')
    expect(collapsed.textContent).not.toContain(MIDDLE)
    const toggle = doc.querySelector(`button[aria-controls="${collapsed.id}"]`)!
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(toggle.textContent).toBe('Expand')
    const short = doc.querySelector('[data-dom-path="full"]')!
    expect(short.textContent).toBe(SHORT)
    // Only the long path gets a toggle; the card's own buttons control other regions.
    const pathToggles = Array.from(doc.querySelectorAll('button[aria-controls]'))
      .filter((button) => doc.getElementById(button.getAttribute('aria-controls')!)?.hasAttribute('data-dom-path'))
    expect(pathToggles).toEqual([toggle])
    expect(short.id).toBe('')
  })

  it('copies and searches the complete path, never the shortened view', () => {
    expect(presentationCopy(result())).toContain(`DOM path 1: ${LONG}`)
    expect(toResultCopyPayload(result() as unknown as Result)).toContain(`DOM path 1: ${LONG}`)
    expect(matchesResult(result() as unknown as Result, { q: MIDDLE })).toBe(true)
  })
})

describe('path toggle', () => {
  let container: HTMLDivElement
  let root: Root
  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })
  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('expands to the full selectable value and collapses again', () => {
    act(() => { root.render(<Fields fields={[pathField('DOM path 1', LONG)]} pageUrl="https://example.test/" />) })
    const toggle = container.querySelector('button')!
    const path = () => document.getElementById(toggle.getAttribute('aria-controls')!)!
    expect(toggle.type).toBe('button')
    act(() => { toggle.click() })
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(path().textContent).toBe(LONG)
    expect(path().getAttribute('data-dom-path')).toBe('full')
    expect(toggle.textContent).toBe('Collapse')
    act(() => { toggle.click() })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(path().textContent).not.toContain(MIDDLE)
  })
})
