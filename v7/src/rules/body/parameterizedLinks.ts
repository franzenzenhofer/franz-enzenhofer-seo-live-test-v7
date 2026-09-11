import type { Rule } from '@/core/types'
import { domPathField, textField, urlField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'

const URL_LIMIT = 500, MARKUP_LIMIT = 10
const resolvedQuery = (href: string, base: string) => {
  try {
    let url: URL
    try { url = new URL(href, base) } catch { url = new URL(href) }
    return /^https?:$/.test(url.protocol) && url.search ? url : null
  } catch { return null }
}
export const parameterizedLinksRule: Rule = {
  id: 'body:parameterized-links', name: 'Links with URL parameters', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation', 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls'],
    description: 'Counts links resolving to HTTP(S) URLs with a non-empty query string and retains attributed evidence.',
  },
  async run(page) {
    const anchors = page.doc.querySelectorAll('a[href]')
    let base = page.baseUri || page.staticFacts?.baseUri || page.url
    try { base = new URL(page.doc.querySelector('base[href]')?.getAttribute('href') || base, page.url).href } catch { /* absolute links can still resolve */ }
    let count = 0
    const retained: Array<{ element: Element; url: URL }> = []
    anchors.forEach((element) => {
      const url = resolvedQuery(element.getAttribute('href') || '', base)
      if (!url) return
      count++
      if (retained.length < URL_LIMIT) retained.push({ element, url })
    })
    const captured = markupEvidence(retained.slice(0, MARKUP_LIMIT).map(({ element }) => element), 'Link markup')
    return presentResult(parameterizedLinksRule, page, {
      input: 'Static DOM + page URL', type: 'info', priority: count ? 700 : 900,
      values: [textField('Links with parameters', count), textField('Links checked', anchors.length)],
      checked: [textField('Selector', 'a[href]'), textField('Match', 'Resolved HTTP(S) URL has a non-empty query string'), textField('Base URL', base)],
      detailValues: [textField('Link records retained', retained.length), textField('Link records omitted', count - retained.length),
        textField('Markup records retained', captured.markup.length), textField('Markup records omitted', count - captured.markup.length)],
      evidence: retained.map(({ element, url }, index) => ({ name: `Link ${index + 1}`, fields: [
        textField('Link text', element.textContent || ''), urlField('Resolved URL', url.href), textField('Query string', url.search),
        textField('Attribute', 'href'), domPathField('DOM path', captured.selectors[index], 'Not retained'),
      ] })),
      markup: captured.markup, noMarkup: count ? 'Complete original link markup not retained' : 'No matching links found',
    })
  },
}
