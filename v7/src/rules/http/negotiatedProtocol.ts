import type { Rule } from '@/core/types'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'Negotiated Network Protocol'
const RULE_ID = 'http:negotiated-protocol'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/nextHopProtocol'

const isModern = (proto: string) => /^h2\b|^h3\b|^hq\b|quic/i.test(proto)

export const negotiatedProtocolRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const proto = page.navigationTiming?.nextHopProtocol || ''
    const isHttps = page.url.startsWith('https:')
    if (!proto) {
      return {
        label: LABEL,
        name: NAME,
        message: 'Network protocol not captured (nextHopProtocol unavailable).',
        type: 'info',
        priority: 900,
        details: { navigationTiming: page.navigationTiming || null, url: page.url, reference: SPEC },
      }
    }
    const modern = isModern(proto)
    const needsUpgrade = isHttps && !modern
    return {
      label: LABEL,
      name: NAME,
      message: needsUpgrade ? `Network protocol: ${proto} (HTTPS without HTTP/2+).` : `Network protocol: ${proto}.`,
      type: needsUpgrade ? 'warn' : 'info',
      priority: needsUpgrade ? 300 : 800,
      details: { navigationTiming: page.navigationTiming || null, url: page.url, nextHopProtocol: proto, reference: SPEC },
    }
  },
}
