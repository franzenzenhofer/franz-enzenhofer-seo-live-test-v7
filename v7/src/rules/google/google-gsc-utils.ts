/**
 * Google Search Console specific utilities
 * Auto-derives GSC property from test URL
 */

import { GSC_API_REFERENCE } from './google-utils'

// Session cache for GSC property derivation (per hostname)
const propertyCache = new Map<string, { property: string; type: 'url-prefix' | 'domain' }>()

/**
 * Auto-derives GSC property from test URL
 * Tries URL prefix first (https://example.com/), then domain (sc-domain:example.com)
 * Returns null only if both fail (user doesn't have access to any property)
 */
export const deriveGscProperty = async (
  url: string,
  token: string
): Promise<{ property: string; type: 'url-prefix' | 'domain' } | null> => {
  const parsedUrl = new URL(url)
  const cacheKey = parsedUrl.hostname

  // Check cache first
  if (propertyCache.has(cacheKey)) {
    return propertyCache.get(cacheKey)!
  }

  // Try 1: URL prefix property (most specific, requires exact protocol)
  const urlPrefix = `${parsedUrl.origin}/`
  const urlPrefixWorks = await testGscProperty(urlPrefix, token)
  if (urlPrefixWorks) {
    const result = { property: urlPrefix, type: 'url-prefix' as const }
    propertyCache.set(cacheKey, result)
    return result
  }

  // Try 2: Domain property (fallback, covers all protocols/subdomains)
  const domain = parsedUrl.hostname.replace(/^www\./, '') // Remove www if present
  const domainProperty = `sc-domain:${domain}`
  const domainWorks = await testGscProperty(domainProperty, token)
  if (domainWorks) {
    const result = { property: domainProperty, type: 'domain' as const }
    propertyCache.set(cacheKey, result)
    return result
  }

  return null // Both failed
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
