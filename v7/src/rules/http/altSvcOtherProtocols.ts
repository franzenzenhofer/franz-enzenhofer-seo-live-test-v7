import type { Rule } from '@/core/types'

export const altSvcOtherProtocolsRule: Rule = {
  id: 'http:alt-svc-other',
  name: 'Alt-Svc other protocols',
  enabled: true,
  what: 'http',
  async run(page) {
    const alt = (page.headers?.['alt-svc'] || '').toLowerCase()
    const known = /(h2|h3)/g
    const hasAlt = !!alt
    const stripped = alt.replace(known, '')
    const other = /quic|spdy|http\/1\.1/.test(stripped)
    return {
      label: 'HTTP',
      message: hasAlt && other ? `Alt-Svc other protocols: ${alt}` : 'No other Alt-Svc protocols',
      type: 'info',
      name: 'altSvcOtherProtocols',
      details: { httpHeaders: page.headers || {} },
    }
  },
}

