// Derived list rows for the overview (FORMATTING.md F10, F12): whole items as far as the character
// budget allows, then "… n more". The unicode ellipsis keeps the value free of ". " (a sentence marker).
export const OVERVIEW_VALUE_LIMIT = 60
const tail = (rest: number) => rest > 0 ? ` … ${rest} more` : ''

/** Hard cut of a single long value, marked with an ellipsis. */
export const clip = (value: string, limit = OVERVIEW_VALUE_LIMIT): string => value.length <= limit ? value : `${value.slice(0, limit - 1).trimEnd()}…`

/** `hidden` counts items known to exist but not passed in (e.g. parse errors beyond the retained ten). */
export const listRow = (items: string[], limit = OVERVIEW_VALUE_LIMIT, hidden = 0, separator = ', '): string => {
  const total = items.length + hidden
  if (total === 0) return 'None'
  const shown: string[] = []
  for (const item of items) {
    const candidate = [...shown, item].join(separator) + tail(total - shown.length - 1)
    if (candidate.length > limit) break
    shown.push(item)
  }
  if (!shown.length) {
    // Even the first item overflows: cut it, then still say how many items follow.
    const suffix = total > 1 ? ` ${total - 1} more` : ''
    return `${items[0]!.slice(0, limit - suffix.length - 1).trimEnd()}…${suffix}`
  }
  return shown.join(separator) + tail(total - shown.length)
}
