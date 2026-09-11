/**
 * Display-only shortening of a DOM path field. The stored, copied and searched
 * value is always the complete path; only the card collapses the middle.
 */
export const PATH_COLLAPSE_MIN_LENGTH = 60
export const PATH_HEAD_LENGTH = 24
export const PATH_TAIL_LENGTH = 32
const SEPARATOR = ' > '

export type CollapsedPath = { head: string; tail: string }

// Cut at a segment boundary so the start names whole elements (`html > body > `);
// fall back to a plain character cut when the first segment alone is too long.
const headOf = (value: string) => {
  const cut = value.lastIndexOf(SEPARATOR, PATH_HEAD_LENGTH - SEPARATOR.length)
  return cut > 0 ? value.slice(0, cut + SEPARATOR.length) : value.slice(0, PATH_HEAD_LENGTH)
}

// Keep the element itself (the last segment) and as many ancestors as fit.
const tailOf = (value: string) => {
  const start = value.length - PATH_TAIL_LENGTH
  const cut = value.indexOf(SEPARATOR, start)
  return cut >= 0 && cut + SEPARATOR.length < value.length ? value.slice(cut) : value.slice(start)
}

export const collapsePath = (value: string): CollapsedPath | null =>
  value.length > PATH_COLLAPSE_MIN_LENGTH ? { head: headOf(value), tail: tailOf(value) } : null
