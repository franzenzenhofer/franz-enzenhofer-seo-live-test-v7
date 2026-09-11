import { mixedContentElementIssues, mixedContentResources, resourceSummary } from './mixedContentResources'
import { issueRecord } from './mixedContent.evidence'

import { EVIDENCE_LIMIT, sampleElements } from '@/shared/domEvidence'
import { textField } from '@/shared/presentation/create'
import { markupEvidence } from '@/shared/presentation/originalMarkup'
import { presentResult } from '@/shared/presentation/result'
import type { ResourceIssue } from '@/shared/resourceIssues'
import type { Rule } from '@/core/types'

const NAME = 'Mixed content'
const CHECKED_ELEMENTS = 'script, link, img, iframe, video, audio, source, embed, object, form'
const CHECKED_ATTRIBUTES = 'src, href, data, action'
const DOM_INPUT = 'Static DOM + Page URL + Navigation events'

const countFields = (label: string, total: number, shown: number) =>
  total > shown ? [textField(`${label} retained`, shown), textField(`${label} omitted`, total - shown)] : []

const offenderMarkup = (elementIssues: Array<{ element: Element; issue: ResourceIssue }>, kind: (k: string) => boolean) => {
  const { sample, total } = sampleElements(elementIssues.filter((entry) => kind(entry.issue.kind)).map((entry) => entry.element))
  const captured = markupEvidence(sample, 'Mixed-content element')
  return { captured, total }
}

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
        values: [textField('Page protocol', (/^([a-z][a-z\d+.-]*):/i.exec(page.url)?.[1] || 'Unknown').toUpperCase())],
        checked: [textField('Required protocol', 'HTTPS'), textField('Applicability', 'Mixed content only applies to HTTPS pages')],
        noMarkup: 'Not applicable - page is not HTTPS',
      })
    }
    const { resources, forms } = mixedContentResources(page)
    const elementIssues = mixedContentElementIssues(page)
    const checked = [textField('Inspected elements', CHECKED_ELEMENTS), textField('Inspected attributes', CHECKED_ATTRIBUTES),
      textField('Criterion', 'No explicit http:// URL in a fetching attribute or captured network resource (error) and no http:// form action (warning) on an HTTPS page')]

    if (resources.length) {
      const shown = resources.slice(0, EVIDENCE_LIMIT)
      const shownForms = forms.slice(0, EVIDENCE_LIMIT)
      const { captured, total } = offenderMarkup(elementIssues, (k) => k !== 'Form')
      return presentResult(mixedContentRule, page, {
        input: DOM_INPUT, type: 'error', priority: 80,
        values: [textField('Mixed-content resources', resources.length), textField('Insecure form actions', forms.length)],
        detailValues: [textField('Resource kinds', resourceSummary(resources)), ...countFields('Evidence records', resources.length, shown.length), ...countFields('Form evidence records', forms.length, shownForms.length)],
        checked,
        evidence: [...shown.map((issue, index) => issueRecord(issue, index, 'Mixed-content resource')),
          ...shownForms.map((issue, index) => issueRecord(issue, index, 'Insecure form action'))],
        markup: captured.markup,
        noMarkup: total ? 'Complete original mixed-content markup not retained' : 'No matching mixed-content element found; offenders are network-only',
      })
    }
    if (forms.length) {
      const shown = forms.slice(0, EVIDENCE_LIMIT)
      const { captured, total } = offenderMarkup(elementIssues, (k) => k === 'Form')
      return presentResult(mixedContentRule, page, {
        input: DOM_INPUT, type: 'warn', priority: 200,
        values: [textField('Insecure form actions', forms.length)],
        detailValues: [textField('Resource kinds', resourceSummary(forms)), ...countFields('Evidence records', forms.length, shown.length)],
        checked: [textField('Inspected elements', 'form'), textField('Inspected attribute', 'action'), textField('Criterion', 'No explicit http:// form action on an HTTPS page')],
        evidence: shown.map((issue, index) => issueRecord(issue, index, 'Insecure form action')),
        markup: captured.markup,
        noMarkup: total ? 'Complete original form markup not retained' : 'No matching form element found',
      })
    }
    return presentResult(mixedContentRule, page, {
      input: DOM_INPUT, type: 'ok', priority: 850,
      values: [textField('Mixed-content resources', 0), textField('Insecure form actions', 0)],
      checked,
      noMarkup: 'No matching mixed-content element found',
    })
  },
}
