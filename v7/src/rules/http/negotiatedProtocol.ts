import type { Rule } from '@/core/types'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'

const LABEL = 'HTTP'
const NAME = 'Negotiated Network Protocol'
const RULE_ID = 'http:negotiated-protocol'
const SPEC = 'https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/nextHopProtocol'

const isHttp3 = (proto: string) => /^h3\b|^hq\b|quic/i.test(proto)
const isHttp2 = (proto: string) => /^h2\b/i.test(proto)
const isLegacy = (proto: string) => /^http\/1/i.test(proto)

export const negotiatedProtocolRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    if (!hasHeaders(page.headers)) return noHeadersResult(LABEL, NAME)
    const proto = page.navigationTiming?.nextHopProtocol || ''
    const isHttps = page.url.startsWith('https:')
    const details = { navigationTiming: page.navigationTiming || null, url: page.url, nextHopProtocol: proto, reference: SPEC }
    if (!proto) {
      return { label: LABEL, name: NAME, type: 'info', priority: 900, details,
        message: 'Network protocol not captured (nextHopProtocol unavailable).' }
    }
    if (isHttp3(proto)) {
      return { label: LABEL, name: NAME, type: 'ok', priority: 800, details,
        message: `Network protocol: ${proto} (HTTP/3 – optimal performance).` }
    }
    if (isHttp2(proto)) {
      return { label: LABEL, name: NAME, type: 'warn', priority: 400, details,
        message: `Network protocol: ${proto}. Consider upgrading to HTTP/3 for better performance.` }
    }
    if (isLegacy(proto) && isHttps) {
      return { label: LABEL, name: NAME, type: 'error', priority: 200, details,
        message: `Network protocol: ${proto} (outdated). Upgrade to HTTP/2 or HTTP/3.` }
    }
    return { label: LABEL, name: NAME, type: 'info', priority: 800, details,
      message: `Network protocol: ${proto}.` }
  },
}
