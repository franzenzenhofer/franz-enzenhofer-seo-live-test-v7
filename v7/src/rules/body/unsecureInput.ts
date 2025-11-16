import type { Rule } from '@/core/types'
import { extractHtmlFromList, extractSnippet } from '@/shared/html-utils'

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
      return { label: 'BODY', message: 'Page not HTTP', type: 'info', name: 'Unsecure input over HTTP' }
    }

    const pwdInputs = Array.from(page.doc.querySelectorAll('input[type="password"]'))
    if (pwdInputs.length > 0) {
      const sourceHtml = extractHtmlFromList(pwdInputs)
      return {
        label: 'BODY',
        message: 'Password input over HTTP',
        type: 'warn',
        name: 'Unsecure input over HTTP',
        details: {
          sourceHtml,
          snippet: extractSnippet(sourceHtml),
        },
      }
    }

    return {
      label: 'BODY',
      message: 'No password inputs over HTTP',
      type: 'ok',
      name: 'Unsecure input over HTTP',
    }
  },
}

