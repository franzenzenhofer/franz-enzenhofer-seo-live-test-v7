import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'

const LABEL = 'HTTP'
const NAME = 'Gzip/Brotli Compression'
const RULE_ID = 'http:gzip'
const SPEC = 'https://developer.mozilla.org/de/docs/Web/HTTP/Reference/Headers/Content-Encoding'

const KNOWN_ENCODINGS: Record<string, { note: string; modern: boolean }> = {
  br: { note: 'Brotli (modern, recommended)', modern: true },
  gzip: { note: 'Gzip (widely supported, recommended)', modern: true },
  deflate: { note: 'Deflate (legacy, avoid for cross-vendor issues)', modern: false },
  compress: { note: 'LZW compress (obsolete)', modern: false },
  zstd: { note: 'Zstandard (emerging, not widely supported in browsers yet)', modern: false },
  identity: { note: 'identity (no compression)', modern: false },
}

const parseEncodings = (encodingHeader: string | null | undefined) =>
  (encodingHeader || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

export const gzipRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    const encodingHeader = page.headers?.['content-encoding'] || page.headers?.['Content-Encoding'] || ''
    const encodings = parseEncodings(encodingHeader)
    const details = encodings.map((enc) => ({ encoding: enc, ...(KNOWN_ENCODINGS[enc] || { note: 'Unknown encoding', modern: false }) }))
    const hasModern = encodings.some((e) => e === 'br' || e === 'gzip')

    if (!encodings.length) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No content-encoding header. Enable gzip or Brotli compression.',
        type: 'error',
        priority: 50,
        details: {
          httpHeaders: page.headers || {},
          snippet: extractSnippet('(not present)'),
          encoding: '',
          compressionType: null,
          isCompressed: false,
          encodings,
          notes: details,
          reference: SPEC,
        },
      }
    }

    if (hasModern) {
      return {
        label: LABEL,
        name: NAME,
        message: `Content compressed with ${encodings.join(', ')}.`,
        type: 'ok',
        priority: 800,
        details: {
          httpHeaders: page.headers || {},
          snippet: extractSnippet(encodingHeader),
          encoding: encodingHeader,
          compressionType: encodings.join(', '),
          isCompressed: true,
          encodings,
          notes: details,
          reference: SPEC,
        },
      }
    }
    return {
      label: LABEL,
      name: NAME,
      message: `Unsupported content-encoding: ${encodings.join(', ')}. Use gzip or Brotli.`,
      type: 'warn',
      priority: 150,
      details: {
        httpHeaders: page.headers || {},
        snippet: extractSnippet(encodingHeader),
        encoding: encodingHeader,
        compressionType: encodings.join(', '),
        isCompressed: true,
        encodings,
        notes: details,
        reference: SPEC,
      },
    }
  },
}
