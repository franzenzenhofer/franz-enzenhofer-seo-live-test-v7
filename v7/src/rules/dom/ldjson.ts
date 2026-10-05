import type { Rule } from '@/core/types'
import { textField } from '@/shared/presentation/create'
import { listRow } from '@/shared/presentation/listRow'
import { presentResult } from '@/shared/presentation/result'
import { parseLdDetails } from '@/shared/structured'
import { LD_SELECTOR, declaredTypes, ldScriptRecords, parseErrorRow } from '@/shared/structuredRecords'

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
    const parsed = parseLdDetails(page.doc)
    const scripts = ldScriptRecords(page.doc, parsed)
    // A single script is shown by its markup or types, never as a count of 1 (FORMATTING.md F1, F3).
    const countRow = scripts.total > 1 ? [textField('JSON-LD scripts', scripts.total)] : []
    const observed = scripts.total ? [textField('Types', listRow(declaredTypes(parsed)))] : [textField('JSON-LD scripts', 'Not found')]
    return presentResult(ldjsonRule, page, {
      input: 'Idle DOM',
      type: parsed.errorCount ? 'warn' : 'info', priority: parsed.errorCount ? 300 : 750,
      values: [...countRow, ...observed, ...parseErrorRow(parsed), ...scripts.overviewMarkup],
      detailValues: scripts.counts,
      checked: [textField('Selector', LD_SELECTOR), textField('Format', 'JSON-LD JSON syntax'),
        textField('Type extraction', 'Declared @type string values from parsed nodes'),
        textField('Criterion', 'Reports blocks and syntax status; does not validate schema fields')],
      evidence: scripts.evidence,
      markup: scripts.markup,
      noMarkup: scripts.total ? 'Complete original JSON-LD script markup not retained' : 'No JSON-LD blocks found',
    })
  },
}
