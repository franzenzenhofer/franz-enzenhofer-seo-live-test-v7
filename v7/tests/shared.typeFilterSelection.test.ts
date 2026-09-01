import { describe, it, expect } from 'vitest'

import { toggleType, isFiltered, selectedTypes, soloType, clearTypeFilter } from '@/shared/typeFilterSelection'
import { createDefaultTypeVisibility } from '@/shared/resultFilterState'

const all = createDefaultTypeVisibility()

describe('type filter selection', () => {
  it('treats "everything visible" as unfiltered', () => {
    expect(isFiltered(all)).toBe(false)
  })

  it('narrows to one type on the first click, rather than hiding it', () => {
    // The whole point: clicking "failed 2" must SHOW the 2 failures.
    const next = toggleType(all, 'error')
    expect(selectedTypes(next)).toEqual(['error'])
    expect(isFiltered(next)).toBe(true)
  })

  it('adds further types to the selection', () => {
    const next = toggleType(toggleType(all, 'error'), 'warn')
    expect(selectedTypes(next).sort()).toEqual(['error', 'warn'])
  })

  it('removes a type when it is one of several', () => {
    const two = toggleType(toggleType(all, 'error'), 'warn')
    expect(selectedTypes(toggleType(two, 'error'))).toEqual(['warn'])
  })

  it('returns to showing everything when the last selected type is switched off', () => {
    const one = toggleType(all, 'error')
    const back = toggleType(one, 'error')
    expect(isFiltered(back)).toBe(false)
  })

  it('solo jumps to a single type from any state', () => {
    const two = toggleType(toggleType(all, 'error'), 'warn')
    expect(selectedTypes(soloType('ok'))).toEqual(['ok'])
    expect(selectedTypes(soloType('ok'))).not.toEqual(selectedTypes(two))
  })

  it('clear restores every type', () => {
    expect(isFiltered(clearTypeFilter())).toBe(false)
  })
})
