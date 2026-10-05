import { entriesOfScript, overviewMarkup, parseErrorField, parseErrorRow } from './discoverPresentation'

import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { elementRecords } from '@/shared/presentation/records'
import { presentResult } from '@/shared/presentation/result'
import { findType, parseLdDetails, schemaTypes } from '@/shared/structured'
import type { SchemaNode } from '@/shared/structuredParse'
import { listRow } from '@/shared/presentation/listRow'

const TYPES = ['Article', 'NewsArticle', 'BlogPosting']
const SELECTOR = 'script[type="application/ld+json"]'
const checked = [textField('Selector', SELECTOR), textField('Types checked', TYPES.join(', ')),
  textField('Criterion', 'Presence of a matching type in parsed JSON-LD entities'), textField('Entity fields', 'Not validated')]
const articleTypesIn = (nodes: SchemaNode[]) => TYPES.filter((type) => findType(nodes, type).length)
const isArticleType = (type: string) => TYPES.some((candidate) => candidate.toLowerCase() === type.toLowerCase())

export const discoverArticleStructuredDataRule: Rule = {
  id: 'discover:article-structured-data', name: 'Article structured data', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'google',
    references: [
      'https://developers.google.com/search/docs/appearance/structured-data/article',
      'https://developers.google.com/search/docs/appearance/google-discover',
    ],
    description: 'Reports Article, NewsArticle and BlogPosting types in parsed JSON-LD.',
  },
  async run(page) {
    const parsed = parseLdDetails(page.doc)
    const matches = parsed.entries.filter(({ node }) => articleTypesIn([node]).length)
    const foundTypes = articleTypesIn(matches.map(({ node }) => node))
    const otherTypes = [...new Set(parsed.entries.flatMap(({ node }) => schemaTypes(node)).filter((type) => !isArticleType(type)))]
    const { sample, total } = sampleElements(page.doc.querySelectorAll(SELECTOR))
    // One record per JSON-LD script: the article types it declares, or why it could not be read.
    const records = elementRecords(sample, total, (_element, index) => {
      const types = articleTypesIn(entriesOfScript(parsed, index))
      return [textField('Article types', types.length ? types.join(', ') : 'Not found'), ...parseErrorField(parsed, index)]
    })
    const matchingScripts = [...new Set(matches.map(({ scriptIndex }) => scriptIndex + 1))].join(', ')
    return presentResult(discoverArticleStructuredDataRule, page, {
      input: 'Idle DOM', type: parsed.errorCount ? 'warn' : matches.length ? 'ok' : 'info', priority: parsed.errorCount ? 300 : 800,
      values: [textField('Article types', foundTypes.length ? foundTypes.join(', ') : 'Not found'),
        ...(otherTypes.length ? [textField('Other types', listRow(otherTypes))] : []),
        ...parseErrorRow(parsed), ...overviewMarkup(records.markup)],
      detailValues: [textField('Article entities', matches.length), textField('Matching scripts', matchingScripts || 'None'), ...records.counts],
      checked, evidence: records.evidence, markup: records.markup,
      noMarkup: total ? 'Complete original JSON-LD scripts not retained' : 'No JSON-LD scripts found',
    })
  },
}
