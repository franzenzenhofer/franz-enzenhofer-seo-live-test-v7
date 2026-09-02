import { isRobotsDirectiveKey } from './robotsVocabulary'

export type XRobotsSegment = { ua: string; value: string }

const UA_PREFIX = /^([a-z0-9_.-]+)\s*:\s*(.+)$/i
const SEGMENT_LIMIT = 1_000

// Splits a raw X-Robots-Tag header into per-agent directive segments per
// https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag:
// - 'name:' prefixes are user agents ONLY when the name is not a directive key,
//   so 'max-snippet: 20' stays a directive instead of becoming agent 'max-snippet'
// - an agent prefix scopes every directive after it until the next agent prefix
// - RFC 822/850 dates inside unavailable_after keep their commas intact
export const splitXRobotsSegments = (raw: string): { segments: XRobotsSegment[]; total: number } => {
  const parts = raw.split(',')
  if (parts.length > SEGMENT_LIMIT) throw new Error('X-Robots-Tag directives exceed the bounded contract')
  const segments: XRobotsSegment[] = []
  let ua = 'robots'
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const match = UA_PREFIX.exec(trimmed)
    const key = match?.[1]?.toLowerCase() || ''
    const isDirective = trimmed.includes(':')
      ? isRobotsDirectiveKey(trimmed.slice(0, trimmed.indexOf(':')))
      : true
    const last = segments[segments.length - 1]
    const lastIsDate = last && /^unavailable_after\s*:/i.test(last.value)
    if (lastIsDate && !isDirective && !match) {
      // continuation of an unavailable_after date split by its own comma
      last.value = `${last.value}, ${trimmed}`
      continue
    }
    if (match && !isRobotsDirectiveKey(key)) {
      ua = key
      segments.push({ ua, value: (match[2] || '').trim() })
      continue
    }
    if (lastIsDate && !isDirective) {
      last.value = `${last.value}, ${trimmed}`
      continue
    }
    segments.push({ ua, value: trimmed })
  }
  return { segments, total: segments.length }
}
