import { textField, urlField } from '@/shared/presentation/create'
import type { DisplayField } from '@/shared/presentation/schema'

// Presentation helpers shared by the canonical and hreflang family (FORMATTING.md F2, F4, F9, F11, F12).
export const OVERVIEW_MARKUP_LIMIT = 3
type Original = Extract<DisplayField, { kind: 'original' }>

export const isWebUrl = (value: string, base?: string): boolean => {
  if (!value || /\s/.test(value)) return false
  try { return /^https?:$/.test(new URL(value, base).protocol) } catch { return false }
}
/** Absolute form of `href` against `base`, or null when it does not parse. */
export const resolveUrl = (href: string, base: string): string | null => {
  try { return new URL(href, base).href } catch { return null }
}
/** A url field only for a value the card can resolve to an HTTP(S) link; otherwise the observed text. */
export const webUrlField = (key: string, value: string, base?: string): DisplayField =>
  isWebUrl(value, base) ? urlField(key, value) : textField(key, value)
/** The observed href of a link element: the original string as a url field, `Not declared` when empty. */
export const hrefField = (element: Element, base: string): DisplayField => {
  const href = (element.getAttribute('href') || '').trim()
  return href ? webUrlField('href', href, base) : textField('href', 'Not declared')
}
export const hreflangOf = (element: Element): string => (element.getAttribute('hreflang') || '').trim()

/** `Canonical href` (raw, only when it is not already the absolute URL shown) and `Canonical URL`. */
export const canonicalRows = (href: string, resolved: string | null, invalid = 'Invalid URL'): DisplayField[] => [
  ...(href === resolved ? [] : [textField('Canonical href', href || 'Empty')]),
  ...(href ? [resolved && isWebUrl(resolved) ? urlField('Canonical URL', resolved) : textField('Canonical URL', invalid)] : []),
]
/** The noMarkup reason: a capture-boundary limitation (page rebuilt from facts) is stated as such (F5). */
export const markupReason = (records: { markup: Original[]; evidence: unknown[] }, retained: string, none: string): string =>
  records.markup.length ? retained : records.evidence.length ? 'Not retained: elements are rebuilt from captured facts, not captured as original markup' : none
/** Original markup belongs in the overview only while it stays readable at a glance (F4). */
export const overviewMarkup = (markup: Original[]): Original[] => markup.length <= OVERVIEW_MARKUP_LIMIT ? markup : []

