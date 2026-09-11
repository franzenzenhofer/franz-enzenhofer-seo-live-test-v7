import { JSDOM } from 'jsdom'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PresentationCard } from '../src/components/presentation/Card'
import { createPresentation, textField } from '../src/shared/presentation/create'

const result = {
  name: 'Page title length', label: 'HEAD', message: 'Title length: 35', type: 'info' as const, ruleId: 'head:title', priority: 1, runIndex: 1,
  presentation: createPresentation({ name: 'Page title length', input: 'Static DOM', pageUrl: 'https://example.test/',
    values: [textField('Title length', 35)], checked: [textField('Selector', 'head > title')] }),
}
const card = (props: { defaultExpanded: boolean; isDisabled?: boolean }) => new JSDOM(renderToStaticMarkup(<PresentationCard result={result} {...props} />)).window.document
const details = (doc: Document) => doc.getElementById(doc.querySelector('button[aria-expanded][aria-controls]')!.getAttribute('aria-controls')!)!
const overviewKeys = (doc: Document) => [...doc.querySelectorAll('dt')].filter((dt) => !details(doc).contains(dt)).map((dt) => dt.textContent)
const smallLine = (doc: Document) => doc.querySelector('[data-testid="checked-input"]')!

describe('checked input placement (saves a line per card)', () => {
  it('collapsed: shows only the value as small text at the bottom left, no full-size row', () => {
    const doc = card({ defaultExpanded: false })
    expect(smallLine(doc).hasAttribute('hidden')).toBe(false)
    expect(smallLine(doc).className).toContain('text-xs')
    expect(smallLine(doc).textContent).toBe('Checked input: Static DOM')
    expect(smallLine(doc).querySelector('.sr-only')?.textContent).toBe('Checked input: ')
    expect(smallLine(doc).nextElementSibling).toBe(details(doc))
    expect(overviewKeys(doc)).toEqual(['Title length:'])
  })

  it('expanded: the small line is gone and Checked input is the first row below the divider', () => {
    const doc = card({ defaultExpanded: true })
    expect(smallLine(doc).hasAttribute('hidden')).toBe(true)
    expect(details(doc).className).toContain('border-t')
    const first = details(doc).querySelector('dt')!
    expect(first.textContent).toBe('Checked input:')
    expect(first.nextElementSibling?.textContent).toBe('Static DOM')
  })

  it('keeps the disabled notice in the overview', () => {
    expect(overviewKeys(card({ defaultExpanded: false, isDisabled: true }))).toEqual(['Next run:', 'Title length:'])
  })
})
