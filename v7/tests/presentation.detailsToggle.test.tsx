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
const toggle = (expanded: boolean) => new JSDOM(renderToStaticMarkup(<PresentationCard result={result} defaultExpanded={expanded} />))
  .window.document.querySelector('button[aria-expanded][aria-controls]')!

describe('details toggle (icon-only, saves header space)', () => {
  it('is named by aria-label and tooltip, with no visible text and no chevron', () => {
    const closed = toggle(false)
    expect(closed.getAttribute('aria-label')).toBe('Show details')
    expect(closed.getAttribute('title')).toBe('Show details')
    expect(closed.getAttribute('aria-expanded')).toBe('false')
    expect(closed.textContent?.trim()).toBe('')
    expect(closed.innerHTML).not.toContain('m6 9 6 6 6-6')
    expect(closed.querySelectorAll('svg')).toHaveLength(1)
  })

  it('offers "Hide details" once expanded', () => {
    const open = toggle(true)
    expect(open.getAttribute('aria-label')).toBe('Hide details')
    expect(open.getAttribute('aria-expanded')).toBe('true')
    expect(open.textContent?.trim()).toBe('')
  })
})
