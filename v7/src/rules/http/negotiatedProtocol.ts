import type { Rule } from '@/core/types'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'Negotiated Network Protocol'
const RULE_ID = 'http:negotiated-protocol'

const isHttp3 = (proto: string) => /^h3\b|^hq\b|quic/i.test(proto)
const isHttp2 = (proto: string) => /^h2\b/i.test(proto)
const isLegacy = (proto: string) => /^http\/1/i.test(proto)

export const negotiatedProtocolRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  meta: {
    provenance: 'google',
    references: [
      'https://developer.chrome.com/docs/lighthouse/best-practices/uses-http2',
      'https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/nextHopProtocol',
    ],
    description: 'Reports the actually negotiated network protocol from navigationTiming.nextHopProtocol: ok for h3/h2, error for HTTPS pages still on HTTP/1.x, info otherwise.',
  },
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const proto = page.navigationTiming?.nextHopProtocol || ''
    const isHttps = page.url.startsWith('https:')
    const details = { navigationTiming: page.navigationTiming || null, url: page.url, nextHopProtocol: proto }
    if (!proto) {
      return { label: LABEL, name: NAME, type: 'info', priority: 900, details,
        message: 'Network protocol not captured (nextHopProtocol unavailable).' }
    }
    if (isHttp3(proto)) {
      return { label: LABEL, name: NAME, type: 'ok', priority: 800, details,
        message: `Network protocol: ${proto} (HTTP/3 – optimal performance).` }
    }
    if (isHttp2(proto)) {
      return { label: LABEL, name: NAME, type: 'ok', priority: 780, details,
        message: `Network protocol: ${proto} (HTTP/2; HTTP/3 would be optimal).` }
    }
    if (isLegacy(proto) && isHttps) {
      return { label: LABEL, name: NAME, type: 'error', priority: 200, details,
        message: `Network protocol: ${proto} (outdated). Upgrade to HTTP/2 or HTTP/3.` }
    }
    return { label: LABEL, name: NAME, type: 'info', priority: 800, details,
      message: `Network protocol: ${proto}.` }
  },
}
