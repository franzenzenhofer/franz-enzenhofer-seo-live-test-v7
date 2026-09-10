import { mixedContentResources, resourceSummary } from './mixedContentResources'

import type { Rule } from '@/core/types'

const LABEL = 'HTTP'
const NAME = 'Mixed content'
const REFERENCE = 'https://www.w3.org/TR/mixed-content/'
const FIX = 'Update the listed URLs in your HTML, CMS content, templates or third-party configuration to HTTPS. Verify each HTTPS endpoint works; otherwise replace or remove the resource.'

export const mixedContentRule: Rule = {
  id: 'http:mixed-content',
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    userGuide: {
      check: "Checks captured resource-loading src, href and data attributes, form actions and captured resource URLs for explicit HTTP references on an HTTPS page. Browser upgrading or blocking does not repair an HTTP URL in the site code.",
      action: "Replace each listed HTTP URL with a working HTTPS resource or remove the dependency. Correct the template, CMS field or third-party configuration responsible for the URL.",
    },
    provenance: 'standard',
    references: [REFERENCE],
    description: 'Flags HTTP subresource references on HTTPS pages, even if the browser upgrades or blocks them. Identifies each resource and attribute; includes network-only URLs and insecure form actions.',
  },
  async run(page) {
    const base = { label: LABEL, name: NAME }
    if (!/^https:\/\//i.test(page.url)) {
      return { ...base, message: 'Page is not HTTPS; mixed content check skipped.', type: 'info', priority: 900, details: {} }
    }
    const { resources, forms } = mixedContentResources(page)
    if (resources.length) {
      return {
        ...base,
        message: `${resources.length} mixed-content resource${resources.length === 1 ? ' uses' : 's use'} HTTP on this HTTPS page (${resourceSummary(resources)}).${forms.length ? ` Also found ${resourceSummary(forms)} with insecure actions.` : ''}`,
        type: 'error',
        priority: 80,
        details: {
          resourceIssues: [...resources, ...forms],
          problem: 'These HTTP URLs are errors in the site code, even when the browser automatically upgrades or blocks the requests.',
          fix: FIX,
          count: resources.length,
          ...(forms.length ? { insecureFormActionCount: forms.length } : {}),
          reference: REFERENCE,
        },
      }
    }
    if (forms.length) {
      return {
        ...base,
        message: `${resourceSummary(forms)} on this HTTPS page ${forms.length === 1 ? 'has an insecure HTTP action' : 'have insecure HTTP actions'}.`,
        type: 'warn',
        priority: 200,
        details: {
          resourceIssues: forms,
          problem: 'These forms send submitted data to an insecure HTTP endpoint.',
          fix: 'Update each form action to a working HTTPS endpoint before accepting submissions.',
          count: forms.length,
          reference: REFERENCE,
        },
      }
    }
    return { ...base, message: 'No HTTP subresource references or insecure form actions found in the inspected HTML and captured resource URLs.', type: 'ok', priority: 850, details: {} }
  },
}
