import type { Rule } from '@/core/types'
import { extractHtmlFromList } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { parseLdDetails } from '@/shared/structured'

const authorNames = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(authorNames)
  if (typeof value === 'string') return value.trim() ? [value.trim()] : []
  if (value && typeof value === 'object') return authorNames((value as Record<string, unknown>)['name'])
  return []
}
export const discoverAuthorPresentRule: Rule = {
  id: 'discover:author', name: 'Author metadata', enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/appearance/structured-data/article',
      'https://html.spec.whatwg.org/multipage/semantics.html#meta-author',
    ],
    description: 'Reports author names and their actual meta or JSON-LD sources. Missing optional author metadata is informational.',
    userGuide: {
      check: 'Reads author meta tags and JSON-LD author names. It does not verify a visible byline, resolve author references, or verify a person’s identity. Discover does not require special author markup.',
      action: 'Fix the JSON-LD syntax errors, then run this check again to inspect author metadata.',
    },
  },
  async run(page) {
    const parsed = parseLdDetails(page.doc)
    const meta = Array.from(page.doc.querySelectorAll('meta[name="author" i]')).flatMap((element) =>
      authorNames(element.getAttribute('content')).map((name) => ({ name, foundIn: 'Author meta tag', element })))
    const ld = parsed.entries.flatMap(({ node, script, scriptIndex }) =>
      authorNames(node['author']).map((name) => ({ name, foundIn: `JSON-LD script ${scriptIndex + 1}`, element: script })))
    const authors = [...meta, ...ld]
    const sources = [...new Set(authors.map(({ element }) => element))]
    return {
      label: 'DISCOVER', name: 'Author metadata', type: parsed.errorCount ? 'warn' : 'info', priority: 750,
      message: parsed.errorCount ? 'Author metadata check is incomplete: some JSON-LD could not be parsed.'
        : authors.length ? `Author metadata names ${[...new Set(authors.map(({ name }) => name))].length} author(s).`
          : 'No author name found in the inspected metadata.',
      details: {
        interpretation: 'For authored content, credit the actual author visibly and keep metadata consistent with that byline. Missing metadata alone is not a Discover eligibility failure; generic pages may not need an author.',
        ...(authors.length ? { authors: authors.map(({ name, foundIn }) => ({ name, foundIn })), sourceHtml: extractHtmlFromList(sources), domPaths: getDomPaths(sources) } : {}),
        ...(parsed.errorCount ? { parseErrors: parsed.errors.map(({ scriptIndex, message }) => ({ scriptNumber: scriptIndex + 1, problem: message })) } : {}),
      },
    }
  },
}
