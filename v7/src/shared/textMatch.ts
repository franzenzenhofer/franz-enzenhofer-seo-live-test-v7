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
