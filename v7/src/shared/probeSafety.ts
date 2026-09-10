import {
  ACTION_QUERY_KEYS, ACTION_SEGMENTS, BACK_OFFICE_HOSTS, BACK_OFFICE_ROOTS, BACK_OFFICE_SEGMENTS,
  CART_ACTION, CREDENTIAL_QUERY_KEY, DRUPAL_NODE_ACTION,
} from './probeSafety.patterns'

// The invariant this module guards: the extension never itself requests a URL
// that could change state on the server. Page-level: CMS back offices and
// action URLs are not audited at all. Probe-level: additionally, no URL that
// carries a nonce or token is ever requested.

type Parsed = { url: URL; segments: string[]; keys: string[] }

const decodeSegment = (segment: string): string => {
  try { return decodeURIComponent(segment).toLowerCase() } catch { return segment.toLowerCase() }
}

const parse = (raw: string): Parsed | null => {
  try {
    const url = new URL(raw)
    const segments = url.pathname.split('/').filter(Boolean).map(decodeSegment)
    return { url, segments, keys: Array.from(url.searchParams.keys(), (key) => key.toLowerCase()) }
  } catch { return null }
}

const backOffice = ({ url, segments }: Parsed): string | null => {
  const host = BACK_OFFICE_HOSTS.get(url.hostname.toLowerCase())
  if (host) return host
  const root = BACK_OFFICE_ROOTS.get(segments[0] || '')
  if (root) return `${root} (/${segments[0]}/)`
  const hit = segments.find((segment) => BACK_OFFICE_SEGMENTS.has(segment))
  if (hit) return `${BACK_OFFICE_SEGMENTS.get(hit)} (/${hit})`
  if (segments[0] === 'node' && /^\d+$/.test(segments[1] || '') && DRUPAL_NODE_ACTION.test(segments[2] || '')) {
    return `Drupal node ${segments[2]} (/node/${segments[1]}/${segments[2]})`
  }
  return null
}

const action = ({ segments, keys }: Parsed): string | null => {
  const segment = segments.find((candidate) => ACTION_SEGMENTS.has(candidate))
  if (segment) return `action URL (/${segment})`
  if (segments[0] === 'cart' && CART_ACTION.test(segments[1] || '')) return `cart action (/cart/${segments[1]})`
  const key = keys.find((candidate) => ACTION_QUERY_KEYS.has(candidate))
  return key ? `action URL (?${key}=)` : null
}

const credential = ({ keys }: Parsed): string | null => {
  const key = keys.find((candidate) => CREDENTIAL_QUERY_KEY.test(candidate))
  return key ? `token-bearing URL (?${key}=)` : null
}

/** Why a page must not be audited at all (CMS back office or action URL), or null. */
export const unsafePageReason = (url: string): string | null => {
  const parsed = parse(url)
  return parsed ? backOffice(parsed) || action(parsed) : null
}

/** The one user-facing explanation for a page the extension refuses to audit. */
export const pageSkipMessage = (reason: string): string =>
  `Not tested: ${reason}. SEO checks run only on public pages; the extension never audits or re-requests CMS back-office or action URLs.`

/** Why the extension must never request this URL itself, or null. Stricter than the page check. */
export const unsafeProbeReason = (url: string): string | null => {
  const parsed = parse(url)
  return parsed ? backOffice(parsed) || action(parsed) || credential(parsed) : null
}

export class UnsafeProbeError extends Error {
  constructor(readonly url: string, readonly reason: string) {
    super(`Refused to request ${reason}: the extension never requests CMS back-office, action or token URLs.`)
    this.name = 'UnsafeProbeError'
  }
}

/** Throws UnsafeProbeError for any URL the extension must never request. */
export const assertSafeProbe = (url: string): void => {
  const reason = unsafeProbeReason(url)
  if (reason) throw new UnsafeProbeError(url, reason)
}
