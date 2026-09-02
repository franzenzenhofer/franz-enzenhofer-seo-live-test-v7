import type { Rule } from '@/core/types'
import { extractSnippet } from '@/shared/html-utils'
import { hasHeaders, noHeadersResult } from '@/shared/http-utils'
import { normalizeUrl } from '@/shared/url-utils'

const LABEL = 'HTTP'
const NAME = 'Gzip/Brotli Compression'
const RULE_ID = 'http:gzip'

const KNOWN_ENCODINGS: Record<string, { note: string; accepted: boolean }> = {
  br: { note: 'Brotli (modern, recommended)', accepted: true },
  gzip: { note: 'Gzip (widely supported, recommended)', accepted: true },
  zstd: { note: 'Zstandard (modern; Chrome/Edge 123+, Firefox 126+, Safari 26+)', accepted: true },
  deflate: { note: 'Deflate (legacy but accepted; prefer gzip or Brotli)', accepted: true },
  compress: { note: 'LZW compress (obsolete)', accepted: false },
  identity: { note: 'identity (no compression)', accepted: false },
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
  meta: {
    provenance: 'google',
    references: [
      'https://developer.chrome.com/docs/lighthouse/performance/uses-text-compression',
      'https://www.iana.org/assignments/http-parameters/http-parameters.xhtml#content-coding',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Encoding',
      'https://caniuse.com/zstd',
    ],
    description: "Checks the main document's Content-Encoding header, passing on gzip/br/zstd/deflate, warning when absent or when only an obsolete coding is used (with a HEAD re-probe when captured headers look like an asset).",
  },
  async run(page) {
    let headers = normalizeHeaders(page.headers)
    const docIsHtml = page.doc?.documentElement?.nodeName?.toLowerCase() === 'html'
    const chainLastUrl = page.headerChain?.[page.headerChain.length - 1]?.url
    const chainMismatch = chainLastUrl ? normalizeUrl(chainLastUrl) !== normalizeUrl(page.url) : false
    const hasEncodingHeader = !!headers['content-encoding']
    // headerSource 'probe' means page.headers already came from a live HEAD of
    // page.url this run - probing again would repeat the identical request.
    const shouldProbe = hasHeaders(headers) && !hasEncodingHeader && docIsHtml &&
      (!isHtmlLike(headers) || chainMismatch) && page.headerSource !== 'probe'
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
    const details = encodings.map((enc) => ({ encoding: enc, ...(KNOWN_ENCODINGS[enc] || { note: 'Unknown encoding', accepted: false }) }))
    const hasAccepted = encodings.some((e) => KNOWN_ENCODINGS[e]?.accepted === true)

    if (!encodings.length) {
      return {
        label: LABEL,
        name: NAME,
        message: 'No content-encoding header. Enable gzip or Brotli compression.',
        type: 'warn',
        priority: 150,
        details: {
          httpHeaders: headers || {},
          snippet: extractSnippet('(not present)'),
          encoding: '',
          compressionType: null,
          isCompressed: false,
          encodings,
          notes: details,
          headerSource,
        },
      }
    }

    if (hasAccepted) {
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
        },
      }
    }
    return {
      label: LABEL,
      name: NAME,
      message: `Unsupported content-encoding: ${encodings.join(', ')}. Use gzip, Brotli, or Zstandard.`,
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
      },
    }
  },
}
