import { attributeOf, normalizeText, textOf } from './textMatch'

export { attributeOf, normalizeText, textOf } from './textMatch'

// Keys that describe the finding rather than the page: never a preview.
const META_KEYS = new Set([
  'reference', 'domPath', 'domPaths', 'domPathColors', 'tested', 'snippet',
  'sourceHtml', 'apiResponse', 'strategy', 'url', 'checked', 'failures',
])

// Preferred order when a rule offers several values.
const VALUE_KEYS = [
  'title', 'description', 'h1', 'heading', 'canonical', 'htmlCanonical',
  'headerCanonical', 'href', 'resolvedUrl', 'content', 'value', 'text', 'lang',
] as const

const MAX_PREVIEW = 160
const cut = (value: string) => (value.length > MAX_PREVIEW ? `${value.slice(0, MAX_PREVIEW - 1)}…` : value)

const usable = (value: unknown): value is string =>
  typeof value === 'string' && normalizeText(value).length > 0 && !normalizeText(value).startsWith('<')

/** One list item as a human line: `ua: value` for records, the text itself for strings. */
export const listItemText = (item: unknown): string => {
  if (usable(item)) return normalizeText(item)
  if (!item || typeof item !== 'object') return ''
  const row = item as Record<string, unknown>
  const label = [row['ua'], row['hreflang'], row['name'], row['key']].find(usable)
  const val = [row['value'], row['content'], row['href'], row['url']].find(usable)
  return label && val ? `${normalizeText(label)}: ${normalizeText(val)}` : normalizeText(String(val || label || ''))
}

/** Some rules hold a record (HTTP headers, a page summary). Show its pairs. */
const recordOf = (value: unknown): string => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ''
  const pairs = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== null && item !== undefined && item !== '')
    .slice(0, 6)
    .map(([key, item]) => `${key}: ${normalizeText(String(item)).slice(0, 40)}`)
  return pairs.length ? cut(pairs.join(' · ')) : ''
}

/** Some rules collect a list (robots directives, hreflang pairs). Show it. */
const listOf = (value: unknown): string => {
  if (!Array.isArray(value) || !value.length) return ''
  const parts = value.slice(0, 4).map(listItemText).filter(Boolean)
  return parts.length ? cut(parts.join(' · ')) : ''
}

/**
 * The full value a rule actually judged, uncut - what a copy action wants.
 * "Title set." should carry the title; "1 <h1> found." the heading.
 */
export const resultValue = (details: unknown): string => {
  if (!details || typeof details !== 'object') return ''
  const record = details as Record<string, unknown>
  for (const key of VALUE_KEYS) {
    if (usable(record[key])) return normalizeText(record[key] as string)
  }
  for (const [key, value] of Object.entries(record)) {
    if (META_KEYS.has(key)) continue
    if (usable(value)) return normalizeText(value)
    const list = listOf(value) || recordOf(value)
    if (list) return list
  }
  const markup = [record['snippet'], record['sourceHtml']]
    .find((value): value is string => typeof value === 'string' && value.length > 0)
  if (!markup) return ''
  return textOf(markup) || attributeOf(markup)
}

/** The judged value as a short one-line preview for the collapsed card. */
export const resultPreview = (details: unknown): string => cut(resultValue(details))
