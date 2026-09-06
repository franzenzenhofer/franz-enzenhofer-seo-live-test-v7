import { describe, expect, it } from 'vitest'

import parseRobots from '@/vendor/robots'
import { normalizeRobotsPath, robotsPathMatches } from '@/vendor/robotsPath'

// Path matching per Google's robots.txt spec:
// https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec
const allowed = (txt: string, url: string, agent = 'Googlebot') =>
  (parseRobots(txt, url, agent) as Record<string, unknown>)['allowed']

describe('robots.txt path matching', () => {
  it('matches the spec wildcard and end-anchor examples', () => {
    expect(robotsPathMatches('/downloads/report.pdf', '/*.pdf$')).toBe(true)
    expect(robotsPathMatches('/downloads/report.pdf?x=1', '/*.pdf$')).toBe(false)
    expect(robotsPathMatches('/private', '/private$')).toBe(true)
    expect(robotsPathMatches('/private/page', '/private$')).toBe(false)
    expect(robotsPathMatches('/fish.php', '/fish*.php')).toBe(true)
    expect(robotsPathMatches('/fishheads/catfish.php?parameters', '/fish*.php')).toBe(true)
    expect(robotsPathMatches('/Fish.PHP', '/fish*.php')).toBe(false)
  })

  it('compares UTF-8 octets, keeping reserved delimiters encoded', () => {
    // %2F is a reserved delimiter and stays encoded; %7E is unreserved and folds to ~.
    expect(normalizeRobotsPath('/a%2fb')).toBe('/a%2Fb')
    expect(normalizeRobotsPath('/%7Euser')).toBe('/~user')
    expect(normalizeRobotsPath('/ü')).toBe('/%C3%BC')
    expect(robotsPathMatches('/ü/page', '/%C3%BC/')).toBe(true)
  })

  it('rejects a rule that does not start with a slash', () => {
    expect(robotsPathMatches('/a', 'a')).toBe(false)
  })

  it('applies the most specific agent group to Googlebot-Image', () => {
    const txt = 'User-agent: *\nDisallow: /\n\nUser-agent: Googlebot-Image\nAllow: /\nDisallow: /secret/\n'
    expect(allowed(txt, 'https://ex.com/photo.jpg', 'Googlebot-Image')).toBe(true)
    expect(allowed(txt, 'https://ex.com/secret/photo.jpg', 'Googlebot-Image')).toBe(false)
    expect(allowed(txt, 'https://ex.com/photo.jpg', 'Googlebot')).toBe(false)
  })

  it('ignores an unsupported noindex record when deciding crawl permission', () => {
    // Google ignores noindex in robots.txt; it must never act like a Disallow,
    // and it must not silently swallow the Allow/Disallow around it.
    const txt = 'User-agent: *\nNoindex: /private/\nDisallow: /blocked/\n'
    expect(allowed(txt, 'https://ex.com/private/page')).toBe(true)
    expect(allowed(txt, 'https://ex.com/blocked/page')).toBe(false)
  })
})
