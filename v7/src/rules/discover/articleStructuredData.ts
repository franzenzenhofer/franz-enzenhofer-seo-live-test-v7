import type { Rule } from '@/core/types'
import { extractHtmlFromList } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { findType, parseLdDetails } from '@/shared/structured'

const TYPES = ['Article', 'NewsArticle', 'BlogPosting']
export const discoverArticleStructuredDataRule: Rule = {
  id: 'discover:article-structured-data', name: 'Article structured data', enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/appearance/structured-data/article',
      'https://developers.google.com/search/docs/appearance/google-discover',
    ],
    description: 'Reports Article, NewsArticle and BlogPosting JSON-LD with its matching source. Absence is informational because Discover does not require this markup.',
    userGuide: {
      check: 'Looks for article types in parsed JSON-LD. This is a presence check, not validation of the fields, visible content, Microdata or RDFa.',
      action: 'Fix the reported JSON syntax errors in the indicated script blocks, then run the check again.',
    },
  },
  async run(page) {
    const parsed = parseLdDetails(page.doc)
    const matches = parsed.entries.filter(({ node }) => TYPES.some((type) => findType([node], type).length))
    const foundTypes = TYPES.filter((type) => matches.some(({ node }) => findType([node], type).length))
    const scripts = [...new Set(matches.map(({ script }) => script))]
    return {
      label: 'DISCOVER', name: 'Article structured data',
      message: parsed.errorCount ? `Article markup check is incomplete: ${parsed.errorCount} JSON-LD block(s) could not be parsed.`
        : matches.length ? `${foundTypes.join(', ')} markup found; fields have not been validated.`
          : 'No Article JSON-LD found. Discover does not require it.',
      type: parsed.errorCount ? 'warn' : matches.length ? 'ok' : 'info', priority: parsed.errorCount ? 300 : 800,
      details: {
        interpretation: 'Article markup can help describe an article, but it is optional for Discover. Add it only when this page is an article; do not mark a product or listing page as an article just to pass this check.',
        scriptsChecked: parsed.scriptCount, matchingArticleCount: matches.length,
        ...(matches.length ? { foundTypes, sourceHtml: extractHtmlFromList(scripts), domPaths: getDomPaths(scripts) } : {}),
        ...(parsed.errorCount ? { parseErrors: parsed.errors.map(({ scriptIndex, message }) => ({ scriptNumber: scriptIndex + 1, problem: message })) } : {}),
      },
    }
  },
}
