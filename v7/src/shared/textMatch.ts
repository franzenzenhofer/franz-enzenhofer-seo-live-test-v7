export const normalizeText = (value: string): string => value.replace(/\s+/g, ' ').trim()

/**
 * Text a human reads, with markup stripped - `<h1>Foo</h1>` becomes `Foo`.
 * Snippets are capped upstream, so the tail can be a half-written tag.
 */
export const textOf = (markup: string): string =>
  normalizeText(markup.replace(/<[^>]*>/g, ' ').replace(/<[^>]*$/, ' '))

/**
 * A void element carries its value in an attribute, not in text. The closing
 * quote is optional: capped snippets often end mid-attribute.
 */
export const attributeOf = (markup: string): string => {
  const match = /\s(?:href|content|src)\s*=\s*["']([^"']+)/i.exec(markup)
  return match?.[1] ? normalizeText(match[1]) : ''
}

const QUOTES = /["'„“”‚’‹›«»]/g
const ELLIPSES = /(\.\.\.|…)/g
/** Fold for repetition checks: whitespace, quotes, ellipses and case must not hide a repeat. */
const fold = (value: string): string =>
  normalizeText(value).replace(QUOTES, '').replace(ELLIPSES, ' ').replace(/\s+/g, ' ').trim().toLowerCase()

const MIN_VALUE = 3
const MIN_MESSAGE_IN_VALUE = 12

/** True when the verdict message already contains the whole value (quoted or not). */
export const messageContainsValue = (message: string | null | undefined, value: string): boolean => {
  if (!message) return false
  const msg = fold(message)
  const val = fold(value)
  if (!msg || val.length < MIN_VALUE) return false
  return msg.includes(val) || (msg.length >= MIN_MESSAGE_IN_VALUE && val.includes(msg))
}

// A message that quotes a value truncates it; the shared opening is the tell.
const PROBE = 24

/** Also true when the message quotes a truncated form of the value. */
export const messageRepeatsValue = (message: string | null | undefined, value: string): boolean => {
  if (messageContainsValue(message, value)) return true
  if (!message) return false
  const val = fold(value)
  return val.length > PROBE && fold(message).includes(val.slice(0, PROBE))
}
