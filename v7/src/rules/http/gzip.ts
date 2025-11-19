import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'HTTP'
const NAME = 'Gzip/Brotli Compression'
const RULE_ID = 'http:gzip'
const SPEC = 'https://developer.chrome.com/docs/lighthouse/performance/uses-text-compression'

const detectCompression = (encoding: string | null | undefined) => {
  const lower = (encoding || '').toLowerCase().trim()
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
    const compressionType = detectCompression(encoding)
    const isCompressed = Boolean(compressionType)
    const isStandardCompression = compressionType === 'gzip' || compressionType === 'Brotli'
    if (!isCompressed) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No content-encoding header. Consider enabling gzip or Brotli compression.',
        type: 'warn',
        priority: 200,
        details: {
          httpHeaders: page.headers || {},
          snippet: extractSnippet('(not present)'),
          encoding,
          compressionType: null,
          isCompressed: false,
          reference: SPEC,
        },
      }
    }
    if (isStandardCompression) {
      return {
        label: LABEL,
        name: NAME,
        message: `Content compressed with ${compressionType}.`,
        type: 'ok',
        priority: 800,
        details: {
          httpHeaders: page.headers || {},
          snippet: extractSnippet(encoding),
          encoding,
          compressionType,
          isCompressed: true,
          reference: SPEC,
        },
      }
    }
    return {
      label: LABEL,
      name: NAME,
      message: `Unsupported content-encoding: ${encoding}. Use gzip or Brotli.`,
      type: 'warn',
      priority: 150,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(encoding),
        encoding,
        compressionType,
        isCompressed: true,
        reference: SPEC,
      },
    }
  },
}
