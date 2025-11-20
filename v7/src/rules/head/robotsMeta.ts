import type { Rule } from '@/core/types'
import { extractHtml, extractSnippet, getDomPath } from '@/shared/html-utils'

const SPEC = 'https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag'
const TESTED = 'Read <meta name="robots"> content and evaluated noindex/nofollow directives.'
const parse = (v: string) => v.toLowerCase().split(',').map((s) => s.trim())

export const robotsMetaRule: Rule = {
  id: 'head-robots-meta',
  name: 'Robots Meta',
  enabled: true,
  what: 'static',
  run: async (page) => {
    const el = page.doc.querySelector('meta[name="robots"]') as HTMLMetaElement|null
    if (!el || !el.content) {
      return {
        label: 'HEAD',
        message: 'No robots meta tag.',
        type: 'info',
        priority: 610,
        name: 'Robots Meta',
      }
    }
    const tokens = parse(el.content)
    const ni = tokens.includes('noindex'); const nf = tokens.includes('nofollow')
    const msg = 'robots: ' + el.content
    const t: 'info'|'warn' = (ni || nf) ? 'warn' : 'info'
    const sourceHtml = extractHtml(el)
    return {
      label: 'HEAD',
      message: msg,
      type: t,
      priority: 610,
      name: 'Robots Meta',
      details: {
        sourceHtml,
        snippet: extractSnippet(sourceHtml),
        domPath: getDomPath(el),
        tested: TESTED,
        reference: SPEC,
        tokens,
      },
    }
  },
}
