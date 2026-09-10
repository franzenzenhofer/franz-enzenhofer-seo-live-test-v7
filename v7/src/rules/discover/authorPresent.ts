import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'
import { parseLdDetails } from '@/shared/structured'

const authorNames = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(authorNames)
  if (typeof value === 'string') return value.trim() ? [value.trim()] : []
  if (value && typeof value === 'object') return authorNames((value as Record<string, unknown>)['name'])
  return []
}
export const discoverAuthorPresentRule: Rule = {
  id: 'discover:author', name: 'Author metadata', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/appearance/structured-data/article',
      'https://html.spec.whatwg.org/multipage/semantics.html#meta-author',
    ],
    description: 'Reports author names and their actual meta or JSON-LD sources. Missing optional author metadata is informational.',
  },
  async run(page) {
    const parsed = parseLdDetails(page.doc)
    const metaElements = Array.from(page.doc.querySelectorAll('meta[name="author" i]'))
    const ldScripts = Array.from(page.doc.querySelectorAll('script[type="application/ld+json"]'))
    const meta = metaElements.flatMap((element) =>
      authorNames(element.getAttribute('content')).map((name) => ({ name, foundIn: 'Author meta tag', element })))
    const ld = parsed.entries.flatMap(({ node, script, scriptIndex }) =>
      authorNames(node['author']).map((name) => ({ name, foundIn: `JSON-LD script ${scriptIndex + 1}`, element: script })))
    const authors = [...meta, ...ld]
    const { sample, total } = sampleElements([...metaElements, ...ldScripts])
    const captured = markupEvidence(sample, 'Author source')
    const names = [...new Set(authors.map(({ name }) => name))]
    return presentResult(discoverAuthorPresentRule, page, {
      input: 'Idle DOM', type: parsed.errorCount ? 'warn' : 'info', priority: 750,
      values: [textField(names.length > 10 ? 'Author names (first 10)' : 'Author names', names.length ? names.slice(0, 10).join(', ') : 'None found'),
        textField('Author declarations', authors.length), textField('JSON-LD parse errors', parsed.errorCount)],
      detailValues: [textField('Author meta elements', metaElements.length), textField('JSON-LD scripts', parsed.scriptCount),
        textField('Distinct author names', names.length), textField('Author declarations omitted', Math.max(0, authors.length - 10)),
        textField('Parse errors omitted', parsed.errorCount - parsed.errors.length), textField('Source elements retained', sample.length), textField('Source elements omitted', total - sample.length)],
      checked: [textField('Author meta selector', 'meta[name="author" i]'),
        textField('JSON-LD selector', 'script[type="application/ld+json"]'),
        textField('Author extraction', 'String author values and object name values from parsed JSON-LD'),
        textField('Criterion', 'Reports declared author names; no name is informational'),
        textField('Visible byline', 'Not checked')],
      evidence: [...authors.slice(0, 10).map(({ name, foundIn }, index) => ({ name: `Author ${index + 1}`, fields: [
        textField('Name', name), textField('Source', foundIn),
      ] })), ...parsed.errors.map(({ scriptIndex, message }, index) => ({
        name: `JSON-LD parse error ${index + 1}`,
        fields: [textField('Script', scriptIndex + 1), textField('Parse error excerpt', message)],
      })), ...(captured.fields.length ? [{ name: 'Source locations', fields: captured.fields }] : [])],
      markup: captured.markup,
      noMarkup: total ? 'Complete original author source markup not retained' : 'No author meta tag or JSON-LD script found',
    })
  },
}
