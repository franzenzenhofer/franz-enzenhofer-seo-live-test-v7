import { textField, urlField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import type { DisplayField } from '@/shared/presentation/schema'
import { clip } from '@/shared/presentation/listRow'

// Card shapes shared by the body, a11y, Open Graph and speed inventories (FORMATTING.md F3, F4, F9, F10, F12).
export const INVENTORY_LIMIT = 100
const OVERVIEW_MARKUP_LIMIT = 3
const EXCERPT_LIMIT = 100

type Extra = Parameters<typeof elementRecords>[2]

/** Records for inspected elements plus the original fields the overview may show (at most three, F4). */
export const inventory = (elements: Element[], found: number, extra?: Extra) => {
  const records = elementRecords(elements, found, extra)
  const overviewMarkup = records.markup.length <= OVERVIEW_MARKUP_LIMIT ? records.markup : []
  return { ...records, overviewMarkup }
}

/** A count row, except a lone "1" beside the single markup field it would restate (F3). */
export const countRow = (key: string, count: number, markup: DisplayField[]): DisplayField[] =>
  count === 1 && markup.length === 1 ? [] : [textField(key, count)]

export const excerpt = (text: string, limit = EXCERPT_LIMIT) => {
  const collapsed = text.replace(/\s+/g, ' ').trim()
  return collapsed.length > limit ? `${collapsed.slice(0, limit)}…` : collapsed
}

const parse = (raw: string, base: string) => { try { return new URL(raw, base) } catch { return null } }
const isHttp = (url: URL | null): url is URL => !!url && /^https?:$/.test(url.protocol)

/** A URL attribute as a url field when it resolves to http(s), as plain text otherwise, `Not declared` when missing. */
export const attrUrlField = (key: string, raw: string | null | undefined, base: string): DisplayField => {
  const trimmed = (raw || '').trim()
  if (!trimmed) return textField(key, 'Not declared')
  return isHttp(parse(trimmed, base)) ? urlField(key, trimmed) : textField(key, trimmed)
}

/** Scheme-free display form for summaries: the path on the page host, host plus path elsewhere (F9). */
export const urlLabel = (raw: string, base: string): string => {
  const url = parse(raw.trim(), base)
  if (!isHttp(url)) return raw.trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, '') || 'Empty'
  const page = parse(base, base)
  const path = `${url.pathname}${url.search}`
  return page && page.host === url.host ? path : `${url.host}${path === '/' ? '' : path}`
}

export const hostOf = (raw: string, base: string): string => {
  const url = parse(raw.trim(), base)
  return isHttp(url) ? url.host : raw.trim() || 'Empty'
}

/** A probe error as a fact of at most 60 characters: the URL (its own field), the hop note and the chain prefix are stripped (F9, F10). */
export const probeError = (message: string): string => {
  const cause = message.replace(/^Redirect chain fetch failed at \S+?:\s+/i, '').replace(/^Redirect chain timed out after (\S+) at \S+/i, 'Timed out after $1')
    .replace(/\s+at\s+https?:\/\/\S+/i, '').replace(/\s*\([^)]*\)\s*$/, '').trim()
  return clip(cause) || 'Request failed'
}
