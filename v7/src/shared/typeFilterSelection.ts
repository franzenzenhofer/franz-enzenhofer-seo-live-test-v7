import { resultTypeOrder } from './colors'

export type TypeVisibility = Record<string, boolean>

const allOn = (): TypeVisibility =>
  resultTypeOrder.reduce<TypeVisibility>((acc, type) => { acc[type] = true; return acc }, {})

const only = (types: readonly string[]): TypeVisibility => {
  const wanted = new Set(types)
  return resultTypeOrder.reduce<TypeVisibility>((acc, type) => { acc[type] = wanted.has(type); return acc }, {})
}

export const selectedTypes = (show: TypeVisibility): string[] =>
  resultTypeOrder.filter((type) => show[type])

/** No filter is expressed as "everything visible". */
export const isFiltered = (show: TypeVisibility): boolean =>
  selectedTypes(show).length !== resultTypeOrder.length

/**
 * Clicking a count chip means "show me these", not "hide these".
 * From the unfiltered state a click narrows to that one type; further clicks
 * add or remove types; removing the last selected type returns to showing all.
 */
export const toggleType = (show: TypeVisibility, type: string): TypeVisibility => {
  if (!isFiltered(show)) return only([type])
  const active = selectedTypes(show)
  if (!show[type]) return only([...active, type])
  const remaining = active.filter((candidate) => candidate !== type)
  return remaining.length ? only(remaining) : allOn()
}

/** Alt-click stays an accelerator: jump straight to one type from any state. */
export const soloType = (type: string): TypeVisibility => only([type])

export const clearTypeFilter = (): TypeVisibility => allOn()
