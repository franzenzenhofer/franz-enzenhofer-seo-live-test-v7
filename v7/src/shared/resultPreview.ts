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
const clean = (value: string) => value.replace(/\s+/g, ' ').trim()
const cut = (value: string) => (value.length > MAX_PREVIEW ? `${value.slice(0, MAX_PREVIEW - 1)}…` : value)

const usable = (value: unknown): value is string =>
  typeof value === 'string' && clean(value).length > 0 && !clean(value).startsWith('<')

/**
 * Text a human reads, with markup stripped - `<h1>Foo</h1>` becomes `Foo`.
 * Snippets are capped upstream, so the tail can be a half-written tag.
 */
const textOf = (markup: string): string =>
  clean(markup.replace(/<[^>]*>/g, ' ').replace(/<[^>]*$/, ' '))

/**
 * A void element carries its value in an attribute, not in text. The closing
 * quote is optional: capped snippets often end mid-attribute.
 */
const attributeOf = (markup: string): string => {
  const match = /\s(?:href|content|src)\s*=\s*["']([^"']+)/i.exec(markup)
  return match?.[1] ? clean(match[1]) : ''
}

/** Some rules collect a list (robots directives, hreflang pairs). Show it. */
const listOf = (value: unknown): string => {
  if (!Array.isArray(value) || !value.length) return ''
  const parts = value.slice(0, 4).map((item) => {
    if (usable(item)) return clean(item)
    if (!item || typeof item !== 'object') return ''
    const row = item as Record<string, unknown>
    const label = [row['ua'], row['hreflang'], row['name'], row['key']].find(usable)
    const val = [row['value'], row['content'], row['href'], row['url']].find(usable)
    return label && val ? `${clean(label)}: ${clean(val)}` : clean(String(val || label || ''))
  }).filter(Boolean)
  return parts.length ? cut(parts.join(' · ')) : ''
}

/**
 * The value a rule actually judged. "Title set." should show the title;
 * "1 <h1> found." should show the heading.
 */
export const resultPreview = (details: unknown): string => {
  if (!details || typeof details !== 'object') return ''
  const record = details as Record<string, unknown>
  for (const key of VALUE_KEYS) {
    if (usable(record[key])) return cut(clean(record[key] as string))
  }
  for (const [key, value] of Object.entries(record)) {
    if (META_KEYS.has(key)) continue
    if (usable(value)) return cut(clean(value))
    const list = listOf(value)
    if (list) return list
  }
  const markup = [record['snippet'], record['sourceHtml']]
    .find((value): value is string => typeof value === 'string' && value.length > 0)
  if (!markup) return ''
  return cut(textOf(markup) || attributeOf(markup))
}
