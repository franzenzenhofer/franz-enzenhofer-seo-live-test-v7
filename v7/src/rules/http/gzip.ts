import type { Rule } from '@/core/types'

const LABEL = 'HTTP'
const NAME = 'Gzip/Brotli'
const RULE_ID = 'http:gzip'
const SPEC = 'https://developer.chrome.com/docs/lighthouse/performance/uses-text-compression'
const compressible = (encoding: string | null | undefined) => {
  const lower = (encoding || '').toLowerCase()
  if (!lower) return null
  if (lower.includes('br')) return 'Brotli'
  if (lower.includes('gzip')) return 'gzip'
  return lower
}

export const gzipRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    const encoding = page.headers?.['content-encoding'] || page.headers?.['Content-Encoding'] || ''
    const compressed = compressible(encoding)
    if (!compressed) {
      return {
        label: LABEL,
        message: 'No content-encoding header (gzip or Brotli).',
        type: 'warn',
        priority: 200,
        name: NAME,
        details: { httpHeaders: page.headers || {}, reference: SPEC },
      }
    }
    if (compressed === 'gzip' || compressed === 'Brotli') {
      return {
        label: LABEL,
        message: `Compressed with ${compressed}.`,
        type: 'ok',
        priority: 900,
        name: NAME,
        details: { httpHeaders: page.headers || {}, reference: SPEC },
      }
    }
    if (compressed === encoding.toLowerCase()) {
      return {
        label: LABEL,
        message: `Unsupported content encoding (${encoding}).`,
        type: 'warn',
        priority: 100,
        name: NAME,
        details: { httpHeaders: page.headers || {}, reference: SPEC },
      }
    }
    return {
      label: LABEL,
      message: `Compressed with ${compressed}.`,
      type: 'ok',
      priority: 900,
      name: NAME,
      details: { httpHeaders: page.headers || {}, reference: SPEC },
    }
  },
}
