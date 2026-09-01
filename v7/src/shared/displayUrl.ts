export type UrlDisplay = { domain: string; display: string }

/**
 * A spec citation shows its address, never a generic label. When the URL is
 * long, the middle goes - the domain (trust signal) and the last segment plus
 * fragment (the exact section cited) always survive.
 */
export const displayUrl = (value: string): UrlDisplay => {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return { domain: '', display: value }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { domain: '', display: value }
  const segments = url.pathname.split('/').filter(Boolean)
  const suffix = `${url.search}${url.hash}`
  if (segments.length <= 2) {
    const path = segments.length ? `/${segments.join('/')}` : ''
    return { domain: url.host, display: `${url.host}${path}${suffix}` }
  }
  return { domain: url.host, display: `${url.host}/…/${segments[segments.length - 1]}${suffix}` }
}
