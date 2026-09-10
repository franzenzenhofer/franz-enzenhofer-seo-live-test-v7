import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'
import { parseLdDetails } from '@/shared/structured'

const FIELDS = [{ key: 'datePublished', property: 'article:published_time', dateType: 'Published' },
  { key: 'dateModified', property: 'article:modified_time', dateType: 'Modified' }]
const DECLARATION_LIMIT = 10
export const discoverPublishedTimeRule: Rule = {
  id: 'discover:published-time', name: 'Publication dates', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/appearance/structured-data/article', 'https://ogp.me/'],
    description: 'Lists declared publication and modification dates with their exact sources; absence of optional metadata is informational.',
  },
  async run(page) {
    const parsed = parseLdDetails(page.doc)
    const metaNodes = Array.from(page.doc.querySelectorAll('meta[property="article:published_time" i], meta[property="article:modified_time" i]'))
    const scripts = Array.from(page.doc.querySelectorAll('script[type="application/ld+json"]'))
    const dates = FIELDS.flatMap(({ key, property, dateType }) => {
      const meta = Array.from(page.doc.querySelectorAll(`meta[property="${property}" i]`)).map((element) =>
        ({ dateType, value: (element.getAttribute('content') || '').trim(), foundIn: property, element }))
      const ld = parsed.entries.flatMap(({ node, script, scriptIndex }) => typeof node[key] === 'string'
        ? [{ dateType, value: node[key].trim(), foundIn: `JSON-LD script ${scriptIndex + 1}: ${key}`, element: script }] : [])
      return [...meta, ...ld].filter(({ value }) => value)
    })
    const published = dates.filter(({ dateType }) => dateType === 'Published')
    const modified = dates.filter(({ dateType }) => dateType === 'Modified')
    const sources = [...metaNodes, ...scripts]
    const sourceSample = sampleElements(sources)
    const captured = markupEvidence(sourceSample.sample, 'Retrieved metadata')
    const shownDates = dates.slice(0, DECLARATION_LIMIT)
    const declaredFields = shownDates.length ? shownDates.map(({ dateType, value, foundIn }, index) => [
      textField(`Declaration ${index + 1} type`, dateType), textField(`Declaration ${index + 1} value`, value),
      textField(`Declaration ${index + 1} source`, foundIn),
    ]).flat() : [textField('Declarations', 'None found')]
    const values = [
      textField('Published date declarations', published.length),
      textField('Modified date declarations', modified.length),
      ...(published[0] ? [textField('First published date', published[0].value)] : []),
      ...(modified[0] ? [textField('First modified date', modified[0].value)] : []),
      ...(parsed.errorCount ? [textField('JSON-LD parse errors', parsed.errorCount)] : []),
    ]
    return presentResult(discoverPublishedTimeRule, page, {
      input: 'Idle DOM', type: parsed.errorCount ? 'warn' : 'info', priority: 800, values,
      detailValues: [
        textField('Meta elements checked', metaNodes.length), textField('JSON-LD scripts checked', scripts.length),
        textField('Declarations shown', shownDates.length),
        textField('Declarations omitted', dates.length - shownDates.length),
      ],
      checked: [
        textField('Selectors', 'meta[property="article:published_time" i], meta[property="article:modified_time" i], script[type="application/ld+json"]'),
        textField('Meta attributes', 'property and content'), textField('JSON-LD properties', 'datePublished and dateModified'),
        textField('Matching', 'Non-empty string values, trimmed'),
        textField('Date format and visible date accuracy', 'Not validated'),
      ],
      evidence: [
        { name: 'Declared dates', fields: declaredFields },
        { name: 'Retrieved source elements', fields: [
          textField('Source elements retained', sourceSample.shown), textField('Source elements omitted', sourceSample.total - sourceSample.shown),
          ...captured.fields,
        ] },
        ...(parsed.errorCount ? [{ name: 'Parse errors', fields: [
          ...parsed.errors.map(({ scriptIndex, message }) => textField('Parse error excerpt', `Script ${scriptIndex + 1}: ${message}`)),
          textField('Parse error excerpts omitted', parsed.errorCount - parsed.errors.length),
        ] }] : []),
      ],
      markup: captured.markup,
      noMarkup: sources.length ? 'Complete original checked metadata not retained' : 'No date meta tags or JSON-LD scripts found',
    })
  },
}
