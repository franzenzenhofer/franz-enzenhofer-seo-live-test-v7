import type { Rule } from '@/core/types'
import { extractHtml, extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPath, getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'
import { sampleDelimitedTokens } from '@/shared/boundedTokens'

// Constants
const LABEL = 'HEAD'
const NAME = 'Meta Googlebot'
const RULE_ID = 'head:meta-googlebot'
const SELECTOR = 'head > meta[name="googlebot"]'

export const googlebotMetaRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'],
    description: 'Reads head > meta[name=googlebot] tags and warns when the combined directives contain noindex/none/nofollow.',
  },
  async run(page) {
    const elements = sampleElements(page.doc.querySelectorAll(SELECTOR))
    if (elements.total === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No Googlebot meta tag found.',
        type: 'info',
        priority: 900,
      }
    }

    // Multiple googlebot meta tags are spec-legal; their rules combine and the
    // most restrictive rule applies, so directives are aggregated across tags.
    const contents = elements.sample.map((el) => (el.getAttribute('content') || '').trim())
    const scans = contents.map((content) => sampleDelimitedTokens(content, ',;', ['noindex', 'none', 'nofollow']))
    const matches = scans.flatMap((scan) => scan.matches)
    const hasNoindex = matches.includes('noindex') || matches.includes('none')
    const hasNofollow = matches.includes('nofollow') || matches.includes('none')
    const type: 'info' | 'warn' = hasNoindex || hasNofollow ? 'warn' : 'info'
    const content = contents.map((c) => c || '(empty)').join('; ')
    const sourceHtml = elements.total > 1 ? extractHtmlFromList(elements.sample) : extractHtml(elements.sample[0]!)
    const message = elements.total > 1
      ? `Meta Googlebot (${elements.total} tags, combined): ${content}`
      : `Meta Googlebot: ${content}`

    return {
      label: LABEL,
      name: NAME,
      message,
      type,
      priority: type === 'warn' ? 150 : 600,
      details: {
        sourceHtml,
        snippet: extractSnippet(content || '(empty)'),
        ...(elements.total > 1
          ? { domPaths: getDomPaths(elements.sample) }
          : { domPath: getDomPath(elements.sample[0]!) }),
        content,
        directives: scans.flatMap((scan) => scan.values),
        directiveCount: scans.reduce((sum, scan) => sum + scan.total, 0),
        directivesTruncated: scans.some((scan) => scan.truncated),
        hasNoindex,
        hasNofollow,
        count: elements.total,
        shown: elements.shown,
        truncated: elements.truncated,
      },
    }
  },
}
