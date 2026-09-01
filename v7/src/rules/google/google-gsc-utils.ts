/**
 * Google Search Console specific utilities
 * Auto-derives GSC property from test URL
 */

import { GSC_API_REFERENCE } from './google-utils'

type GscProperty = { property: string; type: 'url-prefix' | 'domain' }

// Session cache for GSC property derivation (per hostname)
const propertyCache = new Map<string, GscProperty>()

// The cache only fills once derivation finishes, so the six GSC rules all start
// together, all miss, and each pays up to two auth'd round trips (url-prefix
// test, then domain fallback). Single-flight collapses them onto one.
const inFlight = new Map<string, Promise<GscProperty | null>>()

/**
 * Auto-derives GSC property from test URL
 * Tries URL prefix first (https://example.com/), then domain (sc-domain:example.com)
 * Returns null only if both fail (user doesn't have access to any property)
 */
export const deriveGscProperty = async (
  url: string,
  token: string
): Promise<GscProperty | null> => {
  const cacheKey = new URL(url).hostname
  const cached = propertyCache.get(cacheKey)
  if (cached) return cached
  const pending = inFlight.get(cacheKey)
  if (pending) return pending
  const task = resolveGscProperty(url, token, cacheKey).finally(() => { inFlight.delete(cacheKey) })
  inFlight.set(cacheKey, task)
  return task
}

const resolveGscProperty = async (
  url: string,
  token: string,
  cacheKey: string
): Promise<GscProperty | null> => {
  const parsedUrl = new URL(url)
  const urlPrefix = `${parsedUrl.origin}/`
  const domainProperty = `sc-domain:${parsedUrl.hostname.replace(/^www\./, '')}`

  // Probed together, not in sequence: a domain-property account always fails the
  // url-prefix test first, so testing serially paid that round trip before
  // starting the one that works. url-prefix still wins when both are available.
  const [urlPrefixWorks, domainWorks] = await Promise.all([
    testGscProperty(urlPrefix, token),
    testGscProperty(domainProperty, token),
  ])

  const resolved: GscProperty | null = urlPrefixWorks
    ? { property: urlPrefix, type: 'url-prefix' }
    : domainWorks
      ? { property: domainProperty, type: 'domain' }
      : null
  if (resolved) propertyCache.set(cacheKey, resolved)
  return resolved
}

/**
 * Tests if user has access to a GSC property
 * Makes lightweight API call to verify access
 */
const testGscProperty = async (property: string, token: string): Promise<boolean> => {
  try {
    // Use searchAnalytics query with minimal parameters to test access
    const body = {
      startDate: '2024-01-01',
      endDate: '2024-01-01',
      rowLimit: 1
    }
    const response = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    )
    return response.ok // 200 = has access, 404/403 = no access
  } catch {
    return false
  }
}

export const createGscPropertyDerivationFailedResult = (url: string) => {
  const parsedUrl = new URL(url)
  const domain = parsedUrl.hostname.replace(/^www\./, '')
  return {
    label: 'GSC',
    message: `No GSC property access for ${parsedUrl.hostname}. Add property in Search Console.`,
    type: 'runtime_error' as const,
    name: 'googleRule',
    priority: -1000,
    details: {
      url,
      hostname: parsedUrl.hostname,
      triedUrlPrefix: `${parsedUrl.origin}/`,
      triedDomain: `sc-domain:${domain}`,
      reference: GSC_API_REFERENCE
    }
  }
}
