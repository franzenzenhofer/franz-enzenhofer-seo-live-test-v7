import type { Rule } from '@/core/types'
import { extractHtml } from '@/shared/html-utils'
import { sampleElements } from '@/shared/domEvidence'
import { parseLdDetails, schemaTypes } from '@/shared/structured'

export const ldjsonRule: Rule = {
  id: 'dom:ldjson', name: 'JSON-LD structured data blocks', enabled: true, what: 'static',
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
    return {
      label: 'DOM', name: 'JSON-LD structured data blocks', type: parsed.errorCount ? 'warn' : 'info', priority: parsed.errorCount ? 300 : 750,
      message: !scripts.total ? 'No JSON-LD blocks found.' : `${scripts.total} JSON-LD block(s) found${parsed.errorCount ? `; ${parsed.errorCount} contain invalid JSON` : '; syntax parsed successfully'}.`,
      details: { scriptsChecked: scripts.total, types,
        ...(scripts.total ? { blocks: scripts.sample.map((script, index) => ({
          scriptNumber: index + 1,
          declaredTypes: [...new Set(parsed.entries.filter(({ scriptIndex }) => scriptIndex === index).flatMap(({ node }) => schemaTypes(node)))],
          syntax: parsed.errors.some(({ scriptIndex }) => scriptIndex === index) ? 'Invalid JSON' : 'Parsed JSON',
          sourceHtml: extractHtml(script),
        })), examplesShown: scripts.shown, examplesOmitted: scripts.total - scripts.shown } : {}),
        ...(parsed.errorCount ? { parseErrors: parsed.errors.map(({ scriptIndex, message }) => ({ scriptNumber: scriptIndex + 1, problem: message })), parseErrorCount: parsed.errorCount } : {}),
      },
    }
  },
}
