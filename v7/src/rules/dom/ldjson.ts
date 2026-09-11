import type { Rule } from '@/core/types'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'
import { parseLdDetails, schemaTypes } from '@/shared/structured'

export const ldjsonRule: Rule = {
  id: 'dom:ldjson', name: 'JSON-LD structured data blocks', presentation: 1, enabled: true, what: 'static',
  meta: {
    provenance: 'standard', references: ['https://www.w3.org/TR/json-ld/', 'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data'],
    description: 'Lists each sampled JSON-LD script by number and declared types, identifying JSON syntax errors without claiming full schema validity.',
    userGuide: {
      check: 'JSON-LD describes page content for machines. This checks JSON syntax and lists declared types; it does not validate required fields, factual accuracy or rich-result eligibility. Markup is only useful when it fits the page content.',
      action: 'Fix the JSON syntax in the script number identified below, usually in the template or structured-data plugin. Then validate the intended schema type and its fields with the appropriate structured-data test.',
    },
  },
  async run(page) {
    const scripts = sampleElements(page.doc.querySelectorAll('script[type="application/ld+json"]'))
    const parsed = parseLdDetails(page.doc)
    const types = [...new Set(parsed.entries.flatMap(({ node }) => schemaTypes(node)))]
    const captured = markupEvidence(scripts.sample, 'JSON-LD script markup')
    const captureFields = captured.fields.filter((field) => !field.key.startsWith('Selector'))
    const errorsOutsideSample = parsed.errors.filter(({ scriptIndex }) => scriptIndex >= scripts.shown)
    const evidence = scripts.sample.map((_script, index) => {
      const declaredTypes = [...new Set(parsed.entries.filter(({ scriptIndex }) => scriptIndex === index).flatMap(({ node }) => schemaTypes(node)))]
      const error = parsed.errors.find(({ scriptIndex }) => scriptIndex === index)
      return {
        name: `JSON-LD script ${index + 1}`,
        fields: [textField('Script number', index + 1), textField('Declared types', declaredTypes.join(', ') || 'None declared'),
          textField('Syntax', error ? 'Invalid JSON' : 'Parsed JSON'), ...(error ? [textField('Problem', error.message)] : []),
          textField('Selector', captured.selectors[index] || 'Not captured')],
      }
    })
    const parseEvidence = errorsOutsideSample.map(({ scriptIndex, message }) => ({
      name: `JSON-LD parse error ${scriptIndex + 1}`,
      fields: [textField('Script number', scriptIndex + 1), textField('Problem', message)],
    }))
    return presentResult(ldjsonRule, page, {
      input: 'Idle DOM',
      type: parsed.errorCount ? 'warn' : 'info', priority: parsed.errorCount ? 300 : 750,
      values: [textField('JSON-LD blocks', scripts.total), textField('Declared types', types.join(', ') || 'None declared'),
        textField('Syntax errors', parsed.errorCount)],
      detailValues: [textField('Blocks retained', scripts.shown), textField('Blocks omitted', scripts.total - scripts.shown)],
      checked: [textField('Selector', 'script[type="application/ld+json"]'), textField('Format', 'JSON-LD JSON syntax'),
        textField('Type extraction', 'Declared @type string values from parsed nodes'),
        textField('Criterion', 'Reports blocks and syntax status; does not validate schema fields')],
      evidence: [...evidence, ...parseEvidence, ...(captureFields.length ? [{ name: 'Capture status', fields: captureFields }] : [])],
      markup: captured.markup,
      noMarkup: scripts.total ? 'Complete original JSON-LD script markup not retained' : 'No JSON-LD blocks found',
    })
  },
}
