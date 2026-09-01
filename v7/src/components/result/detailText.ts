import { listItemText } from '@/shared/resultPreview'

/** `datePublished` -> "Date published": readable, and never shouting caps. */
export const formatLabel = (key: string): string => {
  const spaced = key.replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

type Hop = { url: string; status: unknown }
const isHop = (item: unknown): item is Hop => Boolean(item) && typeof item === 'object'
  && typeof (item as Record<string, unknown>)['url'] === 'string'
  && (item as Record<string, unknown>)['status'] !== undefined
/** A chain of per-URL results (redirect hops) reads as one line per hop, in full. */
const hopLines = (value: unknown[]): string =>
  value.length && value.every(isHop) ? value.map((hop) => `${hop.url}  ${String(hop.status)}`).join('\n') : ''

const itemText = (item: unknown): string => {
  const line = listItemText(item)
  if (line) return line
  try {
    return JSON.stringify(item)
  } catch {
    return String(item)
  }
}

const recordLines = (value: Record<string, unknown>): string =>
  Object.entries(value)
    .filter(([, item]) => item !== null && item !== undefined && item !== '')
    .map(([key, item]) => `${key}: ${typeof item === 'object' ? JSON.stringify(item) : String(item)}`)
    .join('\n')

/**
 * One display text per detail value, whatever its shape. Arrays become one
 * line per item, records become `key: value` lines - never raw JSON walls.
 */
export const detailText = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value)) return hopLines(value) || value.map(itemText).filter(Boolean).join('\n')
  if (typeof value === 'object') return recordLines(value as Record<string, unknown>)
  return String(value)
}
