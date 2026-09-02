import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

const LABEL = 'DOM'
const NAME = 'Data-nosnippet usage'
const RULE_ID = 'dom:data-nosnippet'
const SUPPORTED_TAGS = new Set(['SPAN', 'DIV', 'SECTION'])

export const dataNosnippetRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'google',
    references: ['https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag#data-nosnippet-attr'],
    description: 'Finds elements carrying the data-nosnippet attribute: info on supported span/div/section usage, warn on unsupported tags Google ignores.',
  },
  async run(page) {
    const all = Array.from(page.doc.querySelectorAll('[data-nosnippet]'))
    if (all.length === 0) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No data-nosnippet attributes found.',
        type: 'info',
        priority: 910,
      }
    }

    const unsupported = all.filter((el) => !SUPPORTED_TAGS.has(el.tagName))
    const { sample, total, shown, truncated } = sampleElements(unsupported.length ? unsupported : all)
    const sourceHtml = extractHtmlFromList(sample)
    const evidence = {
      sourceHtml,
      snippet: extractSnippet(sourceHtml),
      domPaths: getDomPaths(sample),
      count: total,
      shown,
      truncated,
    }

    if (unsupported.length) {
      return {
        label: LABEL,
        name: NAME,
        message: `data-nosnippet on ${unsupported.length} unsupported element(s) - Google only honors it on span, div, and section.`,
        type: 'warn',
        priority: 300,
        details: {
          ...evidence,
          totalWithAttribute: all.length,
          unsupportedTags: [...new Set(unsupported.map((el) => el.tagName.toLowerCase()))],
        },
      }
    }

    return {
      label: LABEL,
      name: NAME,
      message: `data-nosnippet excludes ${all.length} element(s) from search snippets.`,
      type: 'info',
      priority: 700,
      details: evidence,
    }
  },
}
