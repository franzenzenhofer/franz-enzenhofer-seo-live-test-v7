import { getDomPath } from './dom-path'
import { extractHtml } from './html-utils'
import { sampleDelimitedTokens } from './boundedTokens'
import { splitXRobotsSegments } from './robotsHeader'
import { isRobotsMetaDirective } from './robotsVocabulary'
import type { RobotsDirective } from './robots.types'

export type { RobotsDirective } from './robots.types'

const scanTokens = (value: string) => sampleDelimitedTokens(value, ',;', ['noindex', 'none', 'nofollow'])

const parseMeta = (doc: Document): RobotsDirective[] => {
  const directives: RobotsDirective[] = []
  const nodes = doc.querySelectorAll<HTMLMetaElement>('head > meta[name]')
  for (let index = 0; index < nodes.length; index++) {
    const el = nodes.item(index)
    if (!el) continue
    const name = (el.getAttribute('name') || '').trim().toLowerCase()
    const content = (el.getAttribute('content') || '').trim()
    if (!content) continue
    // Standard HTML metas (viewport, referrer, generator...) are not robots
    // directives; only crawler UAs or robots-vocabulary contents qualify.
    if (!isRobotsMetaDirective(name, content)) continue
    if (directives.length >= 1_000) throw new Error('Robots meta directives exceed the bounded contract')
    const scan = scanTokens(content)
    directives.push({
      ua: name,
      source: 'meta',
      value: content,
      tokens: scan.values,
      hasNoindex: scan.matches.includes('noindex') || scan.matches.includes('none'),
      hasNofollow: scan.matches.includes('nofollow') || scan.matches.includes('none'),
      tokenCount: scan.total,
      tokensTruncated: scan.truncated,
      domPath: getDomPath(el),
      sourceHtml: extractHtml(el),
    })
  }
  return directives
}

const parseHeader = (headers?: Record<string, string>): RobotsDirective[] => {
  if (!headers) return []
  const raw = headers['x-robots-tag'] || headers['X-Robots-Tag']
  if (!raw) return []
  // Formats: "noindex, nofollow", "googlebot: noindex, nofollow" (agent scoped),
  // "max-snippet: 20" (valued directive, NOT an agent), RFC dates kept intact.
  const { segments } = splitXRobotsSegments(raw)
  const directives: RobotsDirective[] = []
  segments.forEach(({ ua, value }, idx) => {
    const scan = scanTokens(value)
    directives.push({
      ua,
      source: 'header',
      value,
      tokens: scan.values,
      hasNoindex: scan.matches.includes('noindex') || scan.matches.includes('none'),
      hasNofollow: scan.matches.includes('nofollow') || scan.matches.includes('none'),
      tokenCount: scan.total,
      tokensTruncated: scan.truncated,
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
