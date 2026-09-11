import { textField, urlField } from '@/shared/presentation/create'
import { presentResult } from '@/shared/presentation/result'
import type { Rule } from '@/core/types'

export const httpsSchemeRule: Rule = {
  id: 'http:https-scheme', name: 'HTTPS Scheme', presentation: 1, enabled: true, what: 'http',
  meta: {
    userGuide: {
      check: "Checks the protocol in the tested page URL. HTTPS encrypts the connection when TLS succeeds; this URL-only check does not validate certificates or every resource on the page.",
      action: "Serve the page at its intended HTTPS URL and update internal links and canonical declarations. Configure the HTTP version to redirect there once HTTPS is working.",
    },
    provenance: 'google',
    references: [
      'https://web.dev/articles/enable-https',
      'https://web.dev/articles/why-https-matters',
    ],
    description: 'Checks whether the page URL uses the https: scheme; ok if HTTPS, warn otherwise.',
  },
  async run(page) {
    let protocol = ''
    let isHttps = false
    try {
      protocol = new URL(page.url).protocol
      isHttps = protocol === 'https:'
    } catch {
      protocol = 'invalid-url'
      isHttps = false
    }
    return presentResult(httpsSchemeRule, page, {
      input: 'Page URL', type: isHttps ? 'ok' : 'warn', priority: isHttps ? 800 : 100,
      values: [textField('Scheme', isHttps ? 'https:' : protocol || 'Unknown'),
        textField('HTTPS in use', isHttps ? 'Yes' : 'No')],
      detailValues: [protocol === 'invalid-url' ? textField('Page URL', page.url) : urlField('Page URL', page.url)],
      checked: [textField('Checked input', 'Page URL protocol'), textField('Criterion', 'https: scheme required to pass')],
      noMarkup: 'None - this rule checks the page URL protocol, not document markup',
    })
  },
}
