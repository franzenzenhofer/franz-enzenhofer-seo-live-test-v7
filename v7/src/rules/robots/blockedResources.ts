import parse from '@/vendor/robots'
import type { Rule } from '@/core/types'
import { fetchStatusTextOnce } from '@/shared/fetchOnce'
import { extractSnippet } from '@/shared/html-utils'
import { robotsPolicyState } from '@/shared/robotsPolicy'

const LABEL = 'ROBOTS'
const NAME = 'robots.txt Blocked Resources'
const RULE_ID = 'robots:blocked-resources'

// Matching is by ORIGIN: robots.txt is scheme+host+port scoped, so
// https://x.test and http://x.test answer to different files.
const sameOrigin = (a: string, b: string) => {
  try {
    return new URL(a).origin === new URL(b).origin
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
    description: 'Checks every retained same-origin subresource the page loaded against robots.txt for Googlebot and warns when any is disallowed; discloses when the resource ledger was truncated.',
  },
  async run(page, ctx) {
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
    // The ledger is bounded: a verdict may only speak for the URLs it retained.
    const coverage = page.resourceCoverage || null
    const coverageNote = coverage?.truncated
      ? ` Evidence covers ${coverage.retained} retained URLs; ${coverage.dropped} observations were not retained and are unchecked.`
      : ''
    const base = new URL(page.url)
    // Shared single-flight fetch: all robots rules reuse one robots.txt request per run.
    const r = await fetchStatusTextOnce(`${base.origin}/robots.txt`, 1500, ctx.signal)
    const policy = robotsPolicyState(r)
    if (policy === 'unknown') {
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
    const robotsTxt = policy === 'allow' ? '' : r?.text || ''
    const userAgent = 'Googlebot'
    const blockedResources: string[] = []
    let sameOriginCount = 0
    for (const resourceUrl of list) {
      if (!sameOrigin(page.url, resourceUrl)) continue
      sameOriginCount++
      const result = parse(robotsTxt, resourceUrl, userAgent) as Record<string, unknown>
      // The parser already resolves an equal-specificity allow/disallow tie to
      // allowed (least restrictive rule wins), so only its verdict counts here.
      if (!result['allowed']) blockedResources.push(resourceUrl)
    }
    const blockedCount = blockedResources.length
    // Cross-host resources answer to their own hosts' robots.txt files, so
    // the verdict may only speak for the same-host resources it checked.
    const crossOriginCount = resourceCount - sameOriginCount
    const crossOriginNote = crossOriginCount ? ` (${crossOriginCount} cross-origin, governed by their own robots.txt)` : ''
    const hasBlockedResources = blockedCount > 0
    if (!sameOriginCount) {
      return {
        label: LABEL, name: NAME, type: 'info', priority: 850,
        message: `No same-origin resources to check against robots.txt${crossOriginNote}.`,
        details: { snippet: extractSnippet(robotsTxt, 150), robotsTxt, resourceCount, sameOriginCount, crossOriginCount, userAgent, coverage },
      }
    }
    const message = hasBlockedResources
      ? `${blockedCount} of ${sameOriginCount} same-origin resource${sameOriginCount > 1 ? 's' : ''} disallowed by robots.txt for ${userAgent}.${coverageNote}`
      : `All ${sameOriginCount} retained same-origin resources allowed for ${userAgent}${crossOriginNote}.${coverageNote}`
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
        sameOriginCount,
        crossOriginCount,
        blockedCount,
        allowedCount: sameOriginCount - blockedCount,
        ...(blockedResources.length ? { blockedResources } : {}),
        hasBlockedResources,
        userAgent,
        resourceDropped: page.resourceDropped || 0,
        coverage,
      },
    }
  },
}
