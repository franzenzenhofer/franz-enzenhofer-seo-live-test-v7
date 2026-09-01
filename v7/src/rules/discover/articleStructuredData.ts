import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { findType, parseLd } from '@/shared/structured'

const SPEC = 'https://developers.google.com/search/docs/appearance/structured-data/article'

const findArticle = (doc: Document) => {
  const nodes = parseLd(doc)
  const foundTypes = ['Article', 'NewsArticle'].filter((t) => findType(nodes, t.toLowerCase()).length > 0)
  const found = foundTypes.length > 0
  const script = found ? doc.querySelector('script[type="application/ld+json"]') : null
  return { found, foundTypes, scripts: script ? [script] : [] }
}

export const discoverArticleStructuredDataRule: Rule = {
  id: 'discover:article-structured-data',
  name: 'Article structured data',
  enabled: true,
  what: 'static',
  async run(page) {
    const result = findArticle(page.doc)
    const sourceHtml = extractHtmlFromList(result.scripts)
    const domPaths = getDomPaths(result.scripts)

    return result.found
      ? {
          label: 'DISCOVER',
          message: 'Article/NewsArticle structured data present',
          type: 'ok',
          priority: 800,
          name: 'Article structured data',
          details: { foundTypes: result.foundTypes, sourceHtml, snippet: extractSnippet(sourceHtml), domPaths, reference: SPEC },
        }
      : {
          label: 'DISCOVER',
          message: 'No Article structured data',
          type: 'warn',
          priority: 300,
          name: 'Article structured data',
          details: {
            scriptsFound: result.scripts.length,
            tested: 'Searched for Article/NewsArticle JSON-LD scripts',
            domPaths,
            reference: SPEC,
          },
        }
  },
}
