import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

export const unsecureInputRule: Rule = {
  id: 'body:unsecure-input',
  name: 'Unsecure input over HTTP',
  enabled: true,
  what: 'static',
  meta: {
    provenance: 'general',
    references: [
      'https://www.chromium.org/Home/chromium-security/marking-http-as-non-secure/',
      'https://developer.mozilla.org/en-US/docs/Web/Security/Insecure_passwords',
    ],
    description:
      'On pages served over http:, warns if any input[type=password] exists; reports info (not applicable) on HTTPS pages and ok when an HTTP page has no password inputs.',
  },
  async run(page) {
    let proto = ''
    try {
      proto = new URL(page.url).protocol
    } catch {
      /* ignore */
    }

    if (proto !== 'http:') {
      return {
        label: 'BODY',
        message: 'Page served over HTTPS; insecure password-input check not applicable.',
        type: 'info',
        priority: 900,
        name: 'Unsecure input over HTTP',
        details: { protocol: proto || 'unknown', tested: 'Only flags password inputs on HTTP pages' },
      }
    }

    const pwdInputs = sampleElements(page.doc.querySelectorAll('input[type="password"]'))
    if (pwdInputs.total > 0) {
      const sourceHtml = extractHtmlFromList(pwdInputs.sample)
      return {
        label: 'BODY',
        message: 'Password input over HTTP',
        type: 'warn',
        priority: 100,
        name: 'Unsecure input over HTTP',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
          domPaths: getDomPaths(pwdInputs.sample),
          count: pwdInputs.total, shown: pwdInputs.shown, truncated: pwdInputs.truncated,
        },
      }
    }

    return {
      label: 'BODY',
      message: 'No password inputs over HTTP',
      type: 'ok',
      priority: 850,
      name: 'Unsecure input over HTTP',
      details: { protocol: proto || 'http:', count: pwdInputs.total, tested: 'Searched for <input type="password"> over HTTP' },
    }
  },
}
