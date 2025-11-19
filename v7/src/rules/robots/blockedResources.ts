import parse from '@/vendor/robots'
import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'ROBOTS'
const NAME = 'robots.txt Blocked Resources'
const RULE_ID = 'robots:blocked-resources'
const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots/intro'

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
          reference: SPEC,
        },
      }
    }
    const base = new URL(page.url)
    const r = (await fetch(`${base.origin}/robots.txt`).catch(() => null)) as Response | null
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
          reference: SPEC,
        },
      }
    }
    const robotsTxt = await r.text()
    const userAgent = 'Googlebot'
    let blockedCount = 0
    for (const resourceUrl of list) {
      if (!sameHost(page.url, resourceUrl)) continue
      const result = parse(robotsTxt, resourceUrl, userAgent) as Record<string, unknown>
      const allowed = Boolean(result['allowed'])
      const disallowed = Boolean(result['disallowed'])
      if (!allowed || disallowed) blockedCount++
    }
    const hasBlockedResources = blockedCount > 0
    const message = hasBlockedResources
      ? `${blockedCount} resource${blockedCount > 1 ? 's' : ''} disallowed by robots.txt for ${userAgent}`
      : `No blocked resources. All ${resourceCount} resources allowed for ${userAgent}.`
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
        blockedCount,
        hasBlockedResources,
        userAgent,
        reference: SPEC,
      },
    }
  },
}
