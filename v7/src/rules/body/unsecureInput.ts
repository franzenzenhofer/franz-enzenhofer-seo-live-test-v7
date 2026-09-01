import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'
import { getDomPaths } from '@/shared/dom-path'
import { sampleElements } from '@/shared/domEvidence'

const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/Security/Insecure_passwords'

export const unsecureInputRule: Rule = {
  id: 'body:unsecure-input',
  name: 'Unsecure input over HTTP',
  enabled: true,
  what: 'static',
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
        details: { protocol: proto || 'unknown', tested: 'Only flags password inputs on HTTP pages', reference: SPEC },
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
          reference: SPEC,
        },
      }
    }

    return {
      label: 'BODY',
      message: 'No password inputs over HTTP',
      type: 'ok',
      priority: 850,
      name: 'Unsecure input over HTTP',
      details: { protocol: proto || 'http:', count: pwdInputs.total, tested: 'Searched for <input type="password"> over HTTP', reference: SPEC },
    }
  },
}
