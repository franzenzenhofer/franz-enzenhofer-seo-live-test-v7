import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'
import { EVIDENCE_LIMIT } from '@/shared/domEvidence'

const LABEL = 'BODY'
const NAME = 'Internal links count'
const TESTED = 'Counted all <a href> elements and categorized them by same-host vs cross-host destinations.'

const sameHost = (base: string, href: string) => {
  try {
    const b = new URL(base)
    const u = new URL(href, base)
    return b.host === u.host
  } catch {
    return false
  }
}

export const internalLinksRule: Rule = {
  id: 'body:internal-links',
  name: 'Internal links count',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'franz',
    references: [
      'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
    ],
    description: 'Counts anchors with href, split into same-host (internal) vs cross-host (external), always reported as info.',
  },
  async run(page) {
    const anchors = page.doc.querySelectorAll<HTMLAnchorElement>('a[href]')
    const internalLinks: HTMLAnchorElement[] = []
    const externalLinks: HTMLAnchorElement[] = []
    let internalCount = 0
    let externalCount = 0

    for (let index = 0; index < anchors.length; index++) {
      const x = anchors.item(index)
      if (!x) continue
      if (sameHost(page.url, x.getAttribute('href') || '')) {
        internalCount++
        if (internalLinks.length < EVIDENCE_LIMIT) internalLinks.push(x)
      } else {
        externalCount++
        if (externalLinks.length < EVIDENCE_LIMIT) externalLinks.push(x)
      }
    }

    const sourceHtml = extractHtmlFromList([...internalLinks, ...externalLinks])
    const internalPaths = internalLinks.map((el) => getDomPath(el)).filter(Boolean)
    const externalPaths = externalLinks.map((el) => getDomPath(el)).filter(Boolean)
    const domPaths = [...internalPaths, ...externalPaths]
    const domPathColors = [
      ...internalPaths.map(() => '#22c55e'),
      ...externalPaths.map(() => '#2563eb'),
    ]
    return {
      label: LABEL,
      message: `Links: internal ${internalCount}, external ${externalCount}`,
      type: 'info',
      priority: 750,
      name: NAME,
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        tested: TESTED,
        internalCount,
        externalCount,
        shown: internalLinks.length + externalLinks.length,
        truncated: internalCount + externalCount > internalLinks.length + externalLinks.length,
        domPaths,
        domPathColors,
      },
    }
  },
}
