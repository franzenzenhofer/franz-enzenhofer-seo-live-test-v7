import { offenderEvidence } from './mixedContent.evidence'
import { kindSummary, mixedContentOffenders } from './mixedContentResources'

import { EVIDENCE_LIMIT } from '@/shared/domEvidence'
import { recordCounts } from '@/shared/presentation/counts'
import { textField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'
import { listRow } from '@/shared/presentation/listRow'

const NAME = 'Mixed content'
const CHECKED_ELEMENTS = 'script, link, img, iframe, video, audio, source, embed, object, form'
const CHECKED_ATTRIBUTES = 'src, href, data, action'
const DOM_INPUT = 'Static DOM + Page URL + Navigation events'
const OVERVIEW_MARKUP_LIMIT = 3
const CHECKED = [textField('Inspected elements', CHECKED_ELEMENTS), textField('Inspected attributes', CHECKED_ATTRIBUTES),
  textField('Criterion', 'No explicit http:// URL in a fetching attribute or captured network resource (error) and no http:// form action (warning) on an HTTPS page')]
const FORM_CHECKED = [textField('Inspected elements', 'form'), textField('Inspected attribute', 'action'), textField('Criterion', 'No explicit http:// form action on an HTTPS page')]

const hostOf = (url: string): string => { try { return new URL(url).host } catch { return url } }

export const mixedContentRule: Rule = {
  id: 'http:mixed-content',
  name: NAME,
  presentation: 1,
  enabled: true,
  what: 'http',
  meta: {
    userGuide: {
      check: "Checks captured resource-loading src, href and data attributes, form actions and captured resource URLs for explicit HTTP references on an HTTPS page. Browser upgrading or blocking does not repair an HTTP URL in the site code.",
      action: "Replace each listed HTTP URL with a working HTTPS resource or remove the dependency. Correct the template, CMS field or third-party configuration responsible for the URL.",
    },
    provenance: 'standard',
    references: ['https://www.w3.org/TR/mixed-content/'],
    description: 'Flags HTTP subresource references on HTTPS pages, even if the browser upgrades or blocks them. Identifies each resource and attribute; includes network-only URLs and insecure form actions.',
  },
  async run(page) {
    if (!/^https:\/\//i.test(page.url)) {
      return presentResult(mixedContentRule, page, {
        input: 'Page URL', type: 'info', priority: 900,
        values: [textField('Page protocol', (/^([a-z][a-z\d+.-]*):/i.exec(page.url)?.[1] || 'Not found').toUpperCase())],
        checked: [textField('Required protocol', 'HTTPS'), textField('Applicability', 'Mixed content only applies to HTTPS pages')],
        noMarkup: 'Not applicable - page is not HTTPS',
      })
    }
    const { resources, forms } = mixedContentOffenders(page)
    const offenders = [...resources, ...forms]
    if (!offenders.length) {
      return presentResult(mixedContentRule, page, {
        input: DOM_INPUT, type: 'ok', priority: 850,
        values: [textField('HTTP references', 'None')],
        checked: CHECKED,
        noMarkup: 'No matching mixed-content element found',
      })
    }
    const shown = offenders.slice(0, EVIDENCE_LIMIT)
    const { evidence, markup } = offenderEvidence(shown)
    // The overview carries the offending markup itself when it fits; otherwise the hosts it points at (F4, F12).
    const overviewMarkup = markup.length <= OVERVIEW_MARKUP_LIMIT ? markup : []
    const hosts = overviewMarkup.length ? [] : [textField('HTTP hosts', listRow([...new Set(offenders.map(({ issue }) => hostOf(issue.url)))]))]
    const networkOnly = shown.every((offender) => !offender.element)
    return presentResult(mixedContentRule, page, {
      input: DOM_INPUT, type: resources.length ? 'error' : 'warn', priority: resources.length ? 80 : 200,
      values: [textField('HTTP references', listRow(kindSummary(offenders))), ...hosts, ...overviewMarkup],
      detailValues: recordCounts({ found: offenders.length, markup: markup.length, evidence: evidence.length }),
      checked: resources.length ? CHECKED : FORM_CHECKED,
      evidence,
      markup,
      noMarkup: networkOnly ? 'Not retained: offenders are network-only requests without a matching HTML element' : 'Not retained: complete original markup not captured',
    })
  },
}
