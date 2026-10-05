import type { Page, Rule } from '@/core/types'
import { attrUrlField, countRow, hostOf, inventory, urlLabel } from '@/rules/body/elementInventory'
import { sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { DisplayField } from '@/shared/presentation/schema'
import { listRow } from '@/shared/presentation/listRow'

type Hint = { selector: string; countKey: string; summaryKey: string; summary: 'host' | 'url'; extra?: (element: Element) => DisplayField[]; noMarkup: string }

/** The shared card of the <link rel="preload|preconnect|dns-prefetch"> inventories: count, observed hrefs, markup (F4, F12). */
export const linkHintResult = (rule: Rule, page: Page, hint: Hint) => {
  const { sample, total } = sampleElements(page.doc.querySelectorAll(hint.selector))
  const records = inventory(sample, total, (element) => [attrUrlField('href', element.getAttribute('href'), page.url), ...(hint.extra?.(element) ?? [])])
  const label = hint.summary === 'host' ? hostOf : urlLabel
  const targets = [...new Set(sample.map((element) => label(element.getAttribute('href') || '', page.url)))]
  return presentResult(rule, page, {
    input: 'Static DOM', type: 'info', priority: total ? 750 : 900,
    values: [...countRow(hint.countKey, total, records.overviewMarkup),
      ...(total && !records.overviewMarkup.length ? [textField(hint.summaryKey, listRow(targets))] : []), ...records.overviewMarkup],
    detailValues: total ? records.counts : [],
    checked: [textField('Selector', hint.selector), textField('Selection', 'All matches'), textField('Attribute', 'href'), textField('Criterion', 'Descriptive count; no threshold')],
    evidence: records.evidence, markup: records.markup, noMarkup: total ? 'Complete original link markup not retained' : hint.noMarkup,
  })
}
