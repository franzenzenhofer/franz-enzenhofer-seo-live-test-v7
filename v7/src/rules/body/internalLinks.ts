import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPath } from '@/shared/dom-path'

const LABEL = 'BODY'
const NAME = 'Internal links count'
const SPEC = 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide#site-hierarchy'
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
  async run(page) {
    const a = Array.from(page.doc.querySelectorAll('a[href]')) as HTMLAnchorElement[]
    const internalLinks: HTMLAnchorElement[] = []
    const externalLinks: HTMLAnchorElement[] = []

    for (const x of a) {
      if (sameHost(page.url, x.getAttribute('href') || '')) {
        internalLinks.push(x)
      } else {
        externalLinks.push(x)
      }
    }

    const sourceHtml = extractHtmlFromList(a)
    const internalPaths = internalLinks.map((el) => getDomPath(el)).filter(Boolean)
    const externalPaths = externalLinks.map((el) => getDomPath(el)).filter(Boolean)
    const domPaths = [...internalPaths, ...externalPaths]
    const domPathColors = [
      ...internalPaths.map(() => '#22c55e'),
      ...externalPaths.map(() => '#2563eb'),
    ]
    return {
      label: LABEL,
      message: `Links: internal ${internalLinks.length}, external ${externalLinks.length}`,
      type: 'info',
      name: NAME,
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        tested: TESTED,
        reference: SPEC,
        internalCount: internalLinks.length,
        externalCount: externalLinks.length,
        domPaths,
        domPathColors,
      },
    }
  },
}
