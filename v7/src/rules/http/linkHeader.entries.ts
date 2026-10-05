import { textField, urlField } from '@/shared/presentation/create'
import type { DisplayField, EvidenceRecord } from '@/shared/presentation/schema'

// One parsed Link header entry (RFC 8288 section 3): the target in angle brackets, then
// semicolon-separated parameters. Presented as url fields so no text row embeds a URL (FORMATTING.md F9).
type LinkEntry = { target: string; params: Array<[string, string]> }

const splitParams = (value: string): string[] => {
  const parts: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < value.length; i++) {
    const ch = value.charAt(i)
    if (inQuotes && ch === '\\' && i + 1 < value.length) { current += ch + value.charAt(i + 1); i++; continue }
    if (ch === '"') inQuotes = !inQuotes
    else if (ch === ';' && !inQuotes) { parts.push(current.trim()); current = ''; continue }
    current += ch
  }
  parts.push(current.trim())
  return parts.filter(Boolean)
}
const unquote = (value: string): string => /^".*"$/s.test(value) ? value.slice(1, -1).replace(/\\(.)/g, '$1') : value

export const parseLinkEntry = (value: string): LinkEntry => {
  const match = value.match(/^\s*<([^>]*)>\s*;?(.*)$/s)
  const target = match ? match[1]!.trim() : ''
  const params = splitParams(match ? match[2]! : value).map((part): [string, string] => {
    const eq = part.indexOf('=')
    return eq < 0 ? [part.toLowerCase(), ''] : [part.slice(0, eq).trim().toLowerCase(), unquote(part.slice(eq + 1).trim())]
  })
  return { target, params }
}

export const relOf = (entry: LinkEntry): string => entry.params.find(([name]) => name === 'rel')?.[1] || ''

const resolvable = (value: string, base: string): boolean => {
  try { return /^https?:$/.test(new URL(value, base).protocol) } catch { return false }
}
/** A url field for the entry target when it resolves to http(s) against the page URL, a text fact otherwise. */
const targetField = (key: string, target: string, base: string): DisplayField =>
  !target ? textField(key, 'Not declared') : resolvable(target, base) ? urlField(key, target) : textField(key, target)

/** Overview rows for a short inventory (at most three entries): the target URL keyed by its rel. */
export const entryRows = (entries: LinkEntry[], base: string): DisplayField[] => {
  const keys = entries.map((entry, index) => {
    const rel = relOf(entry)
    return rel && `rel=${rel}`.length <= 16 ? `rel=${rel}` : `Link entry ${index + 1}`
  })
  const totals = new Map<string, number>()
  keys.forEach((key) => totals.set(key, (totals.get(key) || 0) + 1))
  const seen = new Map<string, number>()
  return entries.map((entry, index) => {
    const key = keys[index]!
    if (totals.get(key) === 1) return targetField(key, entry.target, base)
    const n = (seen.get(key) || 0) + 1
    seen.set(key, n)
    return targetField(`${key} ${n}`, entry.target, base)
  })
}

/** One evidence record per entry: URL, then every parameter as its own field. */
export const entryRecords = (entries: LinkEntry[], base: string): EvidenceRecord[] => entries.map((entry, index) => ({
  name: `Link entry ${index + 1}`,
  fields: [targetField('URL', entry.target, base), ...entry.params.map(([name, value]) =>
    /^https?:\/\//i.test(value) && resolvable(value, base) ? urlField(name, value) : textField(name, value || 'Declared'))],
}))
