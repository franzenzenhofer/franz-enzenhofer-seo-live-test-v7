import parse from '@/vendor/robots'
import type { Rule } from '@/core/types'
import { fetchStatusTextOnce } from '@/shared/fetchOnce'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'ROBOTS'
const NAME = 'robots.txt Blocked Resources'
const RULE_ID = 'robots:blocked-resources'

const sameHost = (a: string, b: string) => {
  try {
    return new URL(a).host === new URL(b).host
  } catch {
    return false
  }
}

export const robotsBlockedResourcesRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt',
      'https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.1',
      'https://developers.google.com/search/docs/crawling-indexing/robots/intro',
    ],
    description: 'Checks every same-host subresource the page loaded against robots.txt for Googlebot and warns when any is disallowed.',
  },
  async run(page) {
    const list = page.resources || []
    const resourceCount = list.length
    if (!resourceCount) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No resource requests captured for analysis.',
        type: 'info',
        priority: 900,
        details: {
          snippet: extractSnippet('(no resources)'),
          resourceCount: 0,
        },
      }
    }
    const base = new URL(page.url)
    // Shared single-flight fetch: all robots rules reuse one robots.txt request per run.
    const r = await fetchStatusTextOnce(`${base.origin}/robots.txt`)
    if (!r || !r.ok) {
      return {
        label: LABEL,
        name: NAME,
        message: 'robots.txt not reachable. Cannot check for blocked resources.',
        type: 'info',
        priority: 850,
        details: {
          snippet: extractSnippet('(robots.txt not reachable)'),
          resourceCount,
        },
      }
    }
    const robotsTxt = r.text
    const userAgent = 'Googlebot'
    const blockedResources: string[] = []
    let sameHostCount = 0
    for (const resourceUrl of list) {
      if (!sameHost(page.url, resourceUrl)) continue
      sameHostCount++
      const result = parse(robotsTxt, resourceUrl, userAgent) as Record<string, unknown>
      // The parser already resolves an equal-specificity allow/disallow tie to
      // allowed (least restrictive rule wins), so only its verdict counts here.
      if (!result['allowed']) blockedResources.push(resourceUrl)
    }
    const blockedCount = blockedResources.length
    // Cross-host resources answer to their own hosts' robots.txt files, so
    // the verdict may only speak for the same-host resources it checked.
    const crossHostCount = resourceCount - sameHostCount
    const crossHostNote = crossHostCount ? ` (${crossHostCount} cross-host not governed by this robots.txt)` : ''
    const hasBlockedResources = blockedCount > 0
    if (!sameHostCount) {
      return {
        label: LABEL, name: NAME, type: 'info', priority: 850,
        message: `No same-host resources to check against robots.txt${crossHostNote}.`,
        details: { snippet: extractSnippet(robotsTxt, 150), robotsTxt, resourceCount, sameHostCount, crossHostCount, userAgent },
      }
    }
    const message = hasBlockedResources
      ? `${blockedCount} of ${sameHostCount} same-host resource${sameHostCount > 1 ? 's' : ''} disallowed by robots.txt for ${userAgent}`
      : `No blocked resources. All ${sameHostCount} same-host resources allowed for ${userAgent}${crossHostNote}.`
    return {
      label: LABEL,
      name: NAME,
      message,
      type: hasBlockedResources ? 'warn' : 'ok',
      priority: hasBlockedResources ? 200 : 800,
      details: {
        snippet: extractSnippet(robotsTxt, 150),
        robotsTxt,
        resourceCount,
        sameHostCount,
        crossHostCount,
        blockedCount,
        allowedCount: sameHostCount - blockedCount,
        ...(blockedResources.length ? { blockedResources } : {}),
        hasBlockedResources,
        userAgent,
      },
    }
  },
}
