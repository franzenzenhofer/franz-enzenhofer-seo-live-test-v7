import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

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
    return {
      label: 'BODY',
      message: `Links: internal ${internalLinks.length}, external ${externalLinks.length}`,
      type: 'info',
      name: 'internalLinks',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
      },
    }
  },
}
