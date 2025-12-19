export type RobotsDirective = {
  ua: string
  source: 'meta' | 'header'
  value: string
  tokens: string[]
  hasNoindex: boolean
  hasNofollow: boolean
  domPath?: string
  sourceHtml?: string
  headerKey?: string
}

const normalizeWhitespace = (val: string) => val.replace(/\s+/g, ' ').trim()

const splitTokens = (val: string) =>
  normalizeWhitespace(val)
    .toLowerCase()
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean)

const parseMeta = (doc: Document): RobotsDirective[] => {
  const nodes = Array.from(doc.querySelectorAll('head > meta[name]')) as HTMLMetaElement[]
  const directives: RobotsDirective[] = []
  nodes.forEach((el, idx) => {
    const name = (el.getAttribute('name') || '').trim().toLowerCase()
    const content = (el.getAttribute('content') || '').trim()
    if (!content) return
    const tokens = splitTokens(content)
    directives.push({
      ua: name,
      source: 'meta',
      value: content,
      tokens,
      hasNoindex: tokens.includes('noindex') || tokens.includes('none'),
      hasNofollow: tokens.includes('nofollow') || tokens.includes('none'),
      domPath: `head > meta[name="${name}"]:nth-of-type(${idx + 1})`,
      sourceHtml: el.outerHTML,
    })
  })
  return directives
}

const parseHeader = (headers?: Record<string, string>): RobotsDirective[] => {
  if (!headers) return []
  const raw = headers['x-robots-tag'] || headers['X-Robots-Tag']
  if (!raw) return []
  // X-Robots-Tag can appear multiple times; split on commas unless namespaced
  // Allowed formats: "noindex, nofollow", "googlebot: noindex", "bingbot: noindex, nofollow"
  const parts = raw.split(/,(?![^"]*")/).map((p) => p.trim()).filter(Boolean)
  const directives: RobotsDirective[] = []
  parts.forEach((part, idx) => {
    const m = /^([a-z0-9_-]+)\s*:\s*(.+)$/i.exec(part)
    const ua = (m?.[1] || 'robots').toLowerCase()
    const value = (m?.[2] || part).trim()
    const tokens = splitTokens(value)
    directives.push({
      ua,
      source: 'header',
      value,
      tokens,
      hasNoindex: tokens.includes('noindex') || tokens.includes('none'),
      hasNofollow: tokens.includes('nofollow') || tokens.includes('none'),
      headerKey: `x-robots-tag[${idx}]`,
    })
  })
  return directives
}

export const parseRobotsDirectives = (doc: Document, headers?: Record<string, string>): RobotsDirective[] => [
  ...parseMeta(doc),
  ...parseHeader(headers),
]

export const groupByUa = (directives: RobotsDirective[]): Record<string, RobotsDirective[]> => {
  return directives.reduce((acc, dir) => {
    const key = dir.ua || 'robots'
    acc[key] = acc[key] || []
    acc[key].push(dir)
    return acc
  }, {} as Record<string, RobotsDirective[]>)
}
