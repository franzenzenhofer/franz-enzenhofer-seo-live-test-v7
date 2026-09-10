const LABELS: Record<string, string> = {
  url: 'URL', href: 'URL', src: 'Resource URL', ua: 'Crawler', userAgent: 'Crawler',
  domPath: 'Find element (CSS selector)', domPaths: 'Find elements (CSS selectors)',
  sourceHtml: 'Source HTML', html: 'HTML element', xRobotsTag: 'X-Robots-Tag header',
  effective: 'Effective crawler instructions', directives: 'Instructions found',
  noindex: 'Blocks search indexing', hasNoindex: 'Blocks search indexing',
  nofollow: 'Asks crawlers not to follow links', hasNofollow: 'Asks crawlers not to follow links',
  noimageindex: 'Blocks image indexing', nosnippet: 'Blocks search snippets',
  maxImagePreview: 'Maximum image preview', maxVideoPreview: 'Maximum video preview (seconds)',
  maxSnippet: 'Maximum search snippet (characters)', source: 'Found in',
  sourceHtmls: 'Source HTML', robotsContent: 'Robots meta tag content',
}
export const detailLabel = (key: string): string => {
  if (LABELS[key]) return LABELS[key]
  const text = key.replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}
export const isDetailRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
export const detailEntries = (value: Record<string, unknown>) => Object.entries(value)
  .filter(([, entry]) => entry !== null && entry !== undefined && entry !== '')

/** Preserve nested evidence as labelled lines, never JS coercion or JSON dumps. */
export const readableDetail = (value: unknown, ancestors: object[] = []): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (typeof value !== 'object') return String(value).trim()
  if (ancestors.includes(value)) return '(circular reference)'
  const parents = [...ancestors, value]
  const indent = (text: string) => text.split('\n').map((line) => `  ${line}`).join('\n')
  if (Array.isArray(value)) return value.map((item, index) => {
    const text = readableDetail(item, parents)
    return typeof item === 'object' && item !== null ? `${index + 1}.\n${indent(text)}` : text
  }).filter(Boolean).join('\n')
  return detailEntries(value as Record<string, unknown>).map(([key, item]) => {
    const text = readableDetail(item, parents)
    return text ? `${detailLabel(key)}:${typeof item === 'object' ? `\n${indent(text)}` : ` ${text}`}` : ''
  }).filter(Boolean).join('\n')
}
