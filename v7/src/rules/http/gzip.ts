import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'
import { normalizeUrl } from '@/shared/url-utils'

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
const isHtmlLike = (headers: Record<string, string>) => {
  const ct = (headers['content-type'] || '').toLowerCase()
  return ct.includes('text/html') || ct.includes('application/xhtml+xml')
}
const normalizeHeaders = (headers?: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(headers || {}).map(([k, v]) => [k.toLowerCase(), v]))
const fetchHeadHeaders = async (url: string) => {
  try {
    const r = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    const h: Record<string, string> = {}
    r.headers.forEach((v, k) => { h[k.toLowerCase()] = v })
    return h
  } catch {
    return undefined
  }
}

export const gzipRule: Rule = {
  id: RULE_ID,
  name: NAME,
  enabled: true,
  what: 'http',
  async run(page) {
    let headers = normalizeHeaders(page.headers)
    const docIsHtml = page.doc?.documentElement?.nodeName?.toLowerCase() === 'html'
    const chainLastUrl = page.headerChain?.[page.headerChain.length - 1]?.url
    const chainMismatch = chainLastUrl ? normalizeUrl(chainLastUrl) !== normalizeUrl(page.url) : false
    const hasEncodingHeader = !!headers['content-encoding']
    const shouldProbe = hasHeaders(headers) && !hasEncodingHeader && docIsHtml && (!isHtmlLike(headers) || chainMismatch)
    let headerSource: 'captured' | 'probe' = 'captured'

    if (shouldProbe) {
      const probed = await fetchHeadHeaders(page.url)
      if (hasHeaders(probed)) {
        headers = normalizeHeaders(probed)
        headerSource = 'probe'
      }
    }
    if (!hasHeaders(headers)) return noHeadersResult(LABEL, NAME)

    const encodingHeader = headers['content-encoding'] || ''
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
          httpHeaders: headers || {},
          snippet: extractSnippet('(not present)'),
          encoding: '',
          compressionType: null,
          isCompressed: false,
          encodings,
          notes: details,
          headerSource,
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
          httpHeaders: headers || {},
          snippet: extractSnippet(encodingHeader),
          encoding: encodingHeader,
          compressionType: encodings.join(', '),
          isCompressed: true,
          encodings,
          notes: details,
          headerSource,
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
        httpHeaders: headers || {},
        snippet: extractSnippet(encodingHeader),
        encoding: encodingHeader,
        compressionType: encodings.join(', '),
        isCompressed: true,
        encodings,
        notes: details,
        headerSource,
        reference: SPEC,
      },
    }
  },
}
