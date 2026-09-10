import type { Rule } from '@/core/types'
import { extractHtmlFromList } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { parseLdDetails } from '@/shared/structured'

const FIELDS = [{ key: 'datePublished', property: 'article:published_time', dateType: 'Published' },
  { key: 'dateModified', property: 'article:modified_time', dateType: 'Modified' }]
export const discoverPublishedTimeRule: Rule = {
  id: 'discover:published-time', name: 'Publication dates', enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/appearance/structured-data/article', 'https://ogp.me/'],
    description: 'Lists declared publication and modification dates with their exact sources; absence of optional metadata is informational.',
    userGuide: {
      check: 'Reads publication and modification dates from article meta tags and JSON-LD. Values are reported as declared; date format, factual accuracy and visible dates are not validated here.',
      action: 'Correct the JSON-LD syntax in the listed script blocks, then rerun the check.',
    },
  },
  async run(page) {
    const parsed = parseLdDetails(page.doc)
    const dates = FIELDS.flatMap(({ key, property, dateType }) => {
      const meta = Array.from(page.doc.querySelectorAll(`meta[property="${property}" i]`)).map((element) =>
        ({ dateType, value: (element.getAttribute('content') || '').trim(), foundIn: property, element }))
      const ld = parsed.entries.flatMap(({ node, script, scriptIndex }) => typeof node[key] === 'string'
        ? [{ dateType, value: node[key].trim(), foundIn: `JSON-LD script ${scriptIndex + 1}: ${key}`, element: script }] : [])
      return [...meta, ...ld].filter(({ value }) => value)
    })
    const published = dates.some(({ dateType }) => dateType === 'Published')
    const modified = dates.some(({ dateType }) => dateType === 'Modified')
    const sources = [...new Set(dates.map(({ element }) => element))]
    return {
      label: 'DISCOVER', name: 'Publication dates', type: parsed.errorCount ? 'warn' : 'info', priority: 800,
      message: parsed.errorCount ? 'Date metadata check is incomplete: some JSON-LD could not be parsed.'
        : published ? `Published date declared${modified ? '; modification date also declared' : '; no modification date declared'}.`
          : modified ? 'Modification date declared; no publication date declared.' : 'No publication or modification dates found in the inspected metadata.',
      details: {
        interpretation: 'Dates are optional article metadata, not a Discover requirement. For dated content, use accurate ISO 8601 values consistent with the visible dates. Do not invent a modification date simply to fill a field.',
        ...(dates.length ? { declaredDates: dates.map(({ dateType, value, foundIn }) => ({ dateType, value, foundIn })), sourceHtml: extractHtmlFromList(sources), domPaths: getDomPaths(sources) } : {}),
        ...(parsed.errorCount ? { parseErrors: parsed.errors.map(({ scriptIndex, message }) => ({ scriptNumber: scriptIndex + 1, problem: message })) } : {}),
      },
    }
  },
}
