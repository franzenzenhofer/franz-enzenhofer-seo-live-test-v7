import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { TypeFilters } from '@/sidepanel/ui/TypeFilters'
import { createDefaultTypeVisibility } from '@/shared/resultFilterState'
import { toggleType } from '@/shared/typeFilterSelection'
import type { Result } from '@/shared/results'

const results = [
  ...Array.from({ length: 2 }, () => ({ type: 'error', name: 'e', label: 'L', message: 'm' })),
  ...Array.from({ length: 8 }, () => ({ type: 'warn', name: 'w', label: 'L', message: 'm' })),
] as Result[]

const render = (show: Record<string, boolean>) =>
  renderToStaticMarkup(<TypeFilters show={show} setShow={() => {}} results={results} debugEnabled={false} />)

describe('TypeFilters', () => {
  it('disables chips with no results - an empty facet is not a filter', () => {
    const html = render(createDefaultTypeVisibility())
    expect(html).toContain('No ok results')
    expect(html).toMatch(/disabled/)
  })

  it('offers "show only" while unfiltered, not "hide"', () => {
    expect(render(createDefaultTypeVisibility())).toContain('Show only failed')
  })

  it('offers a way back once a filter is applied', () => {
    const filtered = toggleType(createDefaultTypeVisibility(), 'error')
    const html = render(filtered)
    expect(html).toContain('Show all')
    expect(html).toContain('Stop showing failed')
  })

  it('marks the selected chip as pressed for assistive tech', () => {
    const filtered = toggleType(createDefaultTypeVisibility(), 'error')
    expect(render(filtered)).toContain('aria-pressed="true"')
  })

  it('shows no reset affordance when nothing is filtered', () => {
    expect(render(createDefaultTypeVisibility())).not.toContain('Show all')
  })
})
