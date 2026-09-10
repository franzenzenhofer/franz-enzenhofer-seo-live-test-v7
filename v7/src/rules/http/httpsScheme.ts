import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'HTTP'
const NAME = 'HTTPS Scheme'
const RULE_ID = 'http:https-scheme'

export const httpsSchemeRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
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
    const message = isHttps
      ? `HTTPS in use: ${page.url}`
      : `Not using HTTPS (${protocol}): ${page.url}`
    return {
      label: LABEL,
      name: NAME,
      message,
      type: isHttps ? 'ok' : 'warn',
      priority: isHttps ? 800 : 100,
      details: {
        snippet: extractSnippet(page.url),
        url: page.url,
        protocol,
        isHttps,
      },
    }
  },
}
